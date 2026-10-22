import clsx from 'clsx'
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import type { ApplicationStage } from '../gql/graphql'
import { initials } from '../lib/format'
import { STAGE_BADGE, STAGE_LABEL } from '../lib/stages'

/** Hairline-framed panel. `marks` adds blueprint corner marks. */
export function Card({ className, marks, ...props }: HTMLAttributes<HTMLDivElement> & { marks?: boolean }) {
  return (
    <div
      className={clsx('border border-line bg-surface', marks && 'corner-marks', className)}
      {...props}
    />
  )
}

export function Badge({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-medium ring-1 ring-inset', className ?? 'bg-muted text-ink-2 ring-line')}>
      {children}
    </span>
  )
}

export function StageBadge({ stage }: { stage: ApplicationStage }) {
  return <Badge className={`label-caps text-[0.7rem] ${STAGE_BADGE[stage]}`}>{STAGE_LABEL[stage]}</Badge>
}

/** Flat chip. `accent` is used for time-bound items such as the next interview. */
export function Chip({ children, tone = 'neutral', className }: { children: ReactNode; tone?: 'neutral' | 'accent'; className?: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-sm px-2 py-1 text-xs leading-none',
        tone === 'neutral' ? 'bg-muted text-ink-2' : 'bg-accent-soft text-accent-ink',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function SkillTag({ skill, state = 'neutral' }: { skill: string; state?: 'neutral' | 'matched' | 'missing' }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-sm px-2 py-1 text-xs leading-none',
        state === 'neutral' && 'bg-muted text-ink-2',
        state === 'matched' && 'bg-accent-soft text-accent-ink',
        state === 'missing' && 'bg-transparent text-ink-3 ring-1 ring-line ring-inset',
      )}
    >
      {state === 'matched' && <span aria-hidden>✓</span>}
      {state === 'missing' && <span className="sr-only">missing:</span>}
      {skill}
    </span>
  )
}

export function Button({ variant = 'secondary', className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'mast' }) {
  return (
    <button
      type="button"
      className={clsx(
        'inline-flex items-center justify-center gap-1.5 rounded-sm px-3.5 py-2 font-display text-sm font-semibold tracking-wide transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' && 'bg-accent text-white hover:bg-accent-strong',
        variant === 'secondary' && 'border border-line bg-surface text-ink hover:border-accent hover:bg-raised',
        variant === 'ghost' && 'text-ink-2 hover:bg-muted hover:text-ink',
        variant === 'mast' && 'border border-mast-line text-mast-ink hover:border-mast-muted hover:bg-mast-2',
        className,
      )}
      {...props}
    />
  )
}

export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span
      aria-hidden
      className={clsx(
        'inline-flex shrink-0 items-center justify-center rounded-sm bg-accent-soft font-display font-semibold tracking-wide text-accent-ink',
        size === 'sm' && 'size-7 text-xs',
        size === 'md' && 'size-9 text-sm',
        size === 'lg' && 'size-16 text-xl',
      )}
    >
      {initials(name)}
    </span>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('animate-pulse bg-muted', className)} />
}

/**
 * Full-bleed navy masthead with an eyebrow, a condensed uppercase title and a meta row.
 * `children` render inside the masthead below the title (e.g. a stage strip).
 */
export function PageHeader({
  title,
  eyebrow,
  subtitle,
  actions,
  children,
}: {
  title: ReactNode
  eyebrow?: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  children?: ReactNode
}) {
  return (
    <header className="bg-mast text-mast-ink">
      <div className="mx-auto max-w-7xl px-4 pt-8 pb-8 md:px-8 md:pt-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            {eyebrow && <div className="label-caps mb-2 text-mast-muted">{eyebrow}</div>}
            <h1 className="font-display text-4xl leading-[0.95] font-bold tracking-tight uppercase sm:text-5xl lg:text-6xl">{title}</h1>
            {subtitle && <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-mast-muted">{subtitle}</div>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>
      {children}
    </header>
  )
}

export function PageBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('mx-auto max-w-7xl px-4 py-8 md:px-8', className)}>{children}</div>
}

/** Section heading with the design's uppercase caption and a dark hairline rule. */
export function SectionTitle({ children, id, aside }: { children: ReactNode; id?: string; aside?: ReactNode }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-rule pb-2">
      <h2 id={id} className="label-caps text-ink">{children}</h2>
      {aside && <div className="text-sm text-ink-3">{aside}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card marks className="flex flex-col items-start gap-3 p-6" role="alert">
      <p className="font-display text-lg font-semibold text-ink uppercase">Something went wrong</p>
      <p className="text-sm text-ink-2">{message}</p>
      {onRetry && <Button onClick={onRetry}>Try again</Button>}
    </Card>
  )
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="border border-dashed border-line p-10 text-center">
      <p className="label-caps text-ink">{title}</p>
      {children && <div className="mt-2 text-sm text-ink-2">{children}</div>}
    </div>
  )
}
