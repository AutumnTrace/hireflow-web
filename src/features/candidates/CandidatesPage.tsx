import { useDeferredValue, useState } from 'react'
import { Link } from 'react-router'
import { useQuery } from 'urql'
import { Avatar, Card, EmptyState, ErrorState, PageHeader, SkillTag, Skeleton, StageBadge } from '../../components/ui'
import { buildCandidateFilter } from './filters'
import { CandidatesQuery } from './operations'

const SKILLS = ['C#', '.NET', 'React', 'TypeScript', 'GraphQL', 'SQL', 'Python']

export function CandidatesPage() {
  const [search, setSearch] = useState('')
  const [skill, setSkill] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [{ data, fetching, error }, refetch] = useQuery({
    query: CandidatesQuery,
    variables: { where: buildCandidateFilter(deferredSearch, skill) },
  })

  return (
    <>
      <PageHeader title="Candidates" subtitle={data?.candidates ? `${data.candidates.totalCount} people in the talent pool` : 'Loading…'} />

      <div className="mb-6 flex flex-wrap gap-3">
        <input
          type="search"
          aria-label="Search candidates by name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name…"
          className="min-w-60 flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:outline-2 focus:outline-accent sm:max-w-sm"
        />
        <select
          aria-label="Filter by skill"
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-sm"
        >
          <option value="">Any skill</option>
          {SKILLS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {error && <ErrorState message={error.message} onRetry={() => refetch({ requestPolicy: 'network-only' })} />}
      {fetching && !data && <Skeleton className="h-96" />}
      {data?.candidates?.nodes?.length === 0 && <EmptyState title="No candidates match" />}

      <Card className="divide-y divide-line overflow-hidden">
        {data?.candidates?.nodes?.map((c) => (
          <Link key={c.id} to={`/candidates/${c.id}`} className="flex flex-wrap items-center gap-4 p-4 hover:bg-muted focus-visible:bg-muted focus-visible:outline-none">
            <Avatar name={c.fullName} />
            <div className="min-w-48 flex-1">
              <p className="font-medium text-ink">{c.fullName}</p>
              <p className="text-sm text-ink-2">
                {c.headline} · {c.yearsOfExperience} yr{c.yearsOfExperience === 1 ? '' : 's'}
              </p>
            </div>
            <div className="hidden flex-wrap gap-1.5 md:flex">
              {c.skills.slice(0, 4).map((s) => <SkillTag key={s} skill={s} />)}
            </div>
            <div className="flex flex-wrap justify-end gap-1.5 sm:w-48">
              {c.applications.map((a) => <StageBadge key={a.id} stage={a.stage} />)}
            </div>
          </Link>
        ))}
      </Card>
    </>
  )
}
