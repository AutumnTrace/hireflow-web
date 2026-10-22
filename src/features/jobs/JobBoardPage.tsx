import clsx from 'clsx'
import { useDeferredValue, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useQuery } from 'urql'
import { Badge, Button, Card, EmptyState, ErrorState, PageHeader, SkillTag, Skeleton } from '../../components/ui'
import type { JobPostingFilterInput, JobStatus, WorkMode } from '../../gql/graphql'
import { EMPLOYMENT_LABEL, WORK_MODE_LABEL, formatSalary, timeAgo } from '../../lib/format'
import { buildJobFilter } from './filters'
import { JobBoardQuery } from './operations'

const WORK_MODES: WorkMode[] = ['REMOTE', 'HYBRID', 'ONSITE']
const STATUSES: { value: JobStatus | 'ALL'; label: string }[] = [
  { value: 'OPEN', label: 'Open' },
  { value: 'ALL', label: 'All' },
]

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={clsx(
        'rounded-full border px-3 py-1 text-sm transition-colors',
        active ? 'border-accent bg-accent-soft text-accent-ink' : 'border-line text-ink-2 hover:bg-muted',
      )}
    >
      {children}
    </button>
  )
}

export function JobBoardPage() {
  const [search, setSearch] = useState('')
  const [modes, setModes] = useState<WorkMode[]>([])
  const [status, setStatus] = useState<JobStatus | 'ALL'>('OPEN')
  const deferredSearch = useDeferredValue(search)

  const where = useMemo(() => buildJobFilter(deferredSearch, modes, status), [deferredSearch, modes, status])
  // First page drives the header count and loading/empty states; JobResults reuses it from the cache.
  const [{ data, fetching, error }, refetch] = useQuery({ query: JobBoardQuery, variables: { where, after: null } })

  const toggleMode = (mode: WorkMode) =>
    setModes((current) => (current.includes(mode) ? current.filter((m) => m !== mode) : [...current, mode]))

  return (
    <>
      <PageHeader
        title="Jobs"
        subtitle={data?.jobs ? `${data.jobs.totalCount} posting${data.jobs.totalCount === 1 ? '' : 's'}` : 'Loading postings…'}
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <label className="relative min-w-60 flex-1 sm:max-w-sm">
          <span className="sr-only">Search job titles</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search titles (case-sensitive)…"
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:outline-2 focus:outline-accent"
          />
        </label>
        <fieldset className="flex flex-wrap gap-2">
          <legend className="sr-only">Work mode</legend>
          {WORK_MODES.map((mode) => (
            <Chip key={mode} active={modes.includes(mode)} onClick={() => toggleMode(mode)}>
              {WORK_MODE_LABEL[mode]}
            </Chip>
          ))}
        </fieldset>
        <fieldset className="flex gap-2">
          <legend className="sr-only">Status</legend>
          {STATUSES.map((s) => (
            <Chip key={s.value} active={status === s.value} onClick={() => setStatus(s.value)}>
              {s.label}
            </Chip>
          ))}
        </fieldset>
      </div>

      {error && <ErrorState message={error.message} onRetry={() => refetch({ requestPolicy: 'network-only' })} />}

      {!error && fetching && !data && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-44" />)}
        </div>
      )}

      {!error && data?.jobs?.totalCount === 0 && (
        <EmptyState title="No postings match these filters">
          Try clearing the search or work-mode filters. Search is case-sensitive, like the API.
        </EmptyState>
      )}

      {/* Remount on filter change so pagination restarts from the first page. */}
      {data && <JobResults key={JSON.stringify(where ?? {})} where={where} />}
    </>
  )
}

/** Cursor pagination: one query per loaded page, each a fixed 12 items so the API can price it. */
function JobResults({ where }: { where: JobPostingFilterInput | undefined }) {
  const [cursors, setCursors] = useState<(string | null)[]>([null])
  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cursors.map((after, i) => (
        <JobPage
          key={after ?? 'first'}
          where={where}
          after={after}
          isLast={i === cursors.length - 1}
          onLoadMore={(next) => setCursors((c) => [...c, next])}
        />
      ))}
    </ul>
  )
}

interface JobPageProps {
  where: JobPostingFilterInput | undefined
  after: string | null
  isLast: boolean
  onLoadMore: (cursor: string) => void
}

function JobPage({ where, after, isLast, onLoadMore }: JobPageProps) {
  const [{ data, fetching }] = useQuery({ query: JobBoardQuery, variables: { where, after } })
  const connection = data?.jobs

  return (
    <>
      {connection?.nodes?.map((job) => (
        <li key={job.id}>
          <Link to={`/jobs/${job.id}`} className="group block h-full focus-visible:outline-2 focus-visible:outline-accent rounded-xl">
            <Card className="flex h-full flex-col p-5 transition-shadow group-hover:shadow-md">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm text-ink-2">{job.company.name}</p>
                  <h2 className="mt-0.5 font-semibold text-ink group-hover:text-accent">{job.title}</h2>
                </div>
                {job.status !== 'OPEN' && <Badge>{job.status === 'DRAFT' ? 'Draft' : 'Closed'}</Badge>}
              </div>

              <p className="mt-2 text-sm text-ink-2">
                {[WORK_MODE_LABEL[job.workMode], EMPLOYMENT_LABEL[job.employmentType], job.location].filter(Boolean).join(' · ')}
              </p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {job.requiredSkills.map((skill) => <SkillTag key={skill} skill={skill} />)}
              </div>

              <div className="mt-auto flex items-end justify-between gap-2 pt-4 text-sm">
                <span className="font-medium text-ink">{formatSalary(job.salary) ?? <span className="text-ink-3">Salary not listed</span>}</span>
                <span className="text-ink-3">
                  {job.pipeline.total} applicant{job.pipeline.total === 1 ? '' : 's'}
                  {job.publishedAt && <> · {timeAgo(job.publishedAt)}</>}
                </span>
              </div>
            </Card>
          </Link>
        </li>
      ))}
      {isLast && connection?.pageInfo.hasNextPage && (
        <li className="flex justify-center sm:col-span-2 xl:col-span-3">
          <Button disabled={fetching} onClick={() => onLoadMore(connection.pageInfo.endCursor!)}>
            Load more postings
          </Button>
        </li>
      )}
    </>
  )
}
