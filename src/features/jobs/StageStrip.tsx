import type { ApplicationStage } from '../../gql/graphql'
import { STAGE_LABEL } from '../../lib/stages'
import { funnel, type StageCount } from './funnel'

const SHORT: Partial<Record<ApplicationStage, string>> = { SCREENING: 'Screen' }


/** Masthead strip: 01 APPLIED · 02 SCREEN … with current counts, stage-to-stage conversion and a share bar. */
export function StageStrip({ byStage, total }: { byStage: StageCount[]; total: number }) {
  const rows = funnel(byStage)
  const exited = byStage.filter((s) => s.stage === 'REJECTED' || s.stage === 'WITHDRAWN')

  return (
    <div className="border-t border-mast-line bg-mast-2">
      <dl aria-label="Pipeline stages" className="mx-auto grid max-w-7xl grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {rows.map((row, i) => (
          <div key={row.stage} data-funnel-stage={row.stage} className="border-t border-l border-mast-line px-4 py-5 first:border-l-0 md:px-8 lg:border-t-0">
            <dt className="label-caps flex justify-between gap-2 text-mast-muted">
              <span>
                {String(i + 1).padStart(2, '0')} {SHORT[row.stage] ?? STAGE_LABEL[row.stage]}
              </span>
              {row.conversion != null && (
                <span title={`${Math.round(row.conversion * 100)}% of applicants who reached ${STAGE_LABEL[rows[i - 1]!.stage]} got this far`}>
                  {Math.round(row.conversion * 100)}%
                </span>
              )}
            </dt>
            <dd className="mt-1 font-display text-5xl leading-none font-semibold text-mast-ink tabular-nums">{row.current}</dd>
            <dd aria-hidden className="mt-4 h-0.5 bg-mast-line">
              <div className="h-full bg-mast-muted transition-[width] duration-700" style={{ width: `${total ? (row.current / total) * 100 : 0}%` }} />
            </dd>
          </div>
        ))}
      </dl>
      {exited.some((s) => s.count > 0) && (
        <p className="mx-auto max-w-7xl px-4 pb-4 text-xs text-mast-muted md:px-8">
          Left the pipeline: {exited.map((s) => `${s.count} ${STAGE_LABEL[s.stage].toLowerCase()}`).join(' · ')}
        </p>
      )}
    </div>
  )
}
