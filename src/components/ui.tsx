import clsx from 'clsx'
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import type { ApplicationStage } from '../gql/graphql'
import { initials } from '../lib/format'
import { STAGE_BADGE, STAGE_LABEL } from '../lib/stages'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx('rounded-xl border border-line bg-surface shadow-sm', className)}
      {...props}
    />
  )
}

export function Badge({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset', className ?? 'bg-muted text-ink-2 ring-line')}>
      {children}
    </span>
  )
}

export function StageBadge({ stage }: { stage: ApplicationStage }) {
  return <Badge className={STAGE_BADGE[stage]}>{STAGE_LABEL[stage]}</Badge>
}

export function SkillTag({ skill, state = 'neutral' }: { skill: string; state?: 'neutral' | 'matched' | 'missing' }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs',
        state === 'neutral' && 'bg-muted text-ink-2',
        state === 'matched' && 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
        state === 'missing' && 'bg-transparent text-ink-3 ring-1 ring-dashed ring-line ring-inset',
      )}
    >
      {state === 'matched' && <span aria-hidden>✓</span>}
      {state === 'missing' && <span className="sr-only">missing:</span>}
      {skill}
    </span>
  )
}

export function Button({ variant = 'secondary', className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }) {
  return (
    <button
      type="button"
      className={clsx(
        'inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' && 'bg-accent text-white hover:bg-accent-strong',
        variant === 'secondary' && 'border border-line bg-surface text-ink hover:bg-muted',
        variant === 'ghost' && 'text-ink-2 hover:bg-muted hover:text-ink',
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
        'inline-flex shrink-0 items-center justify-center rounded-full bg-accent-soft font-semibold text-accent-ink',
        size === 'sm' && 'size-7 text-xs',
        size === 'md' && 'size-9 text-sm',
        size === 'lg' && 'size-14 text-lg',
      )}
    >
      {initials(name)}
    </span>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('animate-pulse rounded-lg bg-muted', className)} />
}

export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-2">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card className="flex flex-col items-start gap-3 p-6" role="alert">
      <p className="font-medium text-ink">Something went wrong</p>
      <p className="text-sm text-ink-2">{message}</p>
      {onRetry && <Button onClick={onRetry}>Try again</Button>}
    </Card>
  )
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line p-10 text-center">
      <p className="font-medium text-ink">{title}</p>
      {children && <div className="mt-1 text-sm text-ink-2">{children}</div>}
    </div>
  )
}
