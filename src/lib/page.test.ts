import { describe, expect, it } from 'vitest'

import { A4_PORTRAIT, fitPageSize, getAspectRatio } from './page'

describe('A4 geometry', () => {
  it('A4 portrait is 210mm × 297mm', () => {
    expect(A4_PORTRAIT.widthMm).toBe(210)
    expect(A4_PORTRAIT.heightMm).toBe(297)
    expect(A4_PORTRAIT.orientation).toBe('portrait')
  })

  it('aspect ratio is width / height (~0.707)', () => {
    expect(getAspectRatio(A4_PORTRAIT)).toBeCloseTo(210 / 297, 5)
  })
})

describe('fitPageSize', () => {
  it('fills the height when width is abundant', () => {
    const size = fitPageSize(A4_PORTRAIT, { maxWidth: 1000, maxHeight: 297 })
    expect(size.height).toBeCloseTo(297, 5)
    expect(size.width).toBeCloseTo(210, 5)
  })

  it('clamps to width when height is abundant, keeping aspect', () => {
    const size = fitPageSize(A4_PORTRAIT, { maxWidth: 100, maxHeight: 1000 })
    expect(size.width).toBeCloseTo(100, 5)
    expect(size.height).toBeCloseTo(100 / getAspectRatio(A4_PORTRAIT), 5)
    expect(size.width / size.height).toBeCloseTo(getAspectRatio(A4_PORTRAIT), 5)
  })

  it('returns zero for an unmeasured container', () => {
    expect(fitPageSize(A4_PORTRAIT, { maxWidth: 0, maxHeight: 500 })).toEqual({
      width: 0,
      height: 0,
    })
  })
})
