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
  // Hit area kept tight to the text (estimated from the glyph count + font size,
  // capped to the printable width) so the photo below stays pannable elsewhere.
  const maxWidth = size.width * 0.9
  const textW = Math.min(estimateTextWidth(text, fontSize), maxWidth)
  const textH = fontSize * 1.3
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
      fontSize={fontSize}
      fontStyle={bold ? '700' : '400'}
      fill={fill}
      draggable={interactive}
      onDragMove={interactive ? handleDragMove : undefined}
      onDragEnd={interactive ? handleDragEnd : undefined}
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
