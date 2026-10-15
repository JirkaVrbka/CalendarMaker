/**
 * Renders the calendar's cover page on a react-konva canvas: a paper
 * background, a full-page photo frame, and the project title + optional subtitle
 * as draggable text. When a photo is present it fills the page (clipped,
 * draggable, cover-fit by default) with the texts drawn over it; when empty, a
 * dashed image-placeholder frame is drawn instead. The paper/text color and font
 * come from the resolved calendar style (user-chosen, or DEFAULT_STYLE); only
 * structural chrome (the border and placeholder frame) is driven by the active
 * MUI theme.
 *
 * Title and subtitle positions are stored as a CENTER anchor in page fractions
 * (`TextPosition`), so they place identically in the editor, the thumbnail, and
 * the export. When the `onTitleMove` / `onSubtitleMove` callbacks are supplied
 * (the editor) each text is draggable, clamped on-page, and commits its new
 * fractional center on drag end; without them (thumbnail / PDF export) the texts
 * render static. The texts sit on a TOP listening layer with a hit area kept
 * tight to the text, so the photo below stays pannable everywhere else.
 */
import { useTheme } from '@mui/material/styles'
import { Group, Layer, Line, Rect, Stage, Text } from 'react-konva'
import type { Ref } from 'react'
import type Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'

import type { PixelSize } from '../../lib/page'
import {
  DEFAULT_STYLE,
  DEFAULT_SUBTITLE_POSITION,
  DEFAULT_TITLE_POSITION,
} from '../../types/calendar'
import type { CalendarStyle, ImageTransform, TextPosition } from '../../types/calendar'
import {
  clampTextTopLeft,
  coverTextLayout,
  estimateTextWidth,
  topLeftToCenterFraction,
} from './coverTextLayout'
import { ImageFrame } from './ImageFrame'
import { resolveStyle } from './resolveStyle'

export interface CoverPageCanvasProps {
  readonly title: string
  /** Cover subtitle; an empty string renders nothing for it. */
  readonly subtitle?: string
  /** Title center anchor as a page fraction; defaults to top-center. */
  readonly titlePosition?: TextPosition
  /** Subtitle center anchor as a page fraction; defaults just below the title. */
  readonly subtitlePosition?: TextPosition
  readonly size: PixelSize
  /** Whole-calendar style (font + colors); falls back to theme when absent. */
  readonly style?: CalendarStyle
  /** Object-URL of the cover photo, if one has been uploaded. */
  readonly imageUrl?: string
  /** The cover photo's zoom/pan transform. */
  readonly imageTransform?: ImageTransform
  /** Called when the photo is dragged; omit for a static (thumbnail) render. */
  readonly onTransformChange?: (transform: ImageTransform) => void
  /** Called with the title's new fractional center on drag end (editor only). */
  readonly onTitleMove?: (position: TextPosition) => void
  /** Called with the subtitle's new fractional center on drag end (editor only). */
  readonly onSubtitleMove?: (position: TextPosition) => void
  /**
   * Optional ref to the underlying Konva `Stage`. Used by the PDF export to
   * snapshot an offscreen render; unused by the on-screen editor.
   */
  readonly stageRef?: Ref<Konva.Stage>
}

// Cached offscreen canvas 2D context used to measure the ACTUAL rendered width
// of cover text. `estimateTextWidth` (coverTextLayout.ts) is a crude
// char-count-based approximation that undershoots wide text, which previously
// made the Text node's `width` (with `wrap="none"`) too narrow and truncated
// the tail of longer titles/subtitles. Measuring with the same font Konva
// actually draws eliminates that mismatch; the estimate remains as a fallback
// for environments without a canvas 2D context (e.g. jsdom in tests).
let measureCtx: CanvasRenderingContext2D | null | undefined
function measureTextWidth(
  text: string,
  fontSize: number,
  bold: boolean,
  fontFamily: string,
): number | undefined {
  if (measureCtx === undefined) {
    measureCtx = typeof document !== 'undefined'
      ? document.createElement('canvas').getContext('2d')
      : null
  }
  if (!measureCtx) return undefined
  measureCtx.font = `${bold ? 700 : 400} ${fontSize}px ${fontFamily}`
  const w = measureCtx.measureText(text).width
  return w > 0 ? w : undefined
}

