import { describe, expect, it } from 'vitest'

import {
  cellRect,
  classicCellRect,
  classicHeaderCellRect,
  computeClassicMonthLayout,
  computeMonthPageLayout,
  GRID_COLUMNS,
  headerCellRect,
  PHOTO_REGION_FRACTION,
  splitMonthPage,
  splitMonthPageBottomPhoto,
} from './monthPageLayout'

const A4_PX = { width: 210, height: 297 }

/** The Classic Top body region is the sub-rect below the photo (~45% tall). */
const BODY_PX = {
  width: 210,
  height: 297 * (1 - PHOTO_REGION_FRACTION),
}

describe('splitMonthPage', () => {
  it('puts the photo region on top (~55%) and the grid below (~45%), full width', () => {
    const { photo, grid } = splitMonthPage(A4_PX)
    expect(photo).toEqual({
      x: 0,
      y: 0,
      width: 210,
      height: 297 * PHOTO_REGION_FRACTION,
    })
    expect(grid.x).toBe(0)
    expect(grid.width).toBe(210)
    // Grid starts exactly where the photo ends and they cover the page.
    expect(grid.y).toBeCloseTo(photo.height)
    expect(photo.height + grid.height).toBeCloseTo(297)
    expect(photo.height).toBeGreaterThan(grid.height) // top region is larger
  })

  it('keeps both regions within the page bounds', () => {
    const { photo, grid } = splitMonthPage(A4_PX)
    for (const r of [photo, grid]) {
      expect(r.x).toBeGreaterThanOrEqual(0)
      expect(r.y).toBeGreaterThanOrEqual(0)
      expect(r.x + r.width).toBeLessThanOrEqual(210 + 1e-9)
      expect(r.y + r.height).toBeLessThanOrEqual(297 + 1e-9)
    }
  })
})

describe('splitMonthPageBottomPhoto', () => {
  it('puts the grid on top (~45%) and the photo below (~55%), full width', () => {
    const { grid, photo } = splitMonthPageBottomPhoto(A4_PX)
    expect(photo).toEqual({
      x: 0,
      y: 297 * (1 - PHOTO_REGION_FRACTION),
      width: 210,
      height: 297 * PHOTO_REGION_FRACTION,
    })
    expect(grid.x).toBe(0)
    expect(grid.y).toBe(0)
    expect(grid.width).toBe(210)
    // Photo starts exactly where the grid ends and together they cover the page.
    expect(photo.y).toBeCloseTo(grid.height)
    expect(grid.height + photo.height).toBeCloseTo(297)
    expect(photo.height).toBeGreaterThan(grid.height) // bottom photo is larger
  })

  it('is the vertical mirror of splitMonthPage (regions swapped)', () => {
    const top = splitMonthPage(A4_PX)
    const bottom = splitMonthPageBottomPhoto(A4_PX)
    expect(bottom.grid.height).toBeCloseTo(top.grid.height)
    expect(bottom.photo.height).toBeCloseTo(top.photo.height)
    // The photo region is the same size but moved to the bottom.
    expect(bottom.photo.y).toBeCloseTo(bottom.grid.height)
  })
})

describe('computeMonthPageLayout', () => {
  it('splits the grid into 7 equal columns', () => {
    const layout = computeMonthPageLayout(A4_PX, 5)
    expect(GRID_COLUMNS).toBe(7)
    const expectedColumn = layout.grid.width / 7
    expect(layout.grid.columnWidth).toBeCloseTo(expectedColumn, 5)
    expect(layout.header.columnWidth).toBeCloseTo(expectedColumn, 5)
  })

  it('creates one row per week', () => {
    expect(computeMonthPageLayout(A4_PX, 4).grid.rows).toBe(4)
    expect(computeMonthPageLayout(A4_PX, 6).grid.rows).toBe(6)
  })

  it('clamps a non-positive week count to at least one row', () => {
    expect(computeMonthPageLayout(A4_PX, 0).grid.rows).toBe(1)
  })

  it('stacks title above header above grid', () => {
    const layout = computeMonthPageLayout(A4_PX, 5)
    expect(layout.title.y).toBeLessThan(layout.header.y)
    expect(layout.header.y).toBeLessThan(layout.grid.y)
  })

  it('keeps every cell inside the page bounds', () => {
    const layout = computeMonthPageLayout(A4_PX, 6)
    const first = cellRect(layout, 0, 0)
    const last = cellRect(layout, layout.grid.rows - 1, GRID_COLUMNS - 1)
    expect(first.x).toBeGreaterThanOrEqual(0)
    expect(first.y).toBeGreaterThanOrEqual(0)
    expect(last.x + last.width).toBeLessThanOrEqual(A4_PX.width + 0.001)
    expect(last.y + last.height).toBeLessThanOrEqual(A4_PX.height + 0.001)
  })

  it('positions header cells across the grid width', () => {
    const layout = computeMonthPageLayout(A4_PX, 5)
    const col0 = headerCellRect(layout, 0)
    const col6 = headerCellRect(layout, 6)
    expect(col0.x).toBeCloseTo(layout.grid.x, 5)
    expect(col6.x + col6.width).toBeCloseTo(
      layout.grid.x + layout.grid.width,
      5,
    )
  })
})

