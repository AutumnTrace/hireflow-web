import { useState } from 'react'
import { Link } from 'react-router'
import { useQuery } from 'urql'
import { Avatar, Card, EmptyState, ErrorState, PageHeader, Skeleton } from '../../components/ui'
import type { InterviewKind } from '../../gql/graphql'
import { formatDateTime, timeAgo } from '../../lib/format'
import { AgendaQuery } from './operations'

const KIND_LABEL: Record<InterviewKind, string> = {
  PHONE_SCREEN: 'Phone screen',
  TECHNICAL: 'Technical',
  SYSTEM_DESIGN: 'System design',
  BEHAVIORAL: 'Behavioral',
  ONSITE: 'On-site',
}

function Stars({ rating }: { rating: number }) {
  return (
    <span aria-label={`${rating} out of 5`} className="text-amber-500">
      {'★'.repeat(rating)}
      <span className="text-line">{'★'.repeat(5 - rating)}</span>
    </span>
  )
}

export function InterviewsPage() {
  const [days, setDays] = useState(7)
  const [{ data, fetching, error }, refetch] = useQuery({ query: AgendaQuery, variables: { days } })

  return (
    <>
      <PageHeader
        title="Interviews"
        subtitle="Upcoming agenda and recent feedback"
        actions={
          <select aria-label="Agenda window" value={days} onChange={(e) => setDays(Number(e.target.value))} className="rounded-lg border border-line bg-surface px-3 py-2 text-sm">
            <option value={1}>Next 24 hours</option>
            <option value={7}>Next 7 days</option>
            <option value={30}>Next 30 days</option>
          </select>
        }
      />

      {error && <ErrorState message={error.message} onRetry={() => refetch({ requestPolicy: 'network-only' })} />}
      {fetching && !data && <Skeleton className="h-64" />}

      {data && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section aria-labelledby="agenda-title">
            <h2 id="agenda-title" className="mb-3 text-lg font-semibold text-ink">Agenda</h2>
            {data.upcomingInterviews.length === 0 ? (
              <EmptyState title="Nothing scheduled in this window" />
            ) : (
              <ol className="space-y-3">
                {data.upcomingInterviews.map((i) => (
                  <li key={i.id}>
                    <Card className="flex gap-4 p-4">
                      <div className="w-20 shrink-0 text-center">
                        <p className="text-xs font-medium text-accent uppercase">{timeAgo(i.scheduledAt)}</p>
                        <p className="mt-1 text-xs text-ink-3">{i.durationMinutes} min</p>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-ink">
                          {KIND_LABEL[i.kind]} with{' '}
                          <Link to={`/candidates/${i.application.candidate.id}`} className="hover:text-accent">{i.application.candidate.fullName}</Link>
                        </p>
                        <p className="text-sm text-ink-2">
                          <Link to={`/jobs/${i.application.job.id}`} className="hover:text-accent">{i.application.job.title}</Link> · {i.interviewer}
                        </p>
                        <p className="text-xs text-ink-3">{formatDateTime(i.scheduledAt)}</p>
                      </div>
                    </Card>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section aria-labelledby="feedback-title">
            <h2 id="feedback-title" className="mb-3 text-lg font-semibold text-ink">Recent feedback</h2>
            <div className="space-y-3">
              {data.interviews?.nodes?.map((i) => (
                <Card key={i.id} className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={i.application.candidate.fullName} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        {i.application.candidate.fullName} · {KIND_LABEL[i.kind]}
                      </p>
                      <p className="truncate text-xs text-ink-3">{i.application.job.title} · {i.interviewer}</p>
                    </div>
                    {i.rating != null && <Stars rating={i.rating} />}
                  </div>
                  {i.feedback && <p className="mt-2 text-sm text-ink-2">“{i.feedback}”</p>}
                </Card>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  )
}
