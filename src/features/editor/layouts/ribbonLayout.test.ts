import { describe, expect, it } from 'vitest'

import {
  computeRibbonLayout,
  dayColumnX,
  dividerX,
} from './ribbonLayout'

const A4_PX = { width: 480, height: 679 }

describe('computeRibbonLayout', () => {
  it('insets the photo and reserves a bottom band, together covering the page', () => {
    const l = computeRibbonLayout(A4_PX, 31)
    // Band sits flush at the bottom, full width.
    expect(l.band.x).toBe(0)
    expect(l.band.width).toBe(480)
    expect(l.band.y + l.band.height).toBeCloseTo(679, 5)
    // Photo is inset on left/top/right and meets the band at its bottom edge.
    expect(l.photo.x).toBeGreaterThan(0)
    expect(l.photo.y).toBeGreaterThan(0)
    expect(l.photo.x + l.photo.width).toBeCloseTo(480 - l.photo.x, 5)
    expect(l.photo.y + l.photo.height).toBeCloseTo(l.band.y, 5)
  })

  it('places the giant month number box in the top-right (right-aligned to a margin)', () => {
    const l = computeRibbonLayout(A4_PX, 31)
    expect(l.bigNumber.x).toBe(0)
    expect(l.bigNumber.y).toBeGreaterThanOrEqual(0)
    // The box ends short of the right edge (its right margin) and is large.
    expect(l.bigNumber.width).toBeLessThan(480)
    expect(l.bigNumber.width).toBeGreaterThan(400)
    expect(l.bigNumber.fontSize).toBeGreaterThan(l.monthLabel.fontSize * 3)
  })

  it('stacks month label above the dates area, which stays inside the band', () => {
    const l = computeRibbonLayout(A4_PX, 31)
    expect(l.monthLabel.y).toBeGreaterThanOrEqual(l.band.y)
    expect(l.dates.y).toBeGreaterThan(l.monthLabel.y)
    expect(l.dates.y + l.dates.height).toBeLessThanOrEqual(l.band.y + l.band.height + 1e-9)
    expect(l.dates.x).toBeGreaterThan(l.band.x)
  })

  it('divides the dates area into equal day columns', () => {
    const l = computeRibbonLayout(A4_PX, 31)
    expect(l.dayCount).toBe(31)
    expect(l.dayColumnWidth).toBeCloseTo(l.dates.width / 31, 5)
    // First column starts at the dates area left edge; last ends at its right.
    expect(dayColumnX(l, 0)).toBeCloseTo(l.dates.x, 5)
    expect(dayColumnX(l, 31)).toBeCloseTo(l.dates.x + l.dates.width, 5)
  })

  it('puts the day row at the top and the week row at the bottom of the dates area', () => {
    const l = computeRibbonLayout(A4_PX, 31)
    expect(l.daysRow.y).toBeCloseTo(l.dates.y, 5)
    expect(l.weeksRow.y).toBeGreaterThan(l.daysRow.y)
    expect(l.weeksRow.y + l.weeksRow.fontSize).toBeLessThanOrEqual(
      l.dividerBottom + 1e-9,
    )
  })

  it('places a week divider at the right edge of the given day cell, spanning the dates block', () => {
    const l = computeRibbonLayout(A4_PX, 31)
    // Divider after day index 6 (the 7th day) is at 7/31 of the dates width.
    expect(dividerX(l, 6)).toBeCloseTo(l.dates.x + (7 / 31) * l.dates.width, 5)
    expect(l.dividerTop).toBeCloseTo(l.dates.y, 5)
    expect(l.dividerBottom).toBeCloseTo(l.dates.y + l.dates.height, 5)
  })

  it('clamps a non-positive day count to at least one column (no divide-by-zero)', () => {
    const l = computeRibbonLayout(A4_PX, 0)
    expect(l.dayCount).toBe(1)
    expect(Number.isFinite(l.dayColumnWidth)).toBe(true)
  })

  it('scales with the page size (half-size → proportional geometry)', () => {
    const full = computeRibbonLayout(A4_PX, 31)
    const half = computeRibbonLayout({ width: 240, height: 339.5 }, 31)
    expect(half.band.height).toBeCloseTo(full.band.height / 2, 4)
    expect(half.photo.width).toBeCloseTo(full.photo.width / 2, 4)
  })
})
