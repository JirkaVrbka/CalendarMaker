/**
 * Pure geometry for the Agenda layout (mockup 08, two-column list): a photo on
 * top (~46%), the localized month name below it, then the month's days as a
 * two-column LIST — each row is a day number + localized weekday abbreviation,
 * weekends colored. The days split into two balanced columns, filled top-to-
 * bottom (1..k in the left column, k+1..n in the right).
 *
 * All values are canvas pixels relative to the page top-left (0,0). Fractions
 * derive from the 480×679 mockup. Kept free of react-konva so it is fully
 * unit-testable (the two-column split especially).
 */
import type { PixelSize } from '../../../lib/page'
import type { Rect } from '../monthPageLayout'

/** Fraction of the page height given to the photo (top). */
const PHOTO_FRACTION = 0.46

export interface AgendaColumns {
  /** Number of days in the left column (days 1..col1). */
  readonly col1: number
  /** Number of days in the right column (days col1+1..dayCount). */
  readonly col2: number
}

/**
 * Split `dayCount` days into two balanced columns, the left taking the extra day
 * on an odd count (ceil). 31 → 16/15, 30 → 15/15, 29 → 15/14, 28 → 14/14.
 */
export function splitAgendaColumns(dayCount: number): AgendaColumns {
  const n = Math.max(dayCount, 0)
  const col1 = Math.ceil(n / 2)
  return { col1, col2: n - col1 }
}

export interface AgendaLayout {
  readonly page: PixelSize
  /** Photo frame across the top. */
  readonly photo: Rect
  /** Month-name header band below the photo. */
  readonly header: {
    readonly x: number
    readonly y: number
    readonly width: number
    readonly monthFontSize: number
    readonly yearFontSize: number
  }
  /** The two list columns. */
  readonly columns: readonly [Rect, Rect]
  /** The day split across the two columns. */
  readonly split: AgendaColumns
  /** Height of one list row (both columns share it, top-aligned). */
  readonly rowHeight: number
  /** Font sizes for the day number and the weekday abbreviation. */
  readonly dayFontSize: number
  readonly weekdayFontSize: number
}

/** Rect of list row `rowIndex` (0-based) within column `colIndex` (0 or 1). */
export function agendaRowRect(
  layout: AgendaLayout,
  colIndex: number,
  rowIndex: number,
): Rect {
  const col = layout.columns[colIndex]
  return {
    x: col.x,
    y: col.y + rowIndex * layout.rowHeight,
    width: col.width,
    height: layout.rowHeight,
  }
}

export function computeAgendaLayout(
  size: PixelSize,
  dayCount: number,
): AgendaLayout {
  const { width, height } = size
  const split = splitAgendaColumns(dayCount)

  const photoHeight = height * PHOTO_FRACTION
  const photo: Rect = { x: 0, y: 0, width, height: photoHeight }

  const padX = width * 0.042
  const headerHeight = height * 0.07
  const header = {
    x: padX,
    y: photoHeight,
    width: width - padX * 2,
    monthFontSize: height * 0.038,
    yearFontSize: height * 0.02,
  }

  const colGap = width * 0.021
  const listTop = header.y + headerHeight
  const listBottom = height - height * 0.026
  const listHeight = listBottom - listTop
  const colWidth = (width - padX * 2 - colGap) / 2

  const columns: [Rect, Rect] = [
    { x: padX, y: listTop, width: colWidth, height: listHeight },
    { x: padX + colWidth + colGap, y: listTop, width: colWidth, height: listHeight },
  ]

  // Both columns share a row height sized to the TALLER column so the two lists
  // align and always fit.
  const maxRows = Math.max(split.col1, split.col2, 1)
  const rowHeight = listHeight / maxRows

  return {
    page: size,
    photo,
    header,
    columns,
    split,
    rowHeight,
    dayFontSize: Math.min(rowHeight * 0.5, height * 0.018),
    weekdayFontSize: Math.min(rowHeight * 0.42, height * 0.015),
  }
}
