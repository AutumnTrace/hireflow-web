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

/** Badge styling per stage. Always paired with the text label, never colour alone. */
export const STAGE_BADGE: Record<ApplicationStage, string> = {
  APPLIED: 'bg-slate-100 text-slate-700 ring-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600',
  SCREENING: 'bg-sky-50 text-sky-800 ring-sky-300 dark:bg-sky-950 dark:text-sky-200 dark:ring-sky-800',
  INTERVIEW: 'bg-violet-50 text-violet-800 ring-violet-300 dark:bg-violet-950 dark:text-violet-200 dark:ring-violet-800',
  OFFER: 'bg-amber-50 text-amber-900 ring-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-800',
  HIRED: 'bg-emerald-50 text-emerald-800 ring-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-800',
  REJECTED: 'bg-rose-50 text-rose-800 ring-rose-300 dark:bg-rose-950 dark:text-rose-200 dark:ring-rose-800',
  WITHDRAWN: 'bg-zinc-100 text-zinc-600 ring-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-600',
}

/**
 * Client-side mirror of the API's state machine, used only to pre-validate drops.
 * The server stays the source of truth: every card also carries `allowedNextStages`.
 */
export function canMove(allowedNextStages: readonly ApplicationStage[], target: ApplicationStage): boolean {
  return allowedNextStages.includes(target)
}
