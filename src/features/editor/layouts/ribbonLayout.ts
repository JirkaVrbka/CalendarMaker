/**
 * Pure geometry for the Full-bleed Ribbon month page (mockup 02, Helmáč style):
 * a full-bleed photo inset by a thin frame, a giant month number in the top-right
 * corner, and a bottom dark band holding — stacked — the month name + year, a
 * single row of day NUMBERS (one equal cell per day of the month), week-number
 * labels along the bottom, and continuous vertical dividers at each week break.
 *
 * All values are canvas pixels relative to the page's top-left (0,0). Fractions
 * are derived from the 480×679 mockup so the proportions scale to any page size.
 * Kept free of react-konva so it is fully unit-testable (the Konva module just
 * places nodes at these positions).
 */
import type { PixelSize } from '../../../lib/page'
import type { Rect } from '../monthPageLayout'

export interface RibbonLayout {
  readonly page: PixelSize
  /** Full-bleed photo frame, inset from the page edges by the dark border. */
  readonly photo: Rect
  /** Bottom dark date band spanning the full page width. */
  readonly band: Rect
  /**
   * Giant month number, anchored to the TOP-RIGHT corner: draw a Text box at
   * `{x, y}` of `width` with right alignment so it ends at the right margin.
   */
  readonly bigNumber: {
    readonly x: number
    readonly y: number
    readonly width: number
    readonly fontSize: number
  }
  /** Month-name label (top-left of the band). */
  readonly monthLabel: { readonly x: number; readonly y: number; readonly fontSize: number }
  /** Year label drawn just after the month name. */
  readonly yearLabel: { readonly fontSize: number; readonly gap: number }
  /** Area inside the band holding the day row, dividers and week row. */
  readonly dates: Rect
  /** Number of day cells across the row (days in the month). */
  readonly dayCount: number
  /** Width of one equal day cell. */
  readonly dayColumnWidth: number
  /** The single row of day numbers (top of the dates area). */
  readonly daysRow: { readonly y: number; readonly fontSize: number }
  /** The row of week numbers (bottom of the dates area). */
  readonly weeksRow: { readonly y: number; readonly fontSize: number }
  /** Top / bottom y of the full-height week-break dividers. */
  readonly dividerTop: number
  readonly dividerBottom: number
}

/** Left edge x of the day cell at 0-based index `i` (day `i + 1`). */
export function dayColumnX(layout: RibbonLayout, i: number): number {
  return layout.dates.x + i * layout.dayColumnWidth
}

/**
 * X of the vertical divider drawn AFTER the day at 0-based index `i` (i.e. the
 * right edge of that day's cell) — placed at each week break.
 */
export function dividerX(layout: RibbonLayout, i: number): number {
  return layout.dates.x + ((i + 1) / layout.dayCount) * layout.dates.width
}

export function computeRibbonLayout(
  size: PixelSize,
  dayCount: number,
): RibbonLayout {
  const { width, height } = size
  const days = Math.max(dayCount, 1)

  const frameInset = width * 0.025
  const bandHeight = height * 0.2032
  const band: Rect = {
    x: 0,
    y: height - bandHeight,
    width,
    height: bandHeight,
  }

  const photo: Rect = {
    x: frameInset,
    y: frameInset,
    width: width - frameInset * 2,
    height: band.y - frameInset,
  }

  const bigNumber = {
    x: 0,
    y: height * 0.0206,
    width: width - width * 0.0542,
    fontSize: height * 0.1767,
  }

  const bandPadX = width * 0.0333
  const bandPadTop = height * 0.0236
  const bandPadBottom = height * 0.0265
  const monthFontSize = height * 0.0339
  const yearFontSize = height * 0.0295
  const labelGap = height * 0.0206

  const monthLabel = {
    x: band.x + bandPadX,
    y: band.y + bandPadTop,
    fontSize: monthFontSize,
  }
  const yearLabel = { fontSize: yearFontSize, gap: width * 0.0167 }

  const datesTop = monthLabel.y + monthFontSize + labelGap
  const datesBottom = band.y + band.height - bandPadBottom
  const dates: Rect = {
    x: band.x + bandPadX,
    y: datesTop,
    width: band.width - bandPadX * 2,
    height: datesBottom - datesTop,
  }

  const weekFontSize = height * 0.0118

  return {
    page: size,
    photo,
    band,
    bigNumber,
    monthLabel,
    yearLabel,
    dates,
    dayCount: days,
    dayColumnWidth: dates.width / days,
    daysRow: { y: dates.y, fontSize: height * 0.014 },
    weeksRow: { y: dates.y + dates.height - weekFontSize, fontSize: weekFontSize },
    dividerTop: dates.y,
    dividerBottom: dates.y + dates.height,
  }
}
