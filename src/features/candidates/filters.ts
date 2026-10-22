import type { CandidateFilterInput } from '../../gql/graphql'

export function buildCandidateFilter(search: string, skill: string): CandidateFilterInput | undefined {
  const conditions: CandidateFilterInput[] = []
  if (search.trim()) conditions.push({ fullName: { contains: search.trim() } })
  if (skill) conditions.push({ skills: { some: { eq: skill } } })
  return conditions.length ? { and: conditions } : undefined
}

