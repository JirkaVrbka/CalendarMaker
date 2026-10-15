import { describe, expect, it } from 'vitest'

import { MONDAY } from '../types/calendar'
import {
  getDaysInMonth,
  getIsoWeekNumber,
  getMonthMatrix,
  getMonthName,
  getWeekdayHeaders,
  isWeekend,
} from './calendar'

describe('getDaysInMonth', () => {
  it('counts days including leap-year February', () => {
    expect(getDaysInMonth(2024, 1)).toBe(29) // Feb 2024 (leap)
    expect(getDaysInMonth(2023, 1)).toBe(28) // Feb 2023 (common)
    expect(getDaysInMonth(2024, 0)).toBe(31) // January
    expect(getDaysInMonth(2024, 3)).toBe(30) // April
  })
})

describe('getIsoWeekNumber', () => {
  it('matches the Helmáč ribbon reference for March 2026 (weeks 9–13)', () => {
    // March 1 2026 is a Sunday → still ISO week 9; the following Mondays step up.
    expect(getIsoWeekNumber(new Date(2026, 2, 1))).toBe(9)
    expect(getIsoWeekNumber(new Date(2026, 2, 2))).toBe(10) // first Monday
    expect(getIsoWeekNumber(new Date(2026, 2, 9))).toBe(11)
    expect(getIsoWeekNumber(new Date(2026, 2, 16))).toBe(12)
    expect(getIsoWeekNumber(new Date(2026, 2, 23))).toBe(13)
  })

  it('handles the year-boundary cases per ISO-8601', () => {
    // 2026-01-01 is a Thursday → week 1 (its week has the first Thursday).
    expect(getIsoWeekNumber(new Date(2026, 0, 1))).toBe(1)
    // 2021-01-01 is a Friday → belongs to ISO week 53 of 2020.
    expect(getIsoWeekNumber(new Date(2021, 0, 1))).toBe(53)
    // 2024-12-30 (Monday) is already ISO week 1 of 2025.
    expect(getIsoWeekNumber(new Date(2024, 11, 30))).toBe(1)
  })
})

describe('isWeekend', () => {
  it('is true only for Saturday and Sunday', () => {
    expect(isWeekend(new Date(2024, 1, 3))).toBe(true) // Sat
    expect(isWeekend(new Date(2024, 1, 4))).toBe(true) // Sun
    expect(isWeekend(new Date(2024, 1, 5))).toBe(false) // Mon
    expect(isWeekend(new Date(2024, 1, 2))).toBe(false) // Fri
  })
})

describe('getWeekdayHeaders (Monday-first)', () => {
  it('orders English columns Monday → Sunday', () => {
    expect(getWeekdayHeaders(MONDAY, 'en')).toEqual([
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
      'Sun',
    ])
  })

  it('puts the weekend in the last two columns', () => {
    const en = getWeekdayHeaders(MONDAY, 'en')
    expect(en[5]).toBe('Sat')
    expect(en[6]).toBe('Sun')
  })

  it('localizes headers for Czech, still Monday-first', () => {
    const cs = getWeekdayHeaders(MONDAY, 'cs')
    expect(cs).toHaveLength(7)
    // Monday in cs, independently formatted (2023-01-02 was a Monday).
    const mondayCs = new Intl.DateTimeFormat('cs', {
      weekday: 'short',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(2023, 0, 2)))
    expect(cs[0]).toBe(mondayCs)
    expect(cs[0]).not.toBe('Mon')
  })
})

describe('getMonthName', () => {
  it('returns English month names', () => {
    expect(getMonthName(2024, 0, 'en')).toBe('January')
    expect(getMonthName(2024, 11, 'en')).toBe('December')
  })

  it('returns Czech month names', () => {
    expect(getMonthName(2024, 0, 'cs')).toBe('Leden')
    expect(getMonthName(2024, 1, 'cs')).toBe('Únor')
  })

  it('capitalizes Czech month names and leaves English unchanged', () => {
    expect(getMonthName(2026, 1, 'cs').startsWith('Ú')).toBe(true)
    expect(getMonthName(2026, 0, 'en')).toBe('January')
  })
})

describe('getMonthMatrix', () => {
  it('produces rows of exactly 7 columns', () => {
    const matrix = getMonthMatrix(2024, 1, MONDAY)
    for (const week of matrix) expect(week).toHaveLength(7)
  })

  it('places every day of a leap-year February with none missing', () => {
    const matrix = getMonthMatrix(2024, 1, MONDAY) // Feb 2024, 29 days
    const days = matrix.flat().filter((c) => c !== null)
    expect(days).toHaveLength(29)
    expect(days.map((c) => c!.day)).toEqual(
      Array.from({ length: 29 }, (_, i) => i + 1),
    )
  })

  it('aligns the 1st to the correct Monday-first column (Feb 2024 = Thu)', () => {
    const matrix = getMonthMatrix(2024, 1, MONDAY)
    // Leading blanks: Mon, Tue, Wed are empty; Thu holds day 1.
    expect(matrix[0][0]).toBeNull()
    expect(matrix[0][1]).toBeNull()
    expect(matrix[0][2]).toBeNull()
    expect(matrix[0][3]?.day).toBe(1)
    expect(matrix[0][3]?.isWeekend).toBe(false)
  })

  it('marks Saturday/Sunday cells as weekend', () => {
    const matrix = getMonthMatrix(2024, 1, MONDAY)
    // Day 3 (Sat) and day 4 (Sun) sit in the last two columns of row 0.
    expect(matrix[0][5]?.day).toBe(3)
    expect(matrix[0][5]?.isWeekend).toBe(true)
    expect(matrix[0][6]?.day).toBe(4)
    expect(matrix[0][6]?.isWeekend).toBe(true)
  })

  it('handles a common-year February (28 days)', () => {
    const matrix = getMonthMatrix(2023, 1, MONDAY)
    const days = matrix.flat().filter((c) => c !== null)
    expect(days).toHaveLength(28)
  })

  it('gives 6 leading blanks when the 1st is a Sunday (Sep 2024, Monday-first)', () => {
    // 2024-09-01 is a Sunday → Monday-first puts it in the last column (index 6)
    // with Mon–Sat (indices 0–5) blank.
    const matrix = getMonthMatrix(2024, 8, MONDAY)
    expect(matrix[0].slice(0, 6).every((c) => c === null)).toBe(true)
    expect(matrix[0][6]?.day).toBe(1)
  })
})
