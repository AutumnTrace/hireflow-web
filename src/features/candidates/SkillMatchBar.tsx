import clsx from 'clsx'
import { formatPercent } from '../../lib/format'

/** Share of a job's required skills the candidate covers, drawn as the design's 5-segment bar. */
export function SkillMatchBar({ score, label = 'Skill match' }: { score: number; label?: string }) {
  const filled = Math.round(score * 5)
  return (
    <div className="flex items-center gap-3">
      {/* Native <meter> for assistive tech; the segments below are purely visual. */}
      <meter className="sr-only" min={0} max={1} value={score} aria-label={label}>
        {formatPercent(score)}
      </meter>
      <div aria-hidden className="grid flex-1 grid-cols-5 gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={clsx('h-1', i < filled ? 'bg-accent' : 'bg-line')} />
        ))}
      </div>
      <span aria-hidden className="w-12 text-right font-display text-xl leading-none font-semibold text-accent tabular-nums">
        {formatPercent(score)}
      </span>
    </div>
  )
}
