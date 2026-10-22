import { funnel } from './funnel'

describe('funnel', () => {
  it('counts applicants who reached each stage and the stage-to-stage conversion', () => {
    const rows = funnel([
      { stage: 'APPLIED', count: 4 },
      { stage: 'SCREENING', count: 2 },
      { stage: 'INTERVIEW', count: 3 },
      { stage: 'OFFER', count: 1 },
      { stage: 'HIRED', count: 1 },
      { stage: 'REJECTED', count: 5 },
    ])

    expect(rows.map((r) => r.reached)).toEqual([11, 7, 5, 2, 1])
    expect(rows.map((r) => r.current)).toEqual([4, 2, 3, 1, 1])
    expect(rows[0]!.conversion).toBeNull()
    expect(rows[1]!.conversion).toBeCloseTo(7 / 11)
    expect(rows[4]!.conversion).toBeCloseTo(0.5)
  })

  it('has no conversion when the previous stage is empty', () => {
    expect(funnel([]).every((r) => r.conversion === null)).toBe(true)
  })
})
