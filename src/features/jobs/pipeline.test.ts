import { daysInStage } from './pipeline'

describe('daysInStage', () => {
  const now = new Date('2026-10-22T12:00:00Z')

  it('counts whole days since the last stage change', () => {
    expect(daysInStage('2026-10-22T08:00:00Z', now)).toBe(0)
    expect(daysInStage('2026-10-21T11:00:00Z', now)).toBe(1)
    expect(daysInStage('2026-10-11T12:00:00Z', now)).toBe(11)
  })

  it('never goes negative for timestamps in the future', () => {
    expect(daysInStage('2026-10-23T12:00:00Z', now)).toBe(0)
  })
})
