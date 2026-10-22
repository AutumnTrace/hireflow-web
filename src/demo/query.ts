/**
 * A small in-memory interpreter for Hot Chocolate's filtering, sorting and cursor-paging
 * conventions, so demo mode accepts exactly the same `where`/`order`/`first`/`after`
 * arguments as the real API.
 */

type Row = Record<string, unknown>
type Where = Record<string, unknown>
type Order = Record<string, unknown>

const SCALAR_OPS = new Set(['eq', 'neq', 'in', 'nin', 'contains', 'ncontains', 'startsWith', 'endsWith', 'gt', 'gte', 'lt', 'lte', 'ngt', 'ngte', 'nlt', 'nlte'])
const LIST_OPS = new Set(['some', 'all', 'none', 'any'])

function compare(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0
  if (a == null) return -1
  if (b == null) return 1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b))
}

function applyScalar(op: string, value: unknown, operand: unknown): boolean {
  // Case-sensitive, exactly like Hot Chocolate's EF Core translation on SQLite and PostgreSQL.
  const text = (v: unknown) => String(v ?? '')
  switch (op) {
    case 'eq': return value === operand
    case 'neq': return value !== operand
    case 'in': return (operand as unknown[]).includes(value)
    case 'nin': return !(operand as unknown[]).includes(value)
    case 'contains': return text(value).includes(text(operand))
    case 'ncontains': return !text(value).includes(text(operand))
    case 'startsWith': return text(value).startsWith(text(operand))
    case 'endsWith': return text(value).endsWith(text(operand))
    case 'gt': return value != null && compare(value, operand) > 0
    case 'gte': return value != null && compare(value, operand) >= 0
    case 'lt': return value != null && compare(value, operand) < 0
    case 'lte': return value != null && compare(value, operand) <= 0
    case 'ngt': return !applyScalar('gt', value, operand)
    case 'ngte': return !applyScalar('gte', value, operand)
    case 'nlt': return !applyScalar('lt', value, operand)
    case 'nlte': return !applyScalar('lte', value, operand)
    default: throw new Error(`Unsupported filter operation '${op}'`)
  }
}

function matchesValue(value: unknown, condition: Where): boolean {
  return Object.entries(condition).every(([key, operand]) => {
    if (operand === undefined) return true
    if (key === 'and') return (operand as Where[]).every((c) => matchesValue(value, c))
    if (key === 'or') return (operand as Where[]).some((c) => matchesValue(value, c))
    if (SCALAR_OPS.has(key)) return applyScalar(key, value, operand)
    if (LIST_OPS.has(key) && Array.isArray(value)) {
      if (key === 'any') return (value.length > 0) === operand
      const test = (item: unknown) => matchesValue(item, operand as Where)
      if (key === 'some') return value.some(test)
      if (key === 'all') return value.every(test)
      return !value.some(test)
    }
    // Nested object field, e.g. { salary: { min: { gte: 40000 } } }
    const nested = (value as Row | null | undefined)?.[key]
    return matchesValue(nested, operand as Where)
  })
}

export function filterRows<T>(rows: readonly T[], where: Where | null | undefined): T[] {
  return where ? rows.filter((row) => matchesValue(row, where)) : [...rows]
}

function flattenOrder(order: Order, path: string[] = []): [string[], 'ASC' | 'DESC'][] {
  return Object.entries(order).flatMap(([key, dir]) =>
    typeof dir === 'string' ? [[[...path, key], dir as 'ASC' | 'DESC'] as [string[], 'ASC' | 'DESC']] : flattenOrder(dir as Order, [...path, key]),
  )
}

export function sortRows<T>(rows: T[], order: Order[] | Order | null | undefined): T[] {
  const keys = (Array.isArray(order) ? order : order ? [order] : []).flatMap((o) => flattenOrder(o))
  if (keys.length === 0) return rows
  const get = (row: T, path: string[]) => path.reduce<unknown>((v, k) => (v as Row | null | undefined)?.[k], row)
  return [...rows].sort((a, b) => {
    for (const [path, dir] of keys) {
      const result = compare(get(a, path), get(b, path))
      if (result !== 0) return dir === 'ASC' ? result : -result
    }
    return 0
  })
}

const encodeCursor = (index: number) => btoa(String(index))
const decodeCursor = (cursor: string) => Number(atob(cursor))

export interface PagingArgs {
  first?: number | null
  after?: string | null
  last?: number | null
  before?: string | null
}

/** Relay-style connection with the `totalCount` and `nodes` shortcuts Hot Chocolate adds. */
export function connection<T>(rows: readonly T[], { first, after, last, before }: PagingArgs, defaultPageSize = 10, maxPageSize = 50) {
  let start = after != null ? decodeCursor(after) + 1 : 0
  let end = before != null ? decodeCursor(before) : rows.length

  if (first != null || last == null) {
    end = Math.min(end, start + Math.min(first ?? defaultPageSize, maxPageSize))
  } else {
    start = Math.max(start, end - Math.min(last, maxPageSize))
  }

  const page = rows.slice(start, end)
  const edges = page.map((node, i) => ({ cursor: encodeCursor(start + i), node }))
  return {
    totalCount: rows.length,
    nodes: page,
    edges,
    pageInfo: {
      hasNextPage: end < rows.length,
      hasPreviousPage: start > 0,
      startCursor: edges[0]?.cursor ?? null,
      endCursor: edges[edges.length - 1]?.cursor ?? null,
    },
  }
}
