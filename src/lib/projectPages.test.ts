import { describe, expect, it } from 'vitest'

import type { MonthPage } from '../types/calendar'
import { buildProjectPages } from './projectPages'

/** Narrow to month pages for terser assertions. */
function monthPages(startMonth: number, startYear: number): MonthPage[] {
  return buildProjectPages(startMonth, startYear).filter(
    (p): p is MonthPage => p.kind === 'month',
  )
}

describe('buildProjectPages', () => {
  it('returns 13 pages: a cover at index 0 then 12 months', () => {
    const pages = buildProjectPages(0, 2026)
    expect(pages).toHaveLength(13)
    expect(pages[0]).toEqual({ kind: 'cover' })
    expect(pages.filter((p) => p.kind === 'month')).toHaveLength(12)
    expect(pages.slice(1).every((p) => p.kind === 'month')).toBe(true)
  })

  it('keeps all 12 months in the same year when starting in January', () => {
    const months = monthPages(0, 2026)
    expect(months[0]).toEqual({ kind: 'month', year: 2026, month: 0 })
    expect(months[11]).toEqual({ kind: 'month', year: 2026, month: 11 })
    expect(months.every((p) => p.year === 2026)).toBe(true)
  })

  it('crosses the year boundary: July 2026 start ends in June 2027', () => {
    const months = monthPages(6, 2026)
    // Page 1 of the project (index 0 here) is July 2026.
    expect(months[0]).toEqual({ kind: 'month', year: 2026, month: 6 })
    // The 12th month (index 11) is June 2027.
    expect(months[11]).toEqual({ kind: 'month', year: 2027, month: 5 })
  })

  it('produces consecutive months across the wrap', () => {
    const months = monthPages(11, 2026) // December 2026 start
    expect(months[0]).toEqual({ kind: 'month', year: 2026, month: 11 })
    expect(months[1]).toEqual({ kind: 'month', year: 2027, month: 0 })
    expect(months[11]).toEqual({ kind: 'month', year: 2027, month: 10 })
  })
})
