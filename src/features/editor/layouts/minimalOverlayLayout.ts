/**
 * Pure geometry for the Minimal Overlay layout (mockup 06): a full-bleed photo,
 * the month name overlaid top-left, and a small translucent rounded card in the
 * bottom-right corner holding a COMPACT month grid. The card is fixed light
 * chrome and the overlaid title is fixed light ink (both sit over the photo);
 * only the grid text inside the card follows the style.
 *
 * All values are canvas pixels relative to the page top-left (0,0). Fractions
 * derive from the 480×679 mockup so proportions scale to any page size. Kept
 * free of react-konva so it is fully unit-testable.
 */
import type { PixelSize } from '../../../lib/page'
import type { Rect } from '../monthPageLayout'

export interface MinimalOverlayLayout {
  readonly page: PixelSize
  /** Full-bleed photo frame (the whole page). */
  readonly photo: Rect
  /** Month-name + year title overlay, top-left over the photo. */
  readonly title: {
    readonly x: number
    readonly y: number
    readonly monthFontSize: number
    readonly yearFontSize: number
    readonly yearGap: number
  }
  /** Translucent rounded card in the bottom-right. */
  readonly card: Rect
  /** Corner radius of the card. */
  readonly cardRadius: number
  /** Inner padding inside the card, around the compact grid. */
  readonly cardPad: number
}

/**
 * `rows` is the number of week rows the compact grid needs (5 or 6); the card
 * height grows with it so the grid always fits.
 */
export function computeMinimalOverlayLayout(
  size: PixelSize,
  rows: number,
): MinimalOverlayLayout {
  const { width, height } = size
  const safeRows = Math.max(rows, 1)

  const margin = width * 0.054
  const cardPad = width * 0.033
  const cardWidth = width * 0.49
  // One header row + the week rows, each a compact band.
  const rowBand = height * 0.031
  const cardInnerHeight = (safeRows + 1) * rowBand
  const cardHeight = cardInnerHeight + cardPad * 2

  const card: Rect = {
    x: width - margin - cardWidth,
    y: height - margin - cardHeight,
    width: cardWidth,
    height: cardHeight,
  }

  return {
    page: size,
    photo: { x: 0, y: 0, width, height },
    title: {
      x: width * 0.067,
      y: height * 0.05,
      monthFontSize: height * 0.059,
      yearFontSize: height * 0.021,
      yearGap: height * 0.012,
    },
    card,
    cardRadius: width * 0.025,
    cardPad,
  }
}
