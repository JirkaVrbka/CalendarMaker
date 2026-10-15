/**
 * Pure math for placing a photo inside a frame — no react-konva, so it is fully
 * unit-testable. The cover-fit baseline scales an image so it just covers the
 * frame (no empty gaps) and centers it; `ImageEntry.transform` is a user
 * adjustment (zoom/pan) layered on top of that baseline (see
 * `types/calendar.ts`).
 */
import type { ImageTransform } from '../types/calendar'

/** A width/height pair in canvas pixels. */
interface Size {
  readonly width: number
  readonly height: number
}

/**
 * The cover-fit baseline *scale* for an image of `imageW × imageH` placed in a
 * `frameW × frameH` frame: the smallest uniform scale that covers the frame in
 * both axes (no empty gaps). Returns 1 for non-positive image dimensions. The
 * centered position is derived from this scale at render time, so no offset is
 * returned here.
 */
export function computeCoverScale(
  imageW: number,
  imageH: number,
  frameW: number,
  frameH: number,
): number {
  if (imageW <= 0 || imageH <= 0) return 1
  return Math.max(frameW / imageW, frameH / imageH)
}

/**
 * Clamp a scaled image's top-left position on one axis so the frame stays fully
 * covered (no empty gap): the position is kept within
 * `[frameLength - scaledLength, 0]`. Assumes `scaledLength >= frameLength`
 * (always true for a cover-fit image at zoom ≥ 1); if not, it pins to 0.
 */
export function clampCoverPosition(
  position: number,
  frameLength: number,
  scaledLength: number,
): number {
  const min = Math.min(frameLength - scaledLength, 0)
  return Math.max(min, Math.min(position, 0))
}

/** A fully composed placement: where and how big to draw the image. */
export interface ComposedImagePlacement {
  /** Composed scale = cover-fit scale × the user's zoom multiplier. */
  readonly scale: number
  /** Image dimensions after `scale`. */
  readonly scaledWidth: number
  readonly scaledHeight: number
  /** Clamped top-left of the image within the frame (frame-local pixels). */
  readonly x: number
  readonly y: number
  /**
   * The user's pan offset from the centered position, re-derived from the
   * clamped top-left and expressed as a FRACTION of the frame width / height
   * (the same unit as `ImageTransform.offsetX/offsetY`). Equals the requested
   * fractional offset when it was within the valid pan range, and the clamped
   * value otherwise — so the stored transform can be re-normalized to this to
   * stay in range at the current zoom.
   */
  readonly offsetX: number
  readonly offsetY: number
}

/**
 * Compose the cover-fit baseline with the user's zoom/pan into a concrete,
 * frame-covering placement. The zoom multiplies the cover scale; the pan —
 * stored as a fraction of the frame — is converted to pixels against THIS frame
 * (`offsetX * frame.width`, `offsetY * frame.height`), applied from the centered
 * position, and then clamped so the frame stays fully covered (the cover
 * invariant). Working in fractions is what makes the placement
 * resolution-independent: the same transform yields the same normalized position
 * at any frame size (editor, thumbnail, export). The returned `x`/`y` and
 * `scaledWidth`/`scaledHeight` are pixels; `offsetX`/`offsetY` are the pan
 * re-derived from the clamped position and converted BACK to fractions, so they
 * round-trip an in-range pan and collapse an out-of-range one to the nearest
 * valid value.
 */
export function composeImageTransform(
  coverScale: number,
  userTransform: ImageTransform,
  frame: Size,
  imageSize: Size,
): ComposedImagePlacement {
  const scale = coverScale * userTransform.scale
  const scaledWidth = imageSize.width * scale
  const scaledHeight = imageSize.height * scale
  // Centered (cover-fit) top-left, then the user's pan (fraction → pixels
  // against this frame), then clamped to cover.
  const centeredX = (frame.width - scaledWidth) / 2
  const centeredY = (frame.height - scaledHeight) / 2
  const x = clampCoverPosition(
    centeredX + userTransform.offsetX * frame.width,
    frame.width,
    scaledWidth,
  )
  const y = clampCoverPosition(
    centeredY + userTransform.offsetY * frame.height,
    frame.height,
    scaledHeight,
  )
  return {
    scale,
    scaledWidth,
    scaledHeight,
    x,
    y,
    // Re-derive the clamped pan and convert back to a fraction of the frame.
    offsetX: (x - centeredX) / frame.width,
    offsetY: (y - centeredY) / frame.height,
  }
}
