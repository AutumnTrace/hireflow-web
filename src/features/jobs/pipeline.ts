const DAY_MS = 86_400_000

/** Whole days since the application last changed stage. */
export function daysInStage(updatedAt: string, now: Date = new Date()): number {
  return Math.max(0, Math.floor((now.getTime() - new Date(updatedAt).getTime()) / DAY_MS))
}
