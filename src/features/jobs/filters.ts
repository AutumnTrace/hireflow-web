import type { JobPostingFilterInput, JobStatus, WorkMode } from '../../gql/graphql'

/** Translates the board's filter controls into a Hot Chocolate `where` input. */
export function buildJobFilter(search: string, modes: WorkMode[], status: JobStatus | 'ALL'): JobPostingFilterInput | undefined {
  const conditions: JobPostingFilterInput[] = []
  const term = search.trim()
  if (term) conditions.push({ title: { contains: term } })
  if (modes.length > 0) conditions.push({ workMode: { in: modes } })
  if (status !== 'ALL') conditions.push({ status: { eq: status } })
  return conditions.length > 0 ? { and: conditions } : undefined
}

