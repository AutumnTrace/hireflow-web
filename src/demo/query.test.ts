import { connection, filterRows, sortRows } from './query'

const rows = [
  { title: 'Senior .NET Engineer', workMode: 'HYBRID', salary: { min: 42_000 }, skills: ['C#', 'GraphQL'] },
  { title: 'Frontend Engineer', workMode: 'REMOTE', salary: { min: 38_000 }, skills: ['React'] },
  { title: 'Data Engineer', workMode: 'REMOTE', salary: null, skills: [] as string[] },
]

describe('filterRows (Hot Chocolate filter semantics)', () => {
  it('supports scalar operations (string matching is case-sensitive, like the API)', () => {
    expect(filterRows(rows, { workMode: { eq: 'REMOTE' } })).toHaveLength(2)
    expect(filterRows(rows, { workMode: { in: ['HYBRID'] } })).toHaveLength(1)
    expect(filterRows(rows, { title: { contains: 'Engineer' } })).toHaveLength(3)
    expect(filterRows(rows, { title: { contains: 'engineer' } })).toHaveLength(0)
  })

  it('supports nested objects and null-safe comparisons', () => {
    expect(filterRows(rows, { salary: { min: { gte: 40_000 } } }).map((r) => r.title)).toEqual(['Senior .NET Engineer'])
  })

  it('supports list operations', () => {
    expect(filterRows(rows, { skills: { some: { eq: 'React' } } })).toHaveLength(1)
    expect(filterRows(rows, { skills: { any: false } })).toHaveLength(1)
  })

  it('supports and / or', () => {
    const where = { or: [{ workMode: { eq: 'HYBRID' } }, { title: { startsWith: 'Data' } }] }
    expect(filterRows(rows, where)).toHaveLength(2)
    expect(filterRows(rows, { and: [{ workMode: { eq: 'REMOTE' } }, { title: { contains: 'Front' } }] })).toHaveLength(1)
  })
})

describe('sortRows', () => {
  it('sorts by multiple keys, including nested ones', () => {
    expect(sortRows([...rows], [{ salary: { min: 'DESC' } }]).map((r) => r.title)).toEqual([
      'Senior .NET Engineer',
      'Frontend Engineer',
      'Data Engineer',
    ])
    expect(sortRows([...rows], [{ workMode: 'ASC' }, { title: 'DESC' }]).map((r) => r.title)).toEqual([
      'Senior .NET Engineer',
      'Frontend Engineer',
      'Data Engineer',
    ])
  })
})

describe('connection', () => {
  const items = Array.from({ length: 25 }, (_, i) => i)

  it('pages forward with cursors', () => {
    const first = connection(items, { first: 10 })
    expect(first.nodes).toEqual(items.slice(0, 10))
    expect(first.totalCount).toBe(25)
    expect(first.pageInfo.hasNextPage).toBe(true)

    const second = connection(items, { first: 10, after: first.pageInfo.endCursor })
    expect(second.nodes).toEqual(items.slice(10, 20))
    expect(second.pageInfo.hasPreviousPage).toBe(true)
  })

  it('caps the page size like the API (max 50)', () => {
    expect(connection(Array.from({ length: 80 }, (_, i) => i), { first: 500 }).nodes).toHaveLength(50)
  })
})
