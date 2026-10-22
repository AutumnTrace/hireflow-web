import type { ApplicationStage } from '../gql/graphql'

/** Board columns, left to right. Terminal exits sit at the end. */
export const STAGES: readonly ApplicationStage[] = [
  'APPLIED',
  'SCREENING',
  'INTERVIEW',
  'OFFER',
  'HIRED',
  'REJECTED',
  'WITHDRAWN',
]

export const ACTIVE_STAGES: readonly ApplicationStage[] = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER']

export const EXIT_STAGES: readonly ApplicationStage[] = ['REJECTED', 'WITHDRAWN']

export const STAGE_LABEL: Record<ApplicationStage, string> = {
  APPLIED: 'Applied',
  SCREENING: 'Screening',
  INTERVIEW: 'Interview',
  OFFER: 'Offer',
  HIRED: 'Hired',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
}

/** Badge styling per stage, in the steel palette. Always paired with the text label, never colour alone. */
const IN_PROGRESS = 'bg-accent-soft text-accent-ink ring-accent/30'
const CLOSED = 'bg-muted text-ink-3 ring-line'
export const STAGE_BADGE: Record<ApplicationStage, string> = {
  APPLIED: IN_PROGRESS,
  SCREENING: IN_PROGRESS,
  INTERVIEW: IN_PROGRESS,
  OFFER: IN_PROGRESS,
  HIRED: 'bg-accent text-white ring-accent',
  REJECTED: CLOSED,
  WITHDRAWN: CLOSED,
}

/**
 * Client-side mirror of the API's state machine, used only to pre-validate drops.
 * The server stays the source of truth: every card also carries `allowedNextStages`.
 */
export function canMove(allowedNextStages: readonly ApplicationStage[], target: ApplicationStage): boolean {
  return allowedNextStages.includes(target)
}
