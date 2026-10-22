import clsx from 'clsx'
import { useDeferredValue, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useQuery } from 'urql'
import { Button, Chip, EmptyState, ErrorState, PageBody, PageHeader, SectionTitle, Skeleton } from '../../components/ui'
import type { JobPostingFilterInput, JobStatus, WorkMode } from '../../gql/graphql'
import { EMPLOYMENT_LABEL, WORK_MODE_LABEL, formatSalary, timeAgo } from '../../lib/format'
import { rise } from '../../lib/motion'
import { buildJobFilter } from './filters'
import { JobBoardQuery } from './operations'

const WORK_MODES: WorkMode[] = ['REMOTE', 'HYBRID', 'ONSITE']
const STATUSES: { value: JobStatus | 'ALL'; label: string }[] = [
  { value: 'OPEN', label: 'Open' },
  { value: 'ALL', label: 'All' },
]

/** Masthead toggle in the design's tab style: solid when on, outlined when off. */
function Toggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={clsx(
        'label-caps rounded-sm border px-3 py-1.5 text-[0.75rem] transition-colors',
        active ? 'border-mast-ink bg-mast-ink text-mast' : 'border-mast-line text-mast-muted hover:border-mast-muted hover:text-mast-ink',
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
  const total = data?.jobs?.totalCount

  const toggleMode = (mode: WorkMode) =>
    setModes((current) => (current.includes(mode) ? current.filter((m) => m !== mode) : [...current, mode]))

  return (
    <>
      <PageHeader
        eyebrow="Talent pipeline"
        title="Open roles"
        subtitle={<span>{total == null ? 'Loading postings…' : `${total} posting${total === 1 ? '' : 's'}`}</span>}
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 pb-8 md:px-8">
          <label className="relative min-w-60 flex-1 sm:max-w-sm">
            <span className="sr-only">Search job titles</span>
            <svg aria-hidden viewBox="0 0 16 16" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-mast-muted" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="7" cy="7" r="5" />
              <path d="m11 11 3.5 3.5" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search titles (case-sensitive)"
              className="w-full rounded-sm border border-mast-line bg-mast-2 py-2 pr-3 pl-9 text-sm text-mast-ink placeholder:text-mast-muted focus:border-mast-muted focus:outline-none"
            />
          </label>
          <fieldset className="flex flex-wrap gap-2">
            <legend className="sr-only">Work mode</legend>
            {WORK_MODES.map((mode) => (
              <Toggle key={mode} active={modes.includes(mode)} onClick={() => toggleMode(mode)}>
                {WORK_MODE_LABEL[mode]}
              </Toggle>
            ))}
          </fieldset>
          <fieldset className="flex gap-2">
            <legend className="sr-only">Status</legend>
            {STATUSES.map((s) => (
              <Toggle key={s.value} active={status === s.value} onClick={() => setStatus(s.value)}>
                {s.label}
              </Toggle>
            ))}
          </fieldset>
        </div>
      </PageHeader>

      <PageBody>
        <SectionTitle aside={total != null && `${total} result${total === 1 ? '' : 's'}`}>Postings</SectionTitle>

        {error && <ErrorState message={error.message} onRetry={() => refetch({ requestPolicy: 'network-only' })} />}

        {!error && fetching && !data && (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-48" />)}
          </div>
        )}

        {!error && total === 0 && (
          <EmptyState title="No postings match these filters">
            Try clearing the search or work-mode filters. Search is case-sensitive, like the API.
          </EmptyState>
        )}

        {/* Remount on filter change so pagination restarts from the first page. */}
        {data && <JobResults key={JSON.stringify(where ?? {})} where={where} />}
      </PageBody>
    </>
  )
}

/** Cursor pagination: one query per loaded page, each a fixed 12 items so the API can price it. */
function JobResults({ where }: { where: JobPostingFilterInput | undefined }) {
  const [cursors, setCursors] = useState<(string | null)[]>([null])
  return (
    <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
      {connection?.nodes?.map((job, i) => {
        const entrance = rise(i)
        return (
          <li key={job.id} className={entrance.className} style={entrance.style}>
            <Link
              to={`/jobs/${job.id}`}
              className="group corner-marks flex h-full flex-col border border-line bg-surface p-5 transition-[transform,box-shadow,border-color,background-color] duration-200 hover:-translate-y-0.5 hover:border-accent hover:bg-raised hover:shadow-[0_12px_28px_-16px_rgba(29,42,58,0.45)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="label-caps text-ink-3">{job.company.name}</p>
                {job.status !== 'OPEN' && <Chip>{job.status === 'DRAFT' ? 'Draft' : 'Closed'}</Chip>}
              </div>
              <h2 className="mt-1 font-display text-2xl leading-tight font-semibold text-ink group-hover:text-accent">{job.title}</h2>
              <p className="mt-1 text-sm text-ink-2">
                {[WORK_MODE_LABEL[job.workMode], EMPLOYMENT_LABEL[job.employmentType], job.location].filter(Boolean).join(' · ')}
              </p>

              <div className="mt-4 mb-5 flex flex-wrap gap-1.5">
                {job.requiredSkills.map((skill) => <Chip key={skill}>{skill}</Chip>)}
              </div>

              <div className="mt-auto flex items-end justify-between gap-2 border-t border-line pt-4">
                <span className="font-display text-lg font-semibold text-ink">
                  {formatSalary(job.salary) ?? <span className="text-sm font-normal text-ink-3">Salary not listed</span>}
                </span>
                <span className="label-caps text-[0.7rem] text-ink-3">
                  {job.pipeline.total} applicant{job.pipeline.total === 1 ? '' : 's'}
                  {job.publishedAt && <> · {timeAgo(job.publishedAt)}</>}
                </span>
              </div>
            </Link>
          </li>
        )
      })}
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
