import { describe, expect, it } from 'vitest'

import {
  calendarCellRect,
  calendarHeaderRect,
  computeCalendarGrid,
} from './calendarGrid'

const BOX = { width: 240, height: 160 }

describe('computeCalendarGrid', () => {
  it('fills the box with a header row on top and a body below, in 7 columns', () => {
    const g = computeCalendarGrid(BOX, 6)
    expect(g.header.y).toBe(0)
    expect(g.header.x).toBe(0)
    expect(g.header.columnWidth).toBeCloseTo(240 / 7, 5)
    expect(g.body.columnWidth).toBeCloseTo(240 / 7, 5)
    // Body starts right under the header and together they fill the height.
    expect(g.body.y).toBeCloseTo(g.header.height, 5)
    expect(g.header.height + g.body.height).toBeCloseTo(160, 5)
  })

  it('creates one body row per week and clamps a non-positive count', () => {
    expect(computeCalendarGrid(BOX, 5).body.rows).toBe(5)
    expect(computeCalendarGrid(BOX, 0).body.rows).toBe(1)
    expect(Number.isFinite(computeCalendarGrid(BOX, 0).body.rowHeight)).toBe(true)
  })

  it('honors the header fraction', () => {
    const g = computeCalendarGrid(BOX, 6, 0.1)
    expect(g.header.height).toBeCloseTo(16, 5)
  })

  it('places cells inside the box and header cells across the full width', () => {
    const g = computeCalendarGrid(BOX, 6)
    const first = calendarCellRect(g, 0, 0)
    const last = calendarCellRect(g, g.body.rows - 1, 6)
    expect(first.x).toBeCloseTo(0, 5)
    expect(first.y).toBeCloseTo(g.body.y, 5)
    expect(last.x + last.width).toBeCloseTo(240, 5)
    expect(last.y + last.height).toBeCloseTo(160, 5)

    const h0 = calendarHeaderRect(g, 0)
    const h6 = calendarHeaderRect(g, 6)
    expect(h0.x).toBeCloseTo(0, 5)
    expect(h6.x + h6.width).toBeCloseTo(240, 5)
  })
})
