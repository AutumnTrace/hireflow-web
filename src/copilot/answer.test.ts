import { parseAnswer, parseInline, sourceHref } from './answer'
import { loadRecording } from './client'

describe('parseInline', () => {
  it('splits bold, code and citation markers out of plain text', () => {
    expect(parseInline('**Daria** got 5/5.[1][2] See `c1e1`.')).toEqual([
      { type: 'bold', children: [{ type: 'text', text: 'Daria' }] },
      { type: 'text', text: ' got 5/5.' },
      { type: 'cite', number: 1 },
      { type: 'cite', number: 2 },
      { type: 'text', text: ' See ' },
      { type: 'code', text: 'c1e1' },
      { type: 'text', text: '.' },
    ])
  })

  it('keeps markup-looking text as text, never HTML', () => {
    expect(parseInline('<img src=x onerror=alert(1)>')).toEqual([{ type: 'text', text: '<img src=x onerror=alert(1)>' }])
  })
})

describe('parseAnswer', () => {
  it('recognises paragraphs, bullet lists and numbered lists', () => {
    const blocks = parseAnswer('Intro line\nsecond line\n\n- one\n- two\n\n1. first\n2. second')
    expect(blocks.map((b) => b.type)).toEqual(['paragraph', 'list', 'list'])
    expect(blocks[0]).toMatchObject({ lines: [[{ text: 'Intro line' }], [{ text: 'second line' }]] })
    expect(blocks[1]).toMatchObject({ ordered: false, items: [[{ text: 'one' }], [{ text: 'two' }]] })
    expect(blocks[2]).toMatchObject({ ordered: true, start: 1, items: [[{ text: 'first' }], [{ text: 'second' }]] })
  })

  it('keeps numbered items in one list when blank lines separate them', () => {
    const blocks = parseAnswer('1. **Daria** first\n\n2. **Cristina** second\n\n3. Ana third')
    expect(blocks).toHaveLength(1)
    expect(blocks[0]).toMatchObject({ type: 'list', ordered: true, start: 1 })
    expect(blocks[0]?.type === 'list' && blocks[0].items).toHaveLength(3)
  })

  it('starts a list right after a lead-in line', () => {
    const blocks = parseAnswer('The rest are weaker:\n- Victor\n- Radu\nThat is all.')
    expect(blocks.map((b) => b.type)).toEqual(['paragraph', 'list', 'paragraph'])
  })
})

describe('sourceHref', () => {
  it('links candidates to their profile and jobs and applications to the pipeline board', () => {
    expect(sourceHref({ source: 'hireflow://candidates/c1', candidate_id: 'c1' })).toBe('/candidates/c1')
    expect(sourceHref({ source: 'hireflow://jobs/j1', job_id: 'j1' })).toBe('/jobs/j1')
    expect(sourceHref({ source: 'hireflow://applications/a1', job_id: 'j1', candidate_id: 'c1' })).toBe('/jobs/j1')
    expect(sourceHref({ source: 'hireflow://applications/a1' })).toBeNull()
  })
})

describe('recorded answers', () => {
  it('cite only sources that exist and propose valid moves', async () => {
    const recording = await loadRecording()
    expect(recording.items.length).toBeGreaterThan(0)
    for (const { response } of recording.items) {
      const cited = parseAnswer(response.answer)
        .flatMap((block) => (block.type === 'paragraph' ? block.lines.flat() : block.items.flat()))
        .flatMap((node) => (node.type === 'cite' ? [node.number] : []))
      const known = response.sources.map((s) => s.number)
      expect(cited.filter((n) => !known.includes(n))).toEqual([])
      expect((response.proposed_actions ?? []).filter((p) => p.kind !== 'move_application' || !p.params.application_id)).toEqual([])
    }
  })
})
