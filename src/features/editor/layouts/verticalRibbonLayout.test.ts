import { describe, expect, it } from 'vitest'

import {
  computeVerticalRibbonLayout,
  stripRowY,
} from './verticalRibbonLayout'

const A4_PX = { width: 480, height: 679 }

describe('computeVerticalRibbonLayout', () => {
  it('puts the dark strip on the right and the photo fills the rest', () => {
    const l = computeVerticalRibbonLayout(A4_PX, 31)
    expect(l.strip.y).toBe(0)
    expect(l.strip.height).toBe(679)
    // Strip flush to the right edge.
    expect(l.strip.x + l.strip.width).toBeCloseTo(480, 5)
    // Photo occupies everything to the left of the strip.
    expect(l.photo.x).toBe(0)
    expect(l.photo.width).toBeCloseTo(l.strip.x, 5)
    expect(l.photo.width + l.strip.width).toBeCloseTo(480, 5)
    expect(l.photo.height).toBe(679)
  })

  it('divides the strip into equal day rows that stay inside it', () => {
    const l = computeVerticalRibbonLayout(A4_PX, 31)
    expect(l.dayCount).toBe(31)
    // First row starts at the strip top padding; rows are evenly spaced.
    const r0 = stripRowY(l, 0)
    const r1 = stripRowY(l, 1)
    expect(r1 - r0).toBeCloseTo(l.rowHeight, 5)
    expect(r0).toBeGreaterThanOrEqual(l.strip.y)
    // The last row's bottom stays within the strip.
    const lastBottom = stripRowY(l, 31)
    expect(lastBottom).toBeLessThanOrEqual(l.strip.y + l.strip.height + 1e-9)
  })

  it('places the big number top-left over the photo, above the month label', () => {
    const l = computeVerticalRibbonLayout(A4_PX, 31)
    expect(l.bigNumber.x).toBeGreaterThanOrEqual(0)
    expect(l.bigNumber.x).toBeLessThan(l.photo.width)
    expect(l.bigNumber.y).toBeLessThan(l.monthLabel.y)
    // The month number is far larger than the month label text.
    expect(l.bigNumber.fontSize).toBeGreaterThan(l.monthLabel.monthFontSize * 3)
    expect(l.monthLabel.monthFontSize).toBeGreaterThan(l.monthLabel.yearFontSize)
  })

  it('clamps a non-positive day count to one row (no divide-by-zero)', () => {
    const l = computeVerticalRibbonLayout(A4_PX, 0)
    expect(l.dayCount).toBe(1)
    expect(Number.isFinite(l.rowHeight)).toBe(true)
  })

  it('scales with the page size', () => {
    const full = computeVerticalRibbonLayout(A4_PX, 31)
    const half = computeVerticalRibbonLayout({ width: 240, height: 339.5 }, 31)
    expect(half.strip.width).toBeCloseTo(full.strip.width / 2, 4)
    expect(half.rowHeight).toBeCloseTo(full.rowHeight / 2, 4)
  })
})
