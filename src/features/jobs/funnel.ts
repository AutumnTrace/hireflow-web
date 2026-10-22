import type { ApplicationStage } from '../../gql/graphql'

const FUNNEL: ApplicationStage[] = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED']

export interface StageCount {
  stage: ApplicationStage
  count: number
}

/**
 * Applicants who reached each funnel stage or went further. Exits (rejected/withdrawn) are not
 * counted, since the API doesn't record which stage they left from.
 */
export function funnel(byStage: StageCount[]) {
  const count = (stage: ApplicationStage) => byStage.find((s) => s.stage === stage)?.count ?? 0
  const reached = FUNNEL.map((_, i) => FUNNEL.slice(i).reduce((sum, s) => sum + count(s), 0))
  return FUNNEL.map((stage, i) => ({
    stage,
    current: count(stage),
    reached: reached[i]!,
    conversion: i === 0 || reached[i - 1] === 0 ? null : reached[i]! / reached[i - 1]!,
  }))
}
