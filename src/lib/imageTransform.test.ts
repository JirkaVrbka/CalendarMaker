import { describe, expect, it } from 'vitest'

import {
  clampCoverPosition,
  composeImageTransform,
  computeCoverScale,
} from './imageTransform'

describe('computeCoverScale', () => {
  it('scales a landscape source to cover a portrait frame (width-bound)', () => {
    // 400x200 into 210x297: scale = max(210/400, 297/200) = max(0.525, 1.485).
    const scale = computeCoverScale(400, 200, 210, 297)
    expect(scale).toBeCloseTo(1.485)
    // Covers the frame in both axes.
    expect(400 * scale).toBeGreaterThanOrEqual(210 - 1e-9)
    expect(200 * scale).toBeGreaterThanOrEqual(297 - 1e-9)
  })

  it('scales a portrait source to cover a portrait frame (height-bound)', () => {
    // 200x400 into 210x297: scale = max(210/200, 297/400) = max(1.05, 0.7425).
    const scale = computeCoverScale(200, 400, 210, 297)
    expect(scale).toBeCloseTo(1.05)
    expect(200 * scale).toBeGreaterThanOrEqual(210 - 1e-9)
    expect(400 * scale).toBeGreaterThanOrEqual(297 - 1e-9)
  })

  it('returns a unit scale for non-positive image dimensions', () => {
    expect(computeCoverScale(0, 0, 210, 297)).toBe(1)
  })
})

describe('clampCoverPosition', () => {
  const frame = 100
  const scaled = 160 // image larger than frame (cover)

  it('keeps a position inside the covered range unchanged', () => {
    expect(clampCoverPosition(-30, frame, scaled)).toBe(-30)
  })

  it('clamps an over-right position to 0 (no left gap)', () => {
    expect(clampCoverPosition(20, frame, scaled)).toBe(0)
  })

  it('clamps an over-left position to frame - scaled (no right gap)', () => {
    expect(clampCoverPosition(-999, frame, scaled)).toBe(frame - scaled) // -60
  })

  it('pins to 0 when the image is smaller than the frame', () => {
    expect(clampCoverPosition(5, 100, 80)).toBe(0)
    expect(clampCoverPosition(-5, 100, 80)).toBe(0)
  })
})

describe('composeImageTransform', () => {
  const frame = { width: 100, height: 100 }
  const noPan = { offsetX: 0, offsetY: 0 }

  it('multiplies the cover scale by the user zoom', () => {
    const image = { width: 100, height: 100 }
    const placement = composeImageTransform(
      2,
      { ...noPan, scale: 1.5 },
      frame,
      image,
    )
    expect(placement.scale).toBe(3)
    expect(placement.scaledWidth).toBe(image.width * 3)
    expect(placement.scaledHeight).toBe(image.height * 3)
  })

  it('centers the image at the cover-fit baseline with no pan', () => {
    // 200x100 at coverScale 1 → scaledWidth 200 in a 100-wide frame.
    const placement = composeImageTransform(
      1,
      { ...noPan, scale: 1 },
      frame,
      { width: 200, height: 100 },
    )
    // Centered: (100 - 200) / 2 = -50 on x, exact fit (0) on y.
    expect(placement.x).toBe(-50)
    expect(placement.y).toBe(0)
    // No pan requested → offsets re-derive to zero.
    expect(placement.offsetX).toBe(0)
    expect(placement.offsetY).toBe(0)
  })

  it('keeps the frame fully covered at scale=1', () => {
    const placement = composeImageTransform(
      1,
      { ...noPan, scale: 1 },
      frame,
      { width: 200, height: 100 },
    )
    expect(placement.x).toBeLessThanOrEqual(0)
    expect(placement.x + placement.scaledWidth).toBeGreaterThanOrEqual(
      frame.width,
    )
  })

  it('clamps an out-of-range fractional pan when zoomed in, keeping the frame covered', () => {
    // coverScale 1, zoom 2 → scaledWidth 400; a fraction of 5 (= 500% of the
    // frame) is far out of range and must clamp so the frame stays covered.
    const placement = composeImageTransform(
      1,
      { offsetX: 5, offsetY: 5, scale: 2 },
      frame,
      { width: 200, height: 100 },
    )
    expect(placement.x).toBeLessThanOrEqual(0)
    expect(placement.y).toBeLessThanOrEqual(0)
    expect(placement.x + placement.scaledWidth).toBeGreaterThanOrEqual(
      frame.width,
    )
    expect(placement.y + placement.scaledHeight).toBeGreaterThanOrEqual(
      frame.height,
    )
    // Clamped to no left gap (x = 0); the re-derived fraction equals that
    // clamped position relative to centered (-150): (0 - -150) / 100 = 1.5.
    expect(placement.x).toBe(0)
    expect(placement.offsetX).toBeCloseTo(1.5)
  })

  it('round-trips an in-range fractional drag offset', () => {
    // 200x100 at coverScale 1 → centeredX -50. A fractional pan of -0.3 is
    // -0.3 * 100 = -30px from center (within the valid range).
    const placement = composeImageTransform(
      1,
      { offsetX: -0.3, offsetY: 0, scale: 1 },
      frame,
      { width: 200, height: 100 },
    )
    // Fraction round-trips unchanged.
    expect(placement.offsetX).toBeCloseTo(-0.3)
    expect(placement.offsetY).toBe(0)
    // And the top-left reflects that pan from center: -50 + -30 = -80.
    expect(placement.x).toBe(-80)
  })

  it('is resolution-independent: the same transform places the photo identically at any frame size', () => {
    // THE REGRESSION TEST for the PDF pan bug: a pixel offset moved the photo a
    // different normalized amount in the small editor frame vs the large export
    // frame. With a FRACTIONAL pan, the normalized position (x / frameWidth) is
    // identical regardless of frame size.
    const image = { width: 200, height: 100 }
    const userTransform = { offsetX: 0.15, offsetY: 0.2, scale: 1.4 }
    // Same aspect ratio at two very different sizes (export is ~8.6× the editor).
    const small = { width: 100, height: 140 }
    const large = { width: 860, height: 1204 }

    const coverSmall = computeCoverScale(
      image.width,
      image.height,
      small.width,
      small.height,
    )
    const coverLarge = computeCoverScale(
      image.width,
      image.height,
      large.width,
      large.height,
    )
    const placedSmall = composeImageTransform(coverSmall, userTransform, small, image)
    const placedLarge = composeImageTransform(coverLarge, userTransform, large, image)

    // Normalized position is identical at both frame sizes (within float tol).
    expect(placedSmall.x / small.width).toBeCloseTo(placedLarge.x / large.width, 10)
    expect(placedSmall.y / small.height).toBeCloseTo(
      placedLarge.y / large.height,
      10,
    )
    // And the re-derived fractional offsets match too.
    expect(placedSmall.offsetX).toBeCloseTo(placedLarge.offsetX, 10)
    expect(placedSmall.offsetY).toBeCloseTo(placedLarge.offsetY, 10)
  })
})
