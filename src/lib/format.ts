import type { EmploymentType, WorkMode } from '../gql/graphql'

export function formatSalary(salary: { min: number; max: number; currency: string } | null | undefined): string | null {
  if (!salary) return null
  const fmt = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })
  return `${fmt.format(salary.min)}–${fmt.format(salary.max)} ${salary.currency}`
}

export const WORK_MODE_LABEL: Record<WorkMode, string> = {
  ONSITE: 'On-site',
  HYBRID: 'Hybrid',
  REMOTE: 'Remote',
}

export const EMPLOYMENT_LABEL: Record<EmploymentType, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
}

const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

/** "3 days ago", "in 2 hours", "yesterday" */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const diffSeconds = (new Date(iso).getTime() - now.getTime()) / 1000
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['week', 604_800],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ]
  for (const [unit, seconds] of units) {
    if (Math.abs(diffSeconds) >= seconds) {
      return relative.format(Math.round(diffSeconds / seconds), unit)
    }
  }
  return 'just now'
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('en', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`
}

export function initials(fullName: string): string {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')
}