/** A single draggable (or static) cover text, center-anchored by page fraction. */
function CoverText({
  text,
  position,
  size,
  fontSize,
  bold,
  fontFamily,
  fill,
  onMove,
}: {
  readonly text: string
  readonly position: TextPosition
  readonly size: PixelSize
  readonly fontSize: number
  readonly bold: boolean
  readonly fontFamily: string
  readonly fill: string
  readonly onMove?: (position: TextPosition) => void
}) {
  // Box width: measure the ACTUAL rendered width with the same font Konva
  // draws with (plus a tiny safety pad so sub-pixel differences never clip
  // the last glyph), falling back to the char-count estimate when no canvas
  // 2D context is available (e.g. jsdom in tests). Capped to the printable
  // width so the hit area never spills past the page.
  const maxWidth = size.width * 0.9
  const measured = measureTextWidth(text, fontSize, bold, fontFamily)
  const naturalW = measured !== undefined ? measured + fontSize * 0.1 : estimateTextWidth(text, fontSize)
  // If the title/subtitle is wider than the printable area even at its
  // configured font size, shrink the font to fit rather than truncating it
  // (Konva clips to `width` with `wrap="none"`, so an over-wide box would cut
  // off the tail of the text instead of shrinking it). fitScale is 1 (no-op)
  // for text that already fits.
  const fitScale = naturalW > maxWidth ? maxWidth / naturalW : 1
  const effFontSize = fontSize * fitScale
  const textW = Math.min(naturalW, maxWidth)
  const textH = effFontSize * 1.3
  const topLeft = coverTextLayout(position, size, textW, textH)
  const interactive = Boolean(onMove)

  function clampNode(node: Konva.Node) {
    const clamped = clampTextTopLeft(node.x(), node.y(), size, textW, textH)
    node.x(clamped.x)
    node.y(clamped.y)
  }

  function handleDragMove(event: KonvaEventObject<DragEvent>) {
    clampNode(event.target)
  }

  function handleDragEnd(event: KonvaEventObject<DragEvent>) {
    const node = event.target
    onMove?.(topLeftToCenterFraction(node.x(), node.y(), size, textW, textH))
  }

  // Cursor affordance: a "grab" hand while hovering a moveable text, and a
  // "grabbing" fist while actually dragging it. `getStage()` can be null for
  // an unmounted/detached node, so each handler guards against that.
  function setCursor(event: KonvaEventObject<Event | DragEvent>, cursor: string) {
    const stage = event.target.getStage()
    if (stage) stage.container().style.cursor = cursor
  }

  function handleMouseEnter(event: KonvaEventObject<MouseEvent>) {
    setCursor(event, 'grab')
  }

  function handleMouseLeave(event: KonvaEventObject<MouseEvent>) {
    setCursor(event, 'default')
  }

  function handleDragStart(event: KonvaEventObject<DragEvent>) {
    setCursor(event, 'grabbing')
  }

  function handleDragEndWithCursor(event: KonvaEventObject<DragEvent>) {
    // Pointer is still over the node once the drag ends, so "grab" (not
    // "default") is the correct resting cursor; still run the position commit.
    setCursor(event, 'grab')
    handleDragEnd(event)
  }

  return (
    <Text
      x={topLeft.x}
      y={topLeft.y}
      width={textW}
      height={textH}
      text={text}
      align="center"
      verticalAlign="middle"
      wrap="none"
      fontFamily={fontFamily}
      fontSize={effFontSize}
      fontStyle={bold ? '700' : '400'}
      fill={fill}
      draggable={interactive}
      onDragMove={interactive ? handleDragMove : undefined}
      onDragEnd={interactive ? handleDragEndWithCursor : undefined}
      onMouseEnter={interactive ? handleMouseEnter : undefined}
      onMouseLeave={interactive ? handleMouseLeave : undefined}
      onDragStart={interactive ? handleDragStart : undefined}
    />
  )
}