describe('computeClassicMonthLayout', () => {
  it('stacks caption, month-head, header, grid then footer without overlap', () => {
    const l = computeClassicMonthLayout(BODY_PX, 6)
    // The five bands run top-to-bottom in order and never overlap.
    expect(l.caption.y + l.caption.height).toBeLessThanOrEqual(l.monthHead.y + 1e-9)
    expect(l.monthHead.y + l.monthHead.height).toBeLessThanOrEqual(l.header.y + 1e-9)
    expect(l.header.y + l.header.height).toBeLessThanOrEqual(l.grid.y + 1e-9)
    expect(l.grid.y + l.grid.height).toBeLessThanOrEqual(l.footer.y + 1e-9)
  })

  it('gives every band a positive size and a positive font size', () => {
    const l = computeClassicMonthLayout(BODY_PX, 6)
    for (const band of [l.caption, l.monthHead, l.header, l.grid, l.footer]) {
      expect(band.width).toBeGreaterThan(0)
      expect(band.height).toBeGreaterThan(0)
    }
    expect(l.caption.titleFontSize).toBeGreaterThan(0)
    expect(l.caption.subtitleFontSize).toBeGreaterThan(0)
    expect(l.monthHead.nameFontSize).toBeGreaterThan(0)
    expect(l.monthHead.yearFontSize).toBeGreaterThan(0)
    expect(l.header.fontSize).toBeGreaterThan(0)
    expect(l.footer.fontSize).toBeGreaterThan(0)
    expect(l.dayFontSize).toBeGreaterThan(0)
  })

  it('keeps the grid in the middle: a 7-column, N-row grid of equal cells', () => {
    const l = computeClassicMonthLayout(BODY_PX, 5)
    expect(l.grid.rows).toBe(5)
    expect(l.grid.columnWidth).toBeCloseTo(l.grid.width / GRID_COLUMNS, 5)
    expect(l.header.columnWidth).toBeCloseTo(l.grid.columnWidth, 5)
    // The grid sits below the header and above the footer (the reserved bands).
    expect(l.grid.y).toBeGreaterThan(l.header.y)
    expect(l.grid.y + l.grid.height).toBeLessThan(l.footer.y + 1e-9)
  })

  it('clamps a non-positive week count to at least one row', () => {
    expect(computeClassicMonthLayout(BODY_PX, 0).grid.rows).toBe(1)
  })

  it('keeps every band and grid cell inside the body region', () => {
    const l = computeClassicMonthLayout(BODY_PX, 6)
    const first = classicCellRect(l, 0, 0)
    const last = classicCellRect(l, l.grid.rows - 1, GRID_COLUMNS - 1)
    const h0 = classicHeaderCellRect(l, 0)
    const h6 = classicHeaderCellRect(l, 6)
    expect(first.x).toBeGreaterThanOrEqual(0)
    expect(l.caption.y).toBeGreaterThanOrEqual(0)
    expect(last.x + last.width).toBeLessThanOrEqual(BODY_PX.width + 0.001)
    expect(last.y + last.height).toBeLessThanOrEqual(BODY_PX.height + 0.001)
    expect(h0.x).toBeCloseTo(l.grid.x, 5)
    expect(h6.x + h6.width).toBeCloseTo(l.grid.x + l.grid.width, 5)
  })
})

