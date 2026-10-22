import { useDeferredValue, useState } from 'react'
import { Link } from 'react-router'
import { useQuery } from 'urql'
import { Avatar, Card, Chip, EmptyState, ErrorState, PageBody, PageHeader, SectionTitle, Skeleton, StageBadge } from '../../components/ui'
import { rise } from '../../lib/motion'
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
  const total = data?.candidates?.totalCount

  return (
    <>
      <PageHeader
        eyebrow="Talent pool"
        title="Candidates"
        subtitle={<span>{total == null ? 'Loading…' : `${total} people in the talent pool`}</span>}
      >
        <div className="mx-auto flex max-w-7xl flex-wrap gap-3 px-4 pb-8 md:px-8">
          <input
            type="search"
            aria-label="Search candidates by name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name (case-sensitive)"
            className="min-w-60 flex-1 rounded-sm border border-mast-line bg-mast-2 px-3 py-2 text-sm text-mast-ink placeholder:text-mast-muted focus:border-mast-muted focus:outline-none sm:max-w-sm"
          />
          <select
            aria-label="Filter by skill"
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            className="rounded-sm border border-mast-line bg-mast-2 px-3 py-2 text-sm text-mast-ink"
          >
            <option value="">Any skill</option>
            {SKILLS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </PageHeader>

      <PageBody>
        <SectionTitle aside={total != null && `${total} shown`}>People</SectionTitle>

        {error && <ErrorState message={error.message} onRetry={() => refetch({ requestPolicy: 'network-only' })} />}
        {fetching && !data && <Skeleton className="h-96" />}
        {data?.candidates?.nodes?.length === 0 && <EmptyState title="No candidates match" />}

        {!!data?.candidates?.nodes?.length && (
          <Card marks className="divide-y divide-line">
            {data.candidates.nodes.map((c, i) => {
              const entrance = rise(i, 30)
              return (
                <Link
                  key={c.id}
                  to={`/candidates/${c.id}`}
                  className={`${entrance.className} flex flex-wrap items-center gap-4 p-4 transition-colors hover:bg-raised focus-visible:bg-raised focus-visible:outline-none`}
                  style={entrance.style}
                >
                  <Avatar name={c.fullName} />
                  <div className="min-w-48 flex-1">
                    <p className="font-display text-lg leading-tight font-semibold text-ink">{c.fullName}</p>
                    <p className="text-sm text-ink-3">
                      {c.headline} · {c.yearsOfExperience} yr{c.yearsOfExperience === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="hidden flex-wrap gap-1.5 md:flex">
                    {c.skills.slice(0, 4).map((s) => <Chip key={s}>{s}</Chip>)}
                  </div>
                  <div className="flex flex-wrap justify-end gap-1.5 sm:w-48">
                    {c.applications.map((a) => <StageBadge key={a.id} stage={a.stage} />)}
                  </div>
                </Link>
              )
            })}
          </Card>
        )}
      </PageBody>
    </>
  )
}
