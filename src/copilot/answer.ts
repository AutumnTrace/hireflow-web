/**
 * The copilot answers in a small subset of Markdown: paragraphs, "-" and "1." lists, **bold**,
 * `code`, and [n] citation markers. This parses exactly that into a tree that React renders as
 * plain elements, so model output never reaches the DOM as HTML.
 */

export type Inline =
  | { type: 'text'; text: string }
  | { type: 'bold'; children: Inline[] }
  | { type: 'code'; text: string }
  | { type: 'cite'; number: number }

export type Block =
  | { type: 'paragraph'; lines: Inline[][] }
  | { type: 'list'; ordered: boolean; start: number; items: Inline[][] }

const INLINE = /\*\*(.+?)\*\*|`([^`]+)`|\[(\d+)\]/g

export function parseInline(text: string): Inline[] {
  const out: Inline[] = []
  let last = 0
  for (const match of text.matchAll(INLINE)) {
    if (match.index > last) out.push({ type: 'text', text: text.slice(last, match.index) })
    if (match[1] !== undefined) out.push({ type: 'bold', children: parseInline(match[1]) })
    else if (match[2] !== undefined) out.push({ type: 'code', text: match[2] })
    else out.push({ type: 'cite', number: Number(match[3]) })
    last = match.index + match[0].length
  }
  if (last < text.length) out.push({ type: 'text', text: text.slice(last) })
  return out
}

const BULLET = /^\s*[-*]\s+/
const NUMBERED = /^\s*(\d+)\.\s+/

/**
 * Line by line: list items join the list before them even across blank lines (models often put a
 * blank line between numbered items), and any other line starts or extends a paragraph.
 */
export function parseAnswer(text: string): Block[] {
  const blocks: Block[] = []
  let paragraphOpen = false

  for (const line of text.trim().split('\n')) {
    if (!line.trim()) {
      paragraphOpen = false
      continue
    }
    const numbered = NUMBERED.exec(line)
    const ordered = numbered !== null
    if (ordered || BULLET.test(line)) {
      const item = parseInline(line.replace(ordered ? NUMBERED : BULLET, ''))
      const last = blocks.at(-1)
      if (last?.type === 'list' && last.ordered === ordered) last.items.push(item)
      else blocks.push({ type: 'list', ordered, start: ordered ? Number(numbered[1]) : 1, items: [item] })
      paragraphOpen = false
      continue
    }
    const last = blocks.at(-1)
    if (paragraphOpen && last?.type === 'paragraph') last.lines.push(parseInline(line))
    else blocks.push({ type: 'paragraph', lines: [parseInline(line)] })
    paragraphOpen = true
  }
  return blocks
}

/** Where a cited source lives in this app. Applications open their job's pipeline board. */
export function sourceHref(source: { source: string; job_id?: string | null; candidate_id?: string | null }): string | null {
  if (source.source.startsWith('hireflow://candidates/') && source.candidate_id) return `/candidates/${source.candidate_id}`
  if (source.job_id) return `/jobs/${source.job_id}`
  if (source.candidate_id) return `/candidates/${source.candidate_id}`
  return null
}
