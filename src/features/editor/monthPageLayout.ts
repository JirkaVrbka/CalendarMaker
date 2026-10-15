/**
 * Pure geometry for drawing a month page. Given the page pixel size and the
 * number of week rows, it computes where the title, weekday header row and
 * day-grid cells sit. Kept free of react-konva so it is fully unit-testable
 * (react-konva + jsdom cannot render a real canvas).
 *
 * All values are in canvas pixels, relative to the page's top-left (0,0).
 */
import type { PixelSize } from '../../lib/page'

export const GRID_COLUMNS = 7

/** Fraction of a month page's height given to the photo region (top). */
export const PHOTO_REGION_FRACTION = 0.55

export interface Rect {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

/**
 * Split a month page into its two stacked regions: the photo frame on top
 * (~55% of the height) and the day-grid area below (~45%). Both span the full
 * page width; callers draw the grid by running `computeMonthPageLayout` against
 * the returned `grid` rect's size and translating by its origin.
 */
export function splitMonthPage(size: PixelSize): {
  readonly photo: Rect
  readonly grid: Rect
} {
  const photoHeight = size.height * PHOTO_REGION_FRACTION
  return {
    photo: { x: 0, y: 0, width: size.width, height: photoHeight },
    grid: {
      x: 0,
      y: photoHeight,
      width: size.width,
      height: size.height - photoHeight,
    },
  }
}

/**
 * Split a month page for the Bottom Photo layout (mockup 04): the day-grid area
 * on TOP (~45%) and the photo frame BELOW it (~55%) — the vertical mirror of
 * `splitMonthPage`. Both regions span the full page width; the grid is drawn by
 * running `computeMonthPageLayout` against the returned `grid` rect's size and
 * translating by its origin (which is the page top here).
 */
export function splitMonthPageBottomPhoto(size: PixelSize): {
  readonly grid: Rect
  readonly photo: Rect
} {
  const photoHeight = size.height * PHOTO_REGION_FRACTION
  const gridHeight = size.height - photoHeight
  return {
    grid: { x: 0, y: 0, width: size.width, height: gridHeight },
    photo: {
      x: 0,
      y: gridHeight,
      width: size.width,
      height: photoHeight,
    },
  }
}

export interface MonthPageLayout {
  readonly page: PixelSize
  readonly padding: number
  /** Centered month title band across the top. */
  readonly title: Rect & { readonly fontSize: number }
  /** The weekday header row (7 columns). */
  readonly header: Rect & { readonly columnWidth: number }
  /** The day grid area below the header. */
  readonly grid: Rect & {
    readonly columnWidth: number
    readonly rowHeight: number
    readonly rows: number
  }
  /** Font size for the day numbers. */
  readonly dayFontSize: number
  /** Font size for the weekday headers. */
  readonly headerFontSize: number
}

/**
 * Rect of a single grid cell at (row, col). Does not clamp — callers pass
 * indices within `0..rows-1` / `0..6`.
 */
export function cellRect(layout: MonthPageLayout, row: number, col: number): Rect {
  return {
    x: layout.grid.x + col * layout.grid.columnWidth,
    y: layout.grid.y + row * layout.grid.rowHeight,
    width: layout.grid.columnWidth,
    height: layout.grid.rowHeight,
  }
}

/** Rect of a single weekday header cell at `col`. */
export function headerCellRect(layout: MonthPageLayout, col: number): Rect {
  return {
    x: layout.header.x + col * layout.header.columnWidth,
    y: layout.header.y,
    width: layout.header.columnWidth,
    height: layout.header.height,
  }
}

export function computeMonthPageLayout(
  size: PixelSize,
  weekCount: number,
): MonthPageLayout {
  const { width, height } = size
  const rows = Math.max(weekCount, 1)
  const padding = width * 0.06

  const titleHeight = height * 0.1
  const title = {
    x: padding,
    y: height * 0.045,
    width: width - padding * 2,
    height: titleHeight,
    fontSize: height * 0.05,
  }

  const gridTop = height * 0.17
  const gridBottom = height - padding
  const gridLeft = padding
  const gridWidth = width - padding * 2
  const columnWidth = gridWidth / GRID_COLUMNS

  const totalGridHeight = gridBottom - gridTop
  const headerHeight = totalGridHeight * 0.09
  const bodyHeight = totalGridHeight - headerHeight
  const rowHeight = bodyHeight / rows

  const header = {
    x: gridLeft,
    y: gridTop,
    width: gridWidth,
    height: headerHeight,
    columnWidth,
  }

  const grid = {
    x: gridLeft,
    y: gridTop + headerHeight,
    width: gridWidth,
    height: bodyHeight,
    columnWidth,
    rowHeight,
    rows,
  }

  return {
    page: size,
    padding,
    title,
    header,
    grid,
    dayFontSize: Math.min(rowHeight, columnWidth) * 0.32,
    headerFontSize: headerHeight * 0.55,
  }
}