export function CoverPageCanvas({
  title,
  subtitle = '',
  titlePosition = DEFAULT_TITLE_POSITION,
  subtitlePosition = DEFAULT_SUBTITLE_POSITION,
  size,
  style,
  imageUrl,
  imageTransform,
  onTransformChange,
  onTitleMove,
  onSubtitleMove,
  stageRef,
}: CoverPageCanvasProps) {
  const theme = useTheme()

  if (size.width <= 0 || size.height <= 0) return null

  // The style is always fully populated, so these explicit (light-by-default)
  // values are what paints; the theme-derived fallback is only a safety net for
  // a partial/absent style (see MonthPageCanvas).
  const resolved = resolveStyle(style, {
    fontFamily: DEFAULT_STYLE.fontFamily,
    textColor: theme.palette.text.primary,
    saturdayColor: theme.palette.primary.main,
    sundayColor: theme.palette.error.main,
    backgroundColor: theme.palette.background.paper,
    fontScale: DEFAULT_STYLE.fontScale,
  })
  const paper = resolved.background
  const titleColor = resolved.text
  const fontFamily = resolved.fontFamily
  const line = theme.palette.divider
  const frameStroke = theme.palette.text.secondary

  const padding = size.width * 0.08

  const titleFontSize = size.height * 0.055
  const subtitleFontSize = size.height * 0.03

  // The photo fills the whole page; the placeholder sits in the body only.
  const fullPage = { x: 0, y: 0, width: size.width, height: size.height }
  const placeholder = {
    x: padding,
    y: size.height * 0.26,
    width: size.width - padding * 2,
    height: size.height * 0.62,
  }

  const hasImage = Boolean(imageUrl && imageTransform)
  const showSubtitle = subtitle.trim() !== ''
  // Listen only when at least one text is draggable (editor). Static renders
  // (thumbnail / export) keep the layer non-listening so nothing is interactive.
  const textLayerListening = Boolean(onTitleMove || onSubtitleMove)

  return (
    <Stage ref={stageRef} width={size.width} height={size.height}>
      {/* Paper + (when empty) the placeholder frame. */}
      <Layer listening={false}>
        <Rect
          x={0}
          y={0}
          width={size.width}
          height={size.height}
          fill={paper}
          stroke={line}
          strokeWidth={1}
          cornerRadius={padding * 0.25}
        />
        {!hasImage && (
          <Group>
            <Rect
              x={placeholder.x}
              y={placeholder.y}
              width={placeholder.width}
              height={placeholder.height}
              stroke={frameStroke}
              strokeWidth={Math.max(1, size.width * 0.004)}
              dash={[size.width * 0.03, size.width * 0.02]}
              cornerRadius={padding * 0.25}
            />
            <Line
              points={[
                placeholder.x,
                placeholder.y,
                placeholder.x + placeholder.width,
                placeholder.y + placeholder.height,
              ]}
              stroke={frameStroke}
              strokeWidth={1}
              opacity={0.4}
            />
            <Line
              points={[
                placeholder.x + placeholder.width,
                placeholder.y,
                placeholder.x,
                placeholder.y + placeholder.height,
              ]}
              stroke={frameStroke}
              strokeWidth={1}
              opacity={0.4}
            />
          </Group>
        )}
      </Layer>

      {/* Photo (draggable) in its own listening layer, below the texts. */}
      {hasImage && (
        <Layer>
          <ImageFrame
            url={imageUrl!}
            frame={fullPage}
            transform={imageTransform!}
            onTransformChange={onTransformChange}
          />
        </Layer>
      )}

      {/* Title + subtitle on top; only the (tight) text nodes capture drags, so
          the photo below is still pannable everywhere else. */}
      <Layer listening={textLayerListening}>
        <CoverText
          text={title}
          position={titlePosition}
          size={size}
          fontSize={titleFontSize}
          bold
          fontFamily={fontFamily}
          fill={titleColor}
          onMove={onTitleMove}
        />
        {showSubtitle && (
          <CoverText
            text={subtitle}
            position={subtitlePosition}
            size={size}
            fontSize={subtitleFontSize}
            bold={false}
            fontFamily={fontFamily}
            fill={titleColor}
            onMove={onSubtitleMove}
          />
        )}
      </Layer>
    </Stage>
  )
}
