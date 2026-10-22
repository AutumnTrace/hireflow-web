import type { CSSProperties } from 'react'

/** Staggered entrance for list items. Respects prefers-reduced-motion via the global CSS rule. */
export function rise(index: number, stepMs = 45): { className: string; style: CSSProperties } {
  return { className: 'animate-rise', style: { animationDelay: `${Math.min(index, 20) * stepMs}ms` } }
}
