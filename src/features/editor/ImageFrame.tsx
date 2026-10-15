/**
 * A reusable Konva photo layer: draws a loaded image inside a clipped Group at
 * the given frame, honoring an `ImageTransform` (cover-fit baseline + the
 * user's zoom/pan). When interactive, the image is draggable and the drag is
 * clamped so the frame stays fully covered (no empty gaps); committed positions
 * are reported back as a new transform via `onTransformChange`.
 *
 * Renders nothing until the image has loaded (the parent draws any empty-state
 * placeholder). Pure placement math lives in `lib/imageTransform` so it stays
 * testable without a real canvas.
 */
import { useEffect } from 'react'
import { Group, Image as KonvaImage } from 'react-konva'
import type Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'

import {
  clampCoverPosition,
  composeImageTransform,
  computeCoverScale,
} from '../../lib/imageTransform'
import type { ImageTransform } from '../../types/calendar'
import type { Rect } from './monthPageLayout'
import { useImageElement } from './useImageElement'

export interface ImageFrameProps {
  /** Object-URL of the photo to draw. */
  readonly url: string
  /** Frame to clip the photo to, in canvas pixels. */
  readonly frame: Rect
  /** User zoom/pan on top of the cover-fit baseline. */
  readonly transform: ImageTransform
  /**
   * Called with the committed transform after a drag. Omit for a static
   * (non-interactive) render, e.g. a thumbnail.
   */
  readonly onTransformChange?: (transform: ImageTransform) => void
}

export function ImageFrame({
  url,
  frame,
  transform,
  onTransformChange,
}: ImageFrameProps) {
  const image = useImageElement(url)

  // Keep the stored pan normalized to the current zoom. The pan range shrinks
  // as the composed scale changes, so a pan that was valid at high zoom can
  // fall outside the range after zooming out. Re-clamp and commit it here (in
  // an effect keyed on the user's zoom, never during render) so zooming out and
  // back in can't resurrect a stale, out-of-range pan as a visible snap.
  useEffect(() => {
    if (!image || !onTransformChange) return
    const { offsetX, offsetY } = composeImageTransform(
      computeCoverScale(image.width, image.height, frame.width, frame.height),
      transform,
      frame,
      { width: image.width, height: image.height },
    )
    if (offsetX !== transform.offsetX || offsetY !== transform.offsetY) {
      onTransformChange({ ...transform, offsetX, offsetY })
    }
    // Keyed on zoom only: a drag already commits a clamped pan, and a stale pan
    // only resurfaces when the scale changes.
  }, [image, transform.scale]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!image) return null

  const coverScale = computeCoverScale(
    image.width,
    image.height,
    frame.width,
    frame.height,
  )
  const { scale, scaledWidth, scaledHeight, x, y } = composeImageTransform(
    coverScale,
    transform,
    frame,
    { width: image.width, height: image.height },
  )

  const interactive = Boolean(onTransformChange)

  function clampNode(node: Konva.Node) {
    node.x(clampCoverPosition(node.x(), frame.width, scaledWidth))
    node.y(clampCoverPosition(node.y(), frame.height, scaledHeight))
  }

  function handleDragMove(event: KonvaEventObject<DragEvent>) {
    clampNode(event.target)
  }

  function handleDragEnd(event: KonvaEventObject<DragEvent>) {
    const node = event.target
    clampNode(node)
    // Re-derive the pan from the clamped position (same basis as the renderer)
    // and store it as a FRACTION of the frame, so it means the same at any frame
    // size (editor, thumbnail, export) — see `ImageTransform`.
    const centeredX = (frame.width - scaledWidth) / 2
    const centeredY = (frame.height - scaledHeight) / 2
    onTransformChange?.({
      ...transform,
      offsetX: (node.x() - centeredX) / frame.width,
      offsetY: (node.y() - centeredY) / frame.height,
    })
  }

  return (
    <Group
      x={frame.x}
      y={frame.y}
      clipX={0}
      clipY={0}
      clipWidth={frame.width}
      clipHeight={frame.height}
      listening={interactive}
    >
      <KonvaImage
        image={image}
        x={x}
        y={y}
        scaleX={scale}
        scaleY={scale}
        draggable={interactive}
        onDragMove={interactive ? handleDragMove : undefined}
        onDragEnd={interactive ? handleDragEnd : undefined}
      />
    </Group>
  )
}