/**
 * The `fontScale` multiplier scales every derived font size while leaving the
 * band geometry fixed, so text grows/shrinks but the bands never start to
 * overlap. Each size is clamped to its band so a large scale cannot overflow.
 */
describe('computeClassicMonthLayout fontScale', () => {
  it('defaults to scale 1 when fontScale is omitted', () => {
    expect(computeClassicMonthLayout(BODY_PX, 6)).toEqual(
      computeClassicMonthLayout(BODY_PX, 6, 1),
    )
  })

  it('makes every derived font size larger for a bigger scale, smaller for a smaller one', () => {
    const base = computeClassicMonthLayout(BODY_PX, 6, 1)
    const big = computeClassicMonthLayout(BODY_PX, 6, 1.3)
    const small = computeClassicMonthLayout(BODY_PX, 6, 0.75)
    expect(big.caption.titleFontSize).toBeGreaterThan(base.caption.titleFontSize)
    expect(big.caption.subtitleFontSize).toBeGreaterThan(
      base.caption.subtitleFontSize,
    )
    expect(big.monthHead.nameFontSize).toBeGreaterThan(
      base.monthHead.nameFontSize,
    )
    expect(big.header.fontSize).toBeGreaterThan(base.header.fontSize)
    expect(big.footer.fontSize).toBeGreaterThan(base.footer.fontSize)
    expect(big.dayFontSize).toBeGreaterThan(base.dayFontSize)

    expect(small.caption.titleFontSize).toBeLessThan(base.caption.titleFontSize)
    expect(small.monthHead.nameFontSize).toBeLessThan(
      base.monthHead.nameFontSize,
    )
    expect(small.header.fontSize).toBeLessThan(base.header.fontSize)
    expect(small.dayFontSize).toBeLessThan(base.dayFontSize)
  })

  it('keeps the bands non-overlapping and the fonts inside their bands at the max scale', () => {
    const l = computeClassicMonthLayout(BODY_PX, 6, 2)
    expect(l.caption.y + l.caption.height).toBeLessThanOrEqual(l.monthHead.y + 1e-9)
    expect(l.monthHead.y + l.monthHead.height).toBeLessThanOrEqual(l.header.y + 1e-9)
    expect(l.header.y + l.header.height).toBeLessThanOrEqual(l.grid.y + 1e-9)
    expect(l.grid.y + l.grid.height).toBeLessThanOrEqual(l.footer.y + 1e-9)
    // Clamped fonts still fit within their own band's height.
    expect(l.caption.titleFontSize).toBeLessThanOrEqual(l.caption.height)
    expect(l.monthHead.nameFontSize).toBeLessThanOrEqual(l.monthHead.height)
    expect(l.header.fontSize).toBeLessThanOrEqual(l.header.height)
    expect(l.footer.fontSize).toBeLessThanOrEqual(l.footer.height)
  })
})

describe('computeMonthPageLayout fontScale', () => {
  it('defaults to scale 1 when fontScale is omitted', () => {
    expect(computeMonthPageLayout(A4_PX, 6)).toEqual(
      computeMonthPageLayout(A4_PX, 6, 1),
    )
  })

  it('makes the title, day and header font sizes larger/smaller with the scale', () => {
    const base = computeMonthPageLayout(A4_PX, 6, 1)
    const big = computeMonthPageLayout(A4_PX, 6, 1.3)
    const small = computeMonthPageLayout(A4_PX, 6, 0.75)
    expect(big.title.fontSize).toBeGreaterThan(base.title.fontSize)
    expect(big.dayFontSize).toBeGreaterThan(base.dayFontSize)
    expect(big.headerFontSize).toBeGreaterThan(base.headerFontSize)
    expect(small.title.fontSize).toBeLessThan(base.title.fontSize)
    expect(small.dayFontSize).toBeLessThan(base.dayFontSize)
    expect(small.headerFontSize).toBeLessThan(base.headerFontSize)
  })

  it('clamps the title at the max scale so it stays within its band', () => {
    const huge = computeMonthPageLayout(A4_PX, 6, 2)
    expect(huge.title.fontSize).toBeLessThanOrEqual(huge.title.height)
  })
})
