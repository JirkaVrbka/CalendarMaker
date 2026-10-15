import { describe, expect, it } from 'vitest'

import {
  cellRect,
  computeMonthPageLayout,
  GRID_COLUMNS,
  headerCellRect,
  PHOTO_REGION_FRACTION,
  splitMonthPage,
  splitMonthPageBottomPhoto,
} from './monthPageLayout'

const A4_PX = { width: 210, height: 297 }

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
