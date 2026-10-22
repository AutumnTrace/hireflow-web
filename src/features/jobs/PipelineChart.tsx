import { useState } from 'react'
import type { ApplicationStage } from '../../gql/graphql'
import { EXIT_STAGES, STAGE_LABEL } from '../../lib/stages'

interface StageCount {
  stage: ApplicationStage
  count: number
}

/**
 * Single-series horizontal bar chart of where applicants currently are.
 * Pipeline stages use series-1; exits (rejected/withdrawn) use the neutral role so they
 * read as "left the funnel" rather than as another series. Values are direct-labelled,
 * each bar has a hover/focus tooltip, and a table is available to screen readers.
 */
export function PipelineChart({ byStage, total }: { byStage: StageCount[]; total: number }) {
  const [hovered, setHovered] = useState<ApplicationStage | null>(null)
  const max = Math.max(1, ...byStage.map((s) => s.count))

  return (
    <figure>
      <figcaption className="mb-3 text-sm font-medium text-ink">Where applicants are now</figcaption>

      <div className="space-y-0.5" aria-hidden>
        {byStage.map(({ stage, count }) => {
          const share = total ? Math.round((count / total) * 100) : 0
          const isExit = EXIT_STAGES.includes(stage)
          return (
            <div
              key={stage}
              className="group relative grid grid-cols-[5.5rem_1fr] items-center gap-3 rounded-md py-1"
              onMouseEnter={() => setHovered(stage)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className="text-right text-xs text-ink-2">{STAGE_LABEL[stage]}</span>
              <div className="flex items-center gap-2">
                <div
                  className="h-3.5 rounded-r-[4px] transition-[width] duration-500"
                  style={{
                    width: count === 0 ? '2px' : `calc(${(count / max) * 100}% - 2.5rem)`,
                    background: count === 0 ? 'var(--color-line)' : isExit ? 'var(--color-series-neutral)' : 'var(--color-series-1)',
                    opacity: hovered && hovered !== stage ? 0.45 : 1,
                  }}
                />
                <span className="text-xs tabular-nums text-ink-2">{count}</span>
              </div>
              {hovered === stage && (
                <div className="pointer-events-none absolute -top-9 left-24 z-10 whitespace-nowrap rounded-md border border-line bg-surface px-2 py-1 text-xs shadow-md">
                  <span className="font-medium text-ink">{STAGE_LABEL[stage]}</span>
                  <span className="text-ink-2"> · {count} of {total} ({share}%)</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <table className="sr-only">
        <caption>Applicants per stage</caption>
        <thead>
          <tr>
            <th scope="col">Stage</th>
            <th scope="col">Applicants</th>
          </tr>
        </thead>
        <tbody>
          {byStage.map(({ stage, count }) => (
            <tr key={stage}>
              <th scope="row">{STAGE_LABEL[stage]}</th>
              <td>{count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
