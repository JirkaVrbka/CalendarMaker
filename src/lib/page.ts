/**
 * A4 page geometry. The physical size lives in the model (`PageSize`); these
 * helpers turn it into on-screen pixels while keeping the aspect ratio locked,
 * so the canvas page always prints true to A4.
 */
import type { PageSize } from '../types/calendar'

/** ISO 216 A4 portrait: 210 mm × 297 mm. */
export const A4_PORTRAIT: PageSize = {
  widthMm: 210,
  heightMm: 297,
  orientation: 'portrait',
}

/** Aspect ratio (width ÷ height) of a page size. ~0.707 for A4 portrait. */
export function getAspectRatio(pageSize: PageSize): number {
  return pageSize.widthMm / pageSize.heightMm
}

export interface PixelSize {
  readonly width: number
  readonly height: number
}

/**
 * Largest pixel size for `pageSize` that fits inside the given bounds while
 * preserving its aspect ratio (letterbox fit). Returns zero-size for
 * non-positive bounds so callers can guard against an unmeasured container.
 */
export function fitPageSize(
  pageSize: PageSize,
  bounds: { maxWidth: number; maxHeight: number },
): PixelSize {
  const aspect = getAspectRatio(pageSize)
  if (bounds.maxWidth <= 0 || bounds.maxHeight <= 0) {
    return { width: 0, height: 0 }
  }
  // Start from the full available height, then clamp if it overflows width.
  let height = bounds.maxHeight
  let width = height * aspect
  if (width > bounds.maxWidth) {
    width = bounds.maxWidth
    height = width / aspect
  }
  return { width, height }
}
