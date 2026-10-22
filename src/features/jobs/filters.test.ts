import { buildJobFilter } from './filters'

describe('buildJobFilter', () => {
  it('returns undefined when nothing is filtered', () => {
    expect(buildJobFilter('  ', [], 'ALL')).toBeUndefined()
  })

  it('combines search, work modes and status into one Hot Chocolate where input', () => {
    expect(buildJobFilter(' react ', ['REMOTE', 'HYBRID'], 'OPEN')).toEqual({
      and: [
        { title: { contains: 'react' } },
        { workMode: { in: ['REMOTE', 'HYBRID'] } },
        { status: { eq: 'OPEN' } },
      ],
    })
  })
})
