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

/**
 * Scale a derived font size by the user's `fontScale`, then clamp it to `max`
 * so a large scale cannot overflow its band. Scaling DOWN is always honored
 * (the clamp is an upper bound only), so a smaller `fontScale` always shrinks
 * the text and a larger one grows it up to the band's ceiling.
 */
function scaleFont(base: number, fontScale: number, max: number): number {
  return Math.min(base * fontScale, max)
}

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

/**
 * Geometry for the restyled Classic Top BODY (the region below the photo). Unlike
 * `computeMonthPageLayout` (a simple title + header + grid, still used by other
 * layouts), this carves the body into the mockup's five stacked bands:
 *
 *   1. caption   — editorial title + subtitle (the project's cover text)
 *   2. monthHead — month name (left) + year (right), with a rule beneath it
 *   3. header    — the weekday header row (7 columns)
 *   4. grid      — the compact day grid filling the middle
 *   5. footer    — "<Weekday> start" (left) + "CalendarMaker" (right)
 *
 * All rects are relative to the body region's own top-left (0,0); the caller
 * translates them under the photo. Font sizes are derived from the region size
 * so the page scales identically on screen, in thumbnails and in the export.
 * Kept pure (no react-konva) so it stays unit-testable.
 */
export interface ClassicMonthLayout {
  readonly region: PixelSize
  /** Horizontal inset shared by every band. */
  readonly padX: number
  /** Caption band: editorial title + subtitle. */
  readonly caption: Rect & {
    readonly titleFontSize: number
    readonly subtitleFontSize: number
  }
  /** Month-head band: big month name + year, ruled underneath. */
  readonly monthHead: Rect & {
    readonly nameFontSize: number
    readonly yearFontSize: number
  }
  /** Weekday header row (7 columns). */
  readonly header: Rect & {
    readonly columnWidth: number
    readonly fontSize: number
  }
  /** Compact day grid filling the middle. */
  readonly grid: Rect & {
    readonly columnWidth: number
    readonly rowHeight: number
    readonly rows: number
  }
  /** Footer band: week-start note + wordmark. */
  readonly footer: Rect & { readonly fontSize: number }
  /** Font size for the day numbers. */
  readonly dayFontSize: number
}

/** Rect of a Classic Top grid cell at (row, col). Does not clamp. */
export function classicCellRect(
  layout: ClassicMonthLayout,
  row: number,
  col: number,
): Rect {
  return {
    x: layout.grid.x + col * layout.grid.columnWidth,
    y: layout.grid.y + row * layout.grid.rowHeight,
    width: layout.grid.columnWidth,
    height: layout.grid.rowHeight,
  }
}

/** Rect of a Classic Top weekday header cell at `col`. */
export function classicHeaderCellRect(
  layout: ClassicMonthLayout,
  col: number,
): Rect {
  return {
    x: layout.header.x + col * layout.header.columnWidth,
    y: layout.header.y,
    width: layout.header.columnWidth,
    height: layout.header.height,
  }
}

export function computeClassicMonthLayout(
  region: PixelSize,
  weekCount: number,
  /** Text-size multiplier (1 = baseline); each font is clamped to its band. */
  fontScale = 1,
): ClassicMonthLayout {
  const { width, height } = region
  const rows = Math.max(weekCount, 1)

  // Shared insets and the vertical gap between stacked bands.
  const padX = width * 0.06
  const padY = height * 0.05
  const gap = height * 0.015
  const innerX = padX
  const innerWidth = width - padX * 2
  const columnWidth = innerWidth / GRID_COLUMNS

  // Fixed-height bands; the grid absorbs whatever vertical space remains. The
  // fractions are tuned so a full 6-row month still fits in the ~45% body.
  const captionHeight = height * 0.14
  const monthHeadHeight = height * 0.15
  const headerHeight = height * 0.06
  const footerHeight = height * 0.06

  let cursorY = padY

  const caption = {
    x: innerX,
    y: cursorY,
    width: innerWidth,
    height: captionHeight,
    // Derived font sizes, scaled by `fontScale` and clamped to this band.
    titleFontSize: scaleFont(height * 0.072, fontScale, captionHeight * 0.85),
    subtitleFontSize: scaleFont(
      height * 0.032,
      fontScale,
      captionHeight * 0.42,
    ),
  }
  cursorY += captionHeight + gap

  const monthHead = {
    x: innerX,
    y: cursorY,
    width: innerWidth,
    height: monthHeadHeight,
    nameFontSize: scaleFont(height * 0.12, fontScale, monthHeadHeight * 0.92),
    yearFontSize: scaleFont(height * 0.042, fontScale, monthHeadHeight * 0.5),
  }
  cursorY += monthHeadHeight + gap

  const header = {
    x: innerX,
    y: cursorY,
    width: innerWidth,
    height: headerHeight,
    columnWidth,
    fontSize: scaleFont(height * 0.028, fontScale, headerHeight * 0.8),
  }
  cursorY += headerHeight

  // Footer is pinned to the bottom; the grid fills the space in between.
  const footer = {
    x: innerX,
    y: height - padY - footerHeight,
    width: innerWidth,
    height: footerHeight,
    fontSize: scaleFont(height * 0.026, fontScale, footerHeight * 0.8),
  }

  const gridTop = cursorY
  const gridBottom = footer.y - gap
  const bodyHeight = Math.max(gridBottom - gridTop, 1)
  const rowHeight = bodyHeight / rows

  const grid = {
    x: innerX,
    y: gridTop,
    width: innerWidth,
    height: bodyHeight,
    columnWidth,
    rowHeight,
    rows,
  }

  return {
    region,
    padX,
    caption,
    monthHead,
    header,
    grid,
    footer,
    dayFontSize: scaleFont(
      Math.min(rowHeight, columnWidth) * 0.42,
      fontScale,
      Math.min(rowHeight, columnWidth) * 0.62,
    ),
  }
}

export function computeMonthPageLayout(
  size: PixelSize,
  weekCount: number,
  /** Text-size multiplier (1 = baseline); each font is clamped to its band. */
  fontScale = 1,
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
    fontSize: scaleFont(height * 0.05, fontScale, titleHeight * 0.85),
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
    dayFontSize: scaleFont(
      Math.min(rowHeight, columnWidth) * 0.32,
      fontScale,
      Math.min(rowHeight, columnWidth) * 0.5,
    ),
    headerFontSize: scaleFont(headerHeight * 0.55, fontScale, headerHeight * 0.8),
  }
}
