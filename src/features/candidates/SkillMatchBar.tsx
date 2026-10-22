import { formatPercent } from '../../lib/format'

/** Single-value meter: share of a job's required skills the candidate covers. */
export function SkillMatchBar({ score, label = 'Skill match' }: { score: number; label?: string }) {
  return (
    <div className="flex items-center gap-2">
      {/* Native <meter> for assistive tech; the styled bar below is purely visual. */}
      <meter className="sr-only" min={0} max={1} value={score} aria-label={label}>
        {formatPercent(score)}
      </meter>
      <div aria-hidden className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-r-[4px] bg-series-1 transition-[width] duration-500" style={{ width: `${score * 100}%` }} />
      </div>
      <span aria-hidden className="w-10 text-right text-sm font-medium tabular-nums text-ink">{formatPercent(score)}</span>
    </div>
  )
}
