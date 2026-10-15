import { describe, expect, it } from 'vitest'

import { computeFramedLayout } from './framedLayout'

const A4_PX = { width: 480, height: 679 }

describe('computeFramedLayout', () => {
  it('nests the photo inside the mat near the top', () => {
    const l = computeFramedLayout(A4_PX)
    expect(l.photo.x).toBeGreaterThan(l.mat.x)
    expect(l.photo.y).toBeGreaterThan(l.mat.y)
    expect(l.photo.x + l.photo.width).toBeLessThanOrEqual(l.mat.x + l.mat.width + 1e-9)
    // Photo sits in the upper part of the mat.
    expect(l.photo.y + l.photo.height).toBeLessThanOrEqual(l.mat.y + l.mat.height + 1e-9)
  })

  it('puts the caption below the photo but still on the mat', () => {
    const l = computeFramedLayout(A4_PX)
    expect(l.caption.y).toBeCloseTo(l.photo.y + l.photo.height, 5)
    expect(l.caption.y + l.caption.height).toBeLessThanOrEqual(l.mat.y + l.mat.height + 1e-9)
    expect(l.caption.monthFontSize).toBeGreaterThan(l.caption.yearFontSize)
  })

  it('places the grid card below the mat and inside the page', () => {
    const l = computeFramedLayout(A4_PX)
    expect(l.grid.y).toBeGreaterThan(l.mat.y + l.mat.height)
    expect(l.grid.height).toBeGreaterThan(0)
    expect(l.grid.y + l.grid.height).toBeLessThanOrEqual(679 + 1e-9)
    // Mat and grid card share the same horizontal extent.
    expect(l.grid.x).toBeCloseTo(l.mat.x, 5)
    expect(l.grid.width).toBeCloseTo(l.mat.width, 5)
  })

  it('keeps the mat within the page and the grid pad positive', () => {
    const l = computeFramedLayout(A4_PX)
    expect(l.mat.x).toBeGreaterThan(0)
    expect(l.mat.x + l.mat.width).toBeLessThanOrEqual(480 + 1e-9)
    expect(l.gridPad).toBeGreaterThan(0)
    expect(l.gridPad * 2).toBeLessThan(l.grid.width)
  })

  it('scales with the page size', () => {
    const full = computeFramedLayout(A4_PX)
    const half = computeFramedLayout({ width: 240, height: 339.5 })
    expect(half.mat.width).toBeCloseTo(full.mat.width / 2, 4)
    expect(half.photo.height).toBeCloseTo(full.photo.height / 2, 4)
  })
})
