/**
 * Pure geometry for the Vertical Ribbon layout (mockup 10): a full-bleed photo
 * with a dark vertical date STRIP down the RIGHT side listing every day
 * top-to-bottom (number + weekday abbreviation), a giant month number in the
 * top-left over the photo, and the month name + year below it.
 *
 * The strip is fixed dark chrome (its day numbers are fixed light ink; only
 * weekends follow the style), and the big number + month label sit over the
 * photo (also fixed light + shadow) — mirroring the Full-bleed Ribbon doctrine.
 *
 * All values are canvas pixels relative to the page top-left (0,0). Fractions
 * derive from the 480×679 mockup so proportions scale to any page size. Kept
 * free of react-konva so it is fully unit-testable (strip rows especially).
 */
import type { PixelSize } from '../../../lib/page'
import type { Rect } from '../monthPageLayout'

export interface VerticalRibbonLayout {
  readonly page: PixelSize
  /** Full-bleed photo frame (page minus the strip). */
  readonly photo: Rect
  /** Dark date strip down the right side. */
  readonly strip: Rect
  /** Giant month number, top-left over the photo. */
  readonly bigNumber: { readonly x: number; readonly y: number; readonly fontSize: number }
  /** Month name + year label below the big number. */
  readonly monthLabel: {
    readonly x: number
    readonly y: number
    readonly monthFontSize: number
    readonly yearFontSize: number
    readonly yearGap: number
  }
  /** Number of day rows in the strip. */
  readonly dayCount: number
  /** Height of one strip row. */
  readonly rowHeight: number
  /** Top y of the first strip row (after the strip's top padding). */
  readonly rowsTop: number
  /** Font sizes for the strip day number and weekday abbreviation. */
  readonly numberFontSize: number
  readonly weekdayFontSize: number
}

/** Top y of strip row `i` (0-based). */
export function stripRowY(layout: VerticalRibbonLayout, i: number): number {
  return layout.rowsTop + i * layout.rowHeight
}

export function computeVerticalRibbonLayout(
  size: PixelSize,
  dayCount: number,
): VerticalRibbonLayout {
  const { width, height } = size
  const days = Math.max(dayCount, 1)

  const stripWidth = width * 0.15
  const strip: Rect = {
    x: width - stripWidth,
    y: 0,
    width: stripWidth,
    height,
  }
  const photo: Rect = { x: 0, y: 0, width: width - stripWidth, height }

  const stripPadY = height * 0.015
  const rowsTop = strip.y + stripPadY
  const rowsHeight = height - stripPadY * 2
  const rowHeight = rowsHeight / days

  return {
    page: size,
    photo,
    strip,
    bigNumber: { x: width * 0.05, y: height * 0.0206, fontSize: height * 0.206 },
    monthLabel: {
      x: width * 0.058,
      y: height * 0.247,
      monthFontSize: height * 0.0295,
      yearFontSize: height * 0.0177,
      yearGap: height * 0.004,
    },
    dayCount: days,
    rowHeight,
    rowsTop,
    numberFontSize: Math.min(rowHeight * 0.5, height * 0.018),
    weekdayFontSize: Math.min(rowHeight * 0.34, height * 0.012),
  }
}
