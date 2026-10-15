import { describe, expect, it } from 'vitest'

import {
  clampTextTopLeft,
  coverTextLayout,
  estimateTextWidth,
  topLeftToCenterFraction,
} from './coverTextLayout'

describe('coverTextLayout', () => {
  const page = { width: 200, height: 300 }

  it('places a block by its center anchor (top-left = center − half-size)', () => {
    // Center at (0.5, 0.5) of a 200×300 page → (100, 150); a 40×20 block's
    // top-left is (80, 140) — fully inside, so no clamping.
    expect(coverTextLayout({ x: 0.5, y: 0.5 }, page, 40, 20)).toEqual({
      x: 80,
      y: 140,
    })
  })

  it('clamps a block pushed past the top-left corner back onto the page', () => {
    expect(coverTextLayout({ x: 0, y: 0 }, page, 40, 20)).toEqual({
      x: 0,
      y: 0,
    })
  })

  it('clamps a block pushed past the bottom-right corner back onto the page', () => {
    // Center at (1,1) would put a 40×20 block off the page; it pins to the
    // bottom-right: (200-40, 300-20) = (160, 280).
    expect(coverTextLayout({ x: 1, y: 1 }, page, 40, 20)).toEqual({
      x: 160,
      y: 280,
    })
  })

  it('pins an oversized block to 0 on the overflowing axis', () => {
    expect(coverTextLayout({ x: 0.5, y: 0.5 }, page, 400, 20)).toEqual({
      x: 0,
      y: 140,
    })
  })

  it('is resolution-independent: the same fraction places identically at any size', () => {
    const pos = { x: 0.3, y: 0.6 }
    const small = { width: 200, height: 300 }
    const large = { width: 2000, height: 3000 } // 10× scale
    // Keep the block the same fraction of the page at both sizes.
    const smallLayout = coverTextLayout(pos, small, 40, 20)
    const largeLayout = coverTextLayout(pos, large, 400, 200)
    // Recovered center fractions must match (no clamping triggers here).
    expect(topLeftToCenterFraction(smallLayout.x, smallLayout.y, small, 40, 20)).toEqual(pos)
    expect(
      topLeftToCenterFraction(largeLayout.x, largeLayout.y, large, 400, 200),
    ).toEqual(pos)
    // And the top-left scales exactly 10×.
    expect(largeLayout.x).toBeCloseTo(smallLayout.x * 10)
    expect(largeLayout.y).toBeCloseTo(smallLayout.y * 10)
  })

  it('round-trips an in-range center fraction through layout and back', () => {
    const pos = { x: 0.42, y: 0.37 }
    const layout = coverTextLayout(pos, page, 30, 16)
    expect(topLeftToCenterFraction(layout.x, layout.y, page, 30, 16)).toEqual(pos)
  })

  it('topLeftToCenterFraction clamps an out-of-range drag before converting', () => {
    // A top-left far below/right of the page is clamped to the bottom-right
    // corner first, so the committed center stays on the page.
    const result = topLeftToCenterFraction(999, 999, page, 40, 20)
    expect(result).toEqual({ x: (160 + 20) / 200, y: (280 + 10) / 300 })
  })
})

describe('clampTextTopLeft', () => {
  const page = { width: 100, height: 100 }

  it('keeps an in-range position unchanged', () => {
    expect(clampTextTopLeft(10, 10, page, 20, 20)).toEqual({ x: 10, y: 10 })
  })

  it('clamps negatives to 0 and overflow to the max', () => {
    expect(clampTextTopLeft(-5, 200, page, 20, 20)).toEqual({ x: 0, y: 80 })
  })
})

describe('estimateTextWidth', () => {
  it('scales with character count and font size, so it is resolution-proportional', () => {
    expect(estimateTextWidth('abcd', 10, 0.5)).toBe(20)
    // Doubling the font size doubles the width (same page-fraction hit area).
    expect(estimateTextWidth('abcd', 20, 0.5)).toBe(40)
    // Empty text has zero width.
    expect(estimateTextWidth('', 20)).toBe(0)
  })
})
