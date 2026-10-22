import clsx from 'clsx'
import { useState } from 'react'
import { Link } from 'react-router'
import { useQuery } from 'urql'
import { Avatar, Card, EmptyState, ErrorState, PageBody, PageHeader, SectionTitle, Skeleton } from '../../components/ui'
import type { InterviewKind } from '../../gql/graphql'
import { timeAgo } from '../../lib/format'
import { rise } from '../../lib/motion'
import { AgendaQuery } from './operations'

const KIND_LABEL: Record<InterviewKind, string> = {
  PHONE_SCREEN: 'Phone screen',
  TECHNICAL: 'Technical',
  SYSTEM_DESIGN: 'System design',
  BEHAVIORAL: 'Behavioral',
  ONSITE: 'On-site',
}

const WINDOWS = [
  { days: 1, label: '24 hours' },
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
]

/** Rating in the design's card style: a display number plus five segments. */
function Rating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="sr-only">Rated {rating} out of 5</span>
      <div aria-hidden className="grid w-20 grid-cols-5 gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={clsx('h-[3px]', i < rating ? 'bg-accent' : 'bg-line')} />
        ))}
      </div>
      <span aria-hidden className="font-display text-xl leading-none font-semibold text-accent tabular-nums">{rating.toFixed(1)}</span>
    </div>
  )
}

export function InterviewsPage() {
  const [days, setDays] = useState(7)
  const [{ data, fetching, error }, refetch] = useQuery({ query: AgendaQuery, variables: { days } })

  return (
    <>
      <PageHeader
        eyebrow="Schedule"
        title="Interviews"
        subtitle={<span>Upcoming agenda and recent feedback</span>}
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 pb-8 md:px-8">
          <fieldset className="flex flex-wrap items-center gap-2">
            <legend className="label-caps float-left mr-1 text-mast-muted">Next</legend>
            {WINDOWS.map((w) => (
              <label key={w.days} className="cursor-pointer">
                <input
                  type="radio"
                  name="agenda-window"
                  value={w.days}
                  checked={days === w.days}
                  onChange={() => setDays(w.days)}
                  className="peer sr-only"
                />
                <span className="label-caps block rounded-sm border border-mast-line px-3 py-1.5 text-[0.75rem] text-mast-muted transition-colors peer-checked:border-mast-ink peer-checked:bg-mast-ink peer-checked:text-mast peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-mast-muted hover:text-mast-ink">
                  {w.label}
                </span>
              </label>
            ))}
          </fieldset>
        </div>
      </PageHeader>

      <PageBody>
        {error && <ErrorState message={error.message} onRetry={() => refetch({ requestPolicy: 'network-only' })} />}
        {fetching && !data && <Skeleton className="h-64" />}

        {data && (
          <div className="grid gap-10 lg:grid-cols-2">
            <section aria-labelledby="agenda-title">
              <SectionTitle id="agenda-title" aside={data.upcomingInterviews.length}>Agenda</SectionTitle>
              {data.upcomingInterviews.length === 0 ? (
                <EmptyState title="Nothing scheduled in this window" />
              ) : (
                <ol className="space-y-4">
                  {data.upcomingInterviews.map((i, index) => {
                    const at = new Date(i.scheduledAt)
                    const entrance = rise(index)
                    return (
                      <li key={i.id} className={entrance.className} style={entrance.style}>
                        <Card marks className="flex gap-5 p-4">
                          <div className="w-16 shrink-0 border-r border-line pr-4 text-center">
                            <p className="label-caps text-ink-3">{new Intl.DateTimeFormat('en', { weekday: 'short' }).format(at)}</p>
                            <p className="font-display text-3xl leading-none font-semibold text-ink">{at.getDate()}</p>
                            <p className="mt-1 text-xs text-ink-3">{new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit', hour12: false }).format(at)}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="label-caps text-accent-ink">{KIND_LABEL[i.kind]} · {i.durationMinutes} min · {timeAgo(i.scheduledAt)}</p>
                            <p className="font-display text-xl leading-tight font-semibold text-ink">
                              {KIND_LABEL[i.kind]} with{' '}
                              <Link to={`/candidates/${i.application.candidate.id}`} className="hover:text-accent">{i.application.candidate.fullName}</Link>
                            </p>
                            <p className="text-sm text-ink-3">
                              <Link to={`/jobs/${i.application.job.id}`} className="hover:text-accent">{i.application.job.title}</Link> · {i.interviewer}
                            </p>
                          </div>
                        </Card>
                      </li>
                    )
                  })}
                </ol>
              )}
            </section>

            <section aria-labelledby="feedback-title">
              <SectionTitle id="feedback-title">Recent feedback</SectionTitle>
              <div className="space-y-4">
                {data.interviews?.nodes?.map((i, index) => {
                  const entrance = rise(index + 1)
                  return (
                    <Card key={i.id} marks className={`${entrance.className} p-4`} style={entrance.style}>
                      <div className="flex items-center gap-3">
                        <Avatar name={i.application.candidate.fullName} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-display text-lg leading-tight font-semibold text-ink">
                            {i.application.candidate.fullName}
                          </p>
                          <p className="truncate text-xs text-ink-3">{KIND_LABEL[i.kind]} · {i.application.job.title} · {i.interviewer}</p>
                        </div>
                        {i.rating != null && <Rating rating={i.rating} />}
                      </div>
                      {i.feedback && <p className="mt-3 border-l-2 border-accent pl-3 text-sm text-ink-2">“{i.feedback}”</p>}
                    </Card>
                  )
                })}
              </div>
            </section>
          </div>
        )}
      </PageBody>
    </>
  )
}
