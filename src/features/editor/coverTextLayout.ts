/**
 * Pure placement math for the cover's draggable title / subtitle — no
 * react-konva, so it is fully unit-testable without a live canvas.
 *
 * A text block's stored position is its CENTER anchor expressed as a FRACTION of
 * the page (see `TextPosition`), which makes it resolution-independent: the same
 * fraction places the text identically in the small editor, the thumbnail, and
 * the large A4@300DPI export. These helpers convert between that fraction and
 * on-screen pixels and clamp the block so it always stays fully on the page.
 */
import type { PixelSize } from '../../lib/page'
import type { TextPosition } from '../../types/calendar'

/** A top-left position in canvas pixels. */
export interface PixelPoint {
  readonly x: number
  readonly y: number
}

/**
 * Clamp a text block's top-left pixel position so the whole `textW × textH`
 * block stays inside the page. When the block is larger than the page on an
 * axis, it pins to 0 on that axis (top/left aligned) rather than going negative.
 */
export function clampTextTopLeft(
  topLeftX: number,
  topLeftY: number,
  pageSize: PixelSize,
  textW: number,
  textH: number,
): PixelPoint {
  const maxX = Math.max(0, pageSize.width - textW)
  const maxY = Math.max(0, pageSize.height - textH)
  return {
    x: Math.min(Math.max(topLeftX, 0), maxX),
    y: Math.min(Math.max(topLeftY, 0), maxY),
  }
}

/**
 * The clamped top-left pixel position at which to draw a `textW × textH` block
 * whose CENTER should sit at the fractional `pos`. Resolution-independent: the
 * same `pos` yields the same *relative* placement at any page size (scaling the
 * page scales the result), so the editor, thumbnail, and export all match.
 */
export function coverTextLayout(
  pos: TextPosition,
  pageSize: PixelSize,
  textW: number,
  textH: number,
): PixelPoint {
  const centerX = pos.x * pageSize.width
  const centerY = pos.y * pageSize.height
  return clampTextTopLeft(
    centerX - textW / 2,
    centerY - textH / 2,
    pageSize,
    textW,
    textH,
  )
}

/**
 * Convert a (possibly out-of-range) top-left pixel position back to the block's
 * CENTER as a page fraction, clamped so the committed value keeps the block on
 * the page. The inverse of `coverTextLayout`; used to commit a drag's result.
 */
export function topLeftToCenterFraction(
  topLeftX: number,
  topLeftY: number,
  pageSize: PixelSize,
  textW: number,
  textH: number,
): TextPosition {
  const clamped = clampTextTopLeft(topLeftX, topLeftY, pageSize, textW, textH)
  return {
    x: (clamped.x + textW / 2) / pageSize.width,
    y: (clamped.y + textH / 2) / pageSize.height,
  }
}

/**
 * A deterministic estimate of a single line's rendered width in pixels, derived
 * purely from the character count and font size (no canvas measurement). Being
 * pure and font-size-driven keeps the text's hit area identical in the editor,
 * thumbnail, and export (all scale with the page), so placement stays
 * consistent. `avgCharFactor` is the mean glyph-width-to-font-size ratio of a
 * typical proportional font.
 */
export function estimateTextWidth(
  text: string,
  fontSize: number,
  avgCharFactor = 0.58,
): number {
  return text.length * fontSize * avgCharFactor
}
