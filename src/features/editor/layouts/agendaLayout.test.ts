import { describe, expect, it } from 'vitest'

import {
  agendaRowRect,
  computeAgendaLayout,
  splitAgendaColumns,
} from './agendaLayout'

const A4_PX = { width: 480, height: 679 }

describe('splitAgendaColumns', () => {
  it('splits days into two balanced columns, the left taking the extra day', () => {
    expect(splitAgendaColumns(31)).toEqual({ col1: 16, col2: 15 })
    expect(splitAgendaColumns(30)).toEqual({ col1: 15, col2: 15 })
    expect(splitAgendaColumns(29)).toEqual({ col1: 15, col2: 14 })
    expect(splitAgendaColumns(28)).toEqual({ col1: 14, col2: 14 })
  })

  it('always covers every day across the two columns', () => {
    for (const n of [28, 29, 30, 31]) {
      const { col1, col2 } = splitAgendaColumns(n)
      expect(col1 + col2).toBe(n)
      expect(col1).toBeGreaterThanOrEqual(col2)
      expect(col1 - col2).toBeLessThanOrEqual(1)
    }
  })
})

describe('computeAgendaLayout', () => {
  it('reserves the photo on top and two side-by-side columns below', () => {
    const l = computeAgendaLayout(A4_PX, 31)
    expect(l.photo.x).toBe(0)
    expect(l.photo.y).toBe(0)
    expect(l.photo.width).toBe(480)
    expect(l.photo.height).toBeGreaterThan(0)
    expect(l.photo.height).toBeLessThan(679)
    // Header sits right below the photo.
    expect(l.header.y).toBeCloseTo(l.photo.height, 5)
    // Two non-overlapping columns, left then right.
    const [a, b] = l.columns
    expect(a.x).toBeGreaterThanOrEqual(0)
    expect(a.x + a.width).toBeLessThanOrEqual(b.x + 1e-9)
    expect(b.x + b.width).toBeLessThanOrEqual(480 + 1e-9)
    expect(a.width).toBeCloseTo(b.width, 5)
    expect(a.y).toBeCloseTo(b.y, 5)
  })

  it('sizes the row height to the taller column so both lists fit and align', () => {
    const l = computeAgendaLayout(A4_PX, 31)
    expect(l.rowHeight).toBeCloseTo(l.columns[0].height / 16, 5)
    // Last row of the taller (left) column stays inside the column.
    const last = agendaRowRect(l, 0, l.split.col1 - 1)
    expect(last.y + last.height).toBeLessThanOrEqual(
      l.columns[0].y + l.columns[0].height + 1e-9,
    )
  })

  it('stacks rows top-to-bottom within a column', () => {
    const l = computeAgendaLayout(A4_PX, 31)
    const r0 = agendaRowRect(l, 1, 0)
    const r1 = agendaRowRect(l, 1, 1)
    expect(r0.y).toBeCloseTo(l.columns[1].y, 5)
    expect(r1.y).toBeCloseTo(r0.y + l.rowHeight, 5)
    expect(r0.x).toBeCloseTo(l.columns[1].x, 5)
  })
})
