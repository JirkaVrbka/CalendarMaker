/**
 * Pure calendar / date math built entirely on the native `Date` and `Intl`
 * APIs — no date library. All functions are side-effect free and deterministic
 * for a given input, which keeps them fully unit-testable.
 *
 * Month arguments are **0-indexed** (0 = January, 11 = December), matching
 * `Date.prototype.getMonth()`.
 */
import type { DayCell, Language, MonthMatrix, WeekStart } from '../types/calendar'

const DAYS_IN_WEEK = 7

/** 2023-01-01 fell on a Sunday — a stable anchor for naming weekdays. */
const SUNDAY_ANCHOR_UTC = Date.UTC(2023, 0, 1)

/** True for Saturday (6) and Sunday (0) in the local calendar. */
export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6
}

/**
 * Localized full month name, e.g. `getMonthName(2026, 0, 'cs')` → "leden".
 * Uses a UTC-anchored date so the result never shifts across time zones.
 */
export function getMonthName(year: number, month: number, lang: Language): string {
  const date = new Date(Date.UTC(year, month, 1))
  return new Intl.DateTimeFormat(lang, {
    month: 'long',
    timeZone: 'UTC',
  }).format(date)
}

/**
 * The seven column headers for a week, as short localized weekday names,
 * ordered from `weekStart`. For Monday-first English this is
 * `['Mon','Tue','Wed','Thu','Fri','Sat','Sun']`.
 */
export function getWeekdayHeaders(weekStart: WeekStart, lang: Language): string[] {
  const formatter = new Intl.DateTimeFormat(lang, {
    weekday: 'short',
    timeZone: 'UTC',
  })
  const headers: string[] = []
  for (let i = 0; i < DAYS_IN_WEEK; i++) {
    const weekdayIndex = (weekStart + i) % DAYS_IN_WEEK
    const date = new Date(SUNDAY_ANCHOR_UTC + weekdayIndex * 86_400_000)
    headers.push(formatter.format(date))
  }
  return headers
}

/**
 * Full localized weekday name for a `Date.getDay()` index, e.g.
 * `getWeekdayName(1, 'en')` → "Monday", `getWeekdayName(1, 'cs')` → "pondělí".
 * Uses the same UTC-anchored date trick as `getWeekdayHeaders` so the result is
 * time-zone stable.
 */
export function getWeekdayName(weekday: WeekStart, lang: Language): string {
  const date = new Date(SUNDAY_ANCHOR_UTC + weekday * 86_400_000)
  return new Intl.DateTimeFormat(lang, {
    weekday: 'long',
    timeZone: 'UTC',
  }).format(date)
}

/**
 * The footer "week starts on…" label used by the Classic Top month page, e.g.
 * `getWeekStartLabel(1, 'en')` → "Monday start". Czech reads more naturally as
 * "Začátek týdne: pondělí", so the wording is localized rather than a literal
 * translation of the English phrase.
 */
export function getWeekStartLabel(weekStart: WeekStart, lang: Language): string {
  const name = getWeekdayName(weekStart, lang)
  return lang === 'cs' ? `Začátek týdne: ${name}` : `${name} start`
}

/** Number of days in the given 0-indexed month. */
export function getDaysInMonth(year: number, month: number): number {
  // Day 0 of the next month is the last day of this month.
  return new Date(year, month + 1, 0).getDate()
}

/**
 * ISO-8601 week number (1–53) of a date. Weeks start on Monday and week 1 is the
 * week containing the year's first Thursday, so the number is stable across the
 * year boundary. Computed on a UTC copy so it never shifts with the time zone.
 *
 * This matches the Helmáč-style ribbon reference (March 2026 → weeks 9–13) and
 * the app's Monday-first default; the numbering is intentionally ISO regardless
 * of a non-Monday `weekStart` (no standard defines week numbers otherwise).
 */
export function getIsoWeekNumber(date: Date): number {
  // Work in UTC midnight to avoid DST/offset drift.
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  )
  // ISO weekday: Mon = 1 … Sun = 7. Shift to that week's Thursday.
  const isoDay = d.getUTCDay() === 0 ? 7 : d.getUTCDay()
  d.setUTCDate(d.getUTCDate() + 4 - isoDay)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
}

/**
 * Build the month grid as weeks of 7 cells. Leading days before the 1st and
 * trailing days after the last are `null` so every row has exactly 7 columns
 * and the real days land in the correct weekday column for `weekStart`.
 */
export function getMonthMatrix(
  year: number,
  month: number,
  weekStart: WeekStart,
): MonthMatrix {
  const daysInMonth = getDaysInMonth(year, month)
  const firstWeekday = new Date(year, month, 1).getDay()
  const leadingBlanks = (firstWeekday - weekStart + DAYS_IN_WEEK) % DAYS_IN_WEEK

  const cells: Array<DayCell | null> = []
  for (let i = 0; i < leadingBlanks; i++) cells.push(null)
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    cells.push({ day, date, isWeekend: isWeekend(date) })
  }
  while (cells.length % DAYS_IN_WEEK !== 0) cells.push(null)

  const weeks: Array<Array<DayCell | null>> = []
  for (let i = 0; i < cells.length; i += DAYS_IN_WEEK) {
    weeks.push(cells.slice(i, i + DAYS_IN_WEEK))
  }
  return weeks
}
