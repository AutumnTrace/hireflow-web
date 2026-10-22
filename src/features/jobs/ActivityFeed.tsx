import { useEffect, useState } from 'react'
import { useSubscription } from 'urql'
import { Card } from '../../components/ui'
import type { PipelineActivitySubscription } from '../../gql/graphql'
import { STAGE_LABEL } from '../../lib/stages'
import { timeAgo } from '../../lib/format'
import { PipelineActivitySubscriptionDocument } from './operations'

type Event = PipelineActivitySubscription['onApplicationStageChanged']

/** Live feed of stage changes for one job, pushed over the GraphQL subscription. */
export function ActivityFeed({ jobPostingId, onEvent }: { jobPostingId: string; onEvent?: (event: Event) => void }) {
  const [, setTick] = useState(0)
  const [{ data: events = [] }] = useSubscription(
    { query: PipelineActivitySubscriptionDocument, variables: { jobPostingId } },
    (previous: Event[] = [], response) => [response.onApplicationStageChanged, ...previous].slice(0, 20),
  )

  const latest = events[0]
  useEffect(() => {
    if (latest) onEvent?.(latest)
  }, [latest, onEvent])

  // Keep "x minutes ago" labels fresh.
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30_000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section aria-labelledby="activity-title">
      <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-rule pb-2">
        <h2 id="activity-title" className="label-caps flex items-center gap-2 text-ink">
          <span className="relative flex size-2" aria-hidden>
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          Live activity
        </h2>
        <span className="text-sm text-ink-3">via GraphQL subscription</span>
      </div>
      <Card marks className="max-h-96 overflow-y-auto p-5">
        {events.length === 0 ? (
          <p className="text-sm text-ink-3">Waiting for changes. Move a card, or open this page in a second tab in Live API mode.</p>
        ) : (
          <ol className="divide-y divide-line" aria-live="polite">
            {events.map((e) => (
              <li key={`${e.applicationId}-${e.changedAt}`} className="animate-rise py-3 text-sm first:pt-0 last:pb-0">
                <span className="font-medium text-ink">{e.application.candidate.fullName}</span>{' '}
                <span className="text-ink-2">
                  moved {e.from ? <>from {STAGE_LABEL[e.from]} </> : null}to <span className="font-medium text-accent-ink">{STAGE_LABEL[e.to]}</span>
                </span>
                {e.note && <span className="block text-ink-3">“{e.note}”</span>}
                <span className="label-caps mt-1 block text-[0.7rem] text-ink-3">{timeAgo(e.changedAt)}</span>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </section>
  )
}
