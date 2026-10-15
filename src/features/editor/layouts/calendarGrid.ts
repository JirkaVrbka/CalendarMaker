/**
 * Pure geometry for a COMPACT 7-column month grid that fills a given rect with a
 * weekday header row on top and `rows` equal day-cell rows below — NO month
 * title band (unlike `computeMonthPageLayout`, whose title space the Framed and
 * Minimal Overlay layouts don't want: Framed shows the month as a caption and
 * Minimal Overlay overlays it on the photo). Shared by those two layouts.
 *
 * All values are canvas pixels relative to the passed size's top-left (0,0); the
 * caller translates by the grid region's origin. Kept free of react-konva so it
 * is fully unit-testable.
 */
import type { PixelSize } from '../../../lib/page'
import { GRID_COLUMNS, type Rect } from '../monthPageLayout'

export interface CalendarGrid {
  /** The weekday header row (7 columns), across the top. */
  readonly header: Rect & { readonly columnWidth: number }
  /** The day-cell body below the header. */
  readonly body: Rect & {
    readonly columnWidth: number
    readonly rowHeight: number
    readonly rows: number
  }
  readonly headerFontSize: number
  readonly dayFontSize: number
}

/** Rect of the day cell at (row, col). Callers pass in-range indices. */
export function calendarCellRect(
  grid: CalendarGrid,
  row: number,
  col: number,
): Rect {
  return {
    x: grid.body.x + col * grid.body.columnWidth,
    y: grid.body.y + row * grid.body.rowHeight,
    width: grid.body.columnWidth,
    height: grid.body.rowHeight,
  }
}

/** Rect of the weekday header cell at `col`. */
export function calendarHeaderRect(grid: CalendarGrid, col: number): Rect {
  return {
    x: grid.header.x + col * grid.header.columnWidth,
    y: grid.header.y,
    width: grid.header.columnWidth,
    height: grid.header.height,
  }
}

/**
 * Lay a compact grid into `size` with `rows` week rows. `headerFraction` is the
 * share of the height given to the weekday header row (default 14%).
 */
export function computeCalendarGrid(
  size: PixelSize,
  rows: number,
  headerFraction = 0.14,
): CalendarGrid {
  const { width, height } = size
  const safeRows = Math.max(rows, 1)
  const columnWidth = width / GRID_COLUMNS
  const headerHeight = height * headerFraction
  const bodyHeight = height - headerHeight
  const rowHeight = bodyHeight / safeRows

  return {
    header: { x: 0, y: 0, width, height: headerHeight, columnWidth },
    body: {
      x: 0,
      y: headerHeight,
      width,
      height: bodyHeight,
      columnWidth,
      rowHeight,
      rows: safeRows,
    },
    headerFontSize: Math.min(headerHeight * 0.6, columnWidth * 0.34),
    dayFontSize: Math.min(rowHeight, columnWidth) * 0.42,
  }
}
