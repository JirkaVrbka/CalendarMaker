/**
 * Builds the fixed 13-page structure of a calendar project: a cover page
 * followed by 12 consecutive month pages starting at (`startMonth`,
 * `startYear`). The months roll over year boundaries, so a July 2026 start
 * yields pages through June 2027.
 *
 * Pure and deterministic — months are 0-indexed (0 = January) to match
 * `Date`/`Intl` and the rest of `src/lib/calendar.ts`.
 */
import type { Page } from '../types/calendar'

/** Number of month pages after the cover. */
export const MONTHS_PER_YEAR = 12

/**
 * Returns 13 pages: index 0 is the cover, indices 1–12 are the 12 consecutive
 * months beginning at (`startMonth`, `startYear`). `startMonth` is 0-indexed.
 */
export function buildProjectPages(startMonth: number, startYear: number): Page[] {
  const pages: Page[] = [{ kind: 'cover' }]
  for (let offset = 0; offset < MONTHS_PER_YEAR; offset++) {
    const absolute = startMonth + offset
    const month = ((absolute % MONTHS_PER_YEAR) + MONTHS_PER_YEAR) % MONTHS_PER_YEAR
    const year = startYear + Math.floor(absolute / MONTHS_PER_YEAR)
    pages.push({ kind: 'month', year, month })
  }
  return pages
}
