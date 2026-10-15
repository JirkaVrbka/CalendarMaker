/**
 * Pure geometry for the Framed layout (mockup 05, polaroid style): a photo sits
 * inside a light MAT/border in the upper area, the month name is a caption under
 * the photo (still on the mat), and a tidy 7-column grid block sits below the
 * mat. The mat is fixed light chrome; the grid + caption text follow the style.
 *
 * All values are canvas pixels relative to the page top-left (0,0). Fractions
 * derive from the 480×679 mockup so proportions scale to any page size. Kept
 * free of react-konva so it is fully unit-testable.
 */
import type { PixelSize } from '../../../lib/page'
import type { Rect } from '../monthPageLayout'

export interface FramedLayout {
  readonly page: PixelSize
  /** The polaroid mat/frame (fixed light chrome) wrapping photo + caption. */
  readonly mat: Rect
  /** Photo frame, inset inside the mat near the top. */
  readonly photo: Rect
  /** Month-name caption band on the mat, below the photo. */
  readonly caption: {
    readonly x: number
    readonly y: number
    readonly width: number
    readonly height: number
    readonly monthFontSize: number
    readonly yearFontSize: number
  }
  /** The grid card area below the mat. */
  readonly grid: Rect
  /** Inner padding to inset the compact grid within the grid card. */
  readonly gridPad: number
}

export function computeFramedLayout(size: PixelSize): FramedLayout {
  const { width, height } = size

  const outerPadX = width * 0.054
  const outerPadTop = height * 0.041
  const outerPadBottom = height * 0.032
  const matBorder = width * 0.03

  const matX = outerPadX
  const matY = outerPadTop
  const matWidth = width - outerPadX * 2

  const photo: Rect = {
    x: matX + matBorder,
    y: matY + matBorder,
    width: matWidth - matBorder * 2,
    height: height * 0.4,
  }

  const captionHeight = height * 0.1
  const caption = {
    x: matX,
    y: photo.y + photo.height,
    width: matWidth,
    height: captionHeight,
    monthFontSize: height * 0.038,
    yearFontSize: height * 0.018,
  }

  const matBottom = caption.y + caption.height
  const mat: Rect = {
    x: matX,
    y: matY,
    width: matWidth,
    height: matBottom - matY,
  }

  const gridTop = matBottom + height * 0.03
  const grid: Rect = {
    x: outerPadX,
    y: gridTop,
    width: matWidth,
    height: height - outerPadBottom - gridTop,
  }

  return {
    page: size,
    mat,
    photo,
    caption,
    grid,
    gridPad: width * 0.037,
  }
}
