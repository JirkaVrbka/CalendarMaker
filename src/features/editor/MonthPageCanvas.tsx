/**
 * Month-page DISPATCHER. It owns the react-konva `<Stage>` (and the `stageRef`
 * the PDF export snapshots) and resolves the whole-calendar style ONCE, then
 * delegates all drawing to the selected layout from the registry
 * (`registry[layout].render(props)`). The layout — Classic Top by default —
 * draws the photo frame (reusing `ImageFrame` for the draggable, clipped photo)
 * and the calendar elements.
 *
 * The same component serves the editor (interactive photo), the navigator
 * thumbnails, the picker previews and the export capture; callers select the
 * layout via the `layout` prop (defaulting to the project's/the app default).
 *
 * Text colors and font come from the resolved calendar style (user-chosen, or
 * DEFAULT_STYLE); only structural chrome is driven by the active MUI theme, so
 * each layout takes a `useTheme()` of its own for that.
 */
import { useTheme } from '@mui/material/styles'
import { Stage } from 'react-konva'
import type { Ref } from 'react'
import type Konva from 'konva'

import type { PixelSize } from '../../lib/page'
import { DEFAULT_LAYOUT, DEFAULT_STYLE } from '../../types/calendar'
import type {
  CalendarStyle,
  ImageTransform,
  Language,
  LayoutId,
  WeekStart,
} from '../../types/calendar'
import { getLayout } from './layouts/registry'
import { resolveStyle } from './resolveStyle'

export interface MonthPageCanvasProps {
  readonly year: number
  /** 0-indexed month (0 = January). */
  readonly month: number
  readonly weekStart: WeekStart
  readonly language: Language
  readonly size: PixelSize
  /** Editorial caption title drawn on the page (Classic Top). Optional. */
  readonly title?: string
  /** Editorial caption subtitle drawn on the page (Classic Top). Optional. */
  readonly subtitle?: string
  /** Whole-calendar style (font + colors); falls back to theme when absent. */
  readonly style?: CalendarStyle
  /**
   * Which month-page layout to render. Defaults to the app default (Classic
   * Top); the picker previews pass a specific id to render that one layout.
   */
  readonly layout?: LayoutId
  /** Object-URL of the month photo, if one has been uploaded. */
  readonly imageUrl?: string
  /** The month photo's zoom/pan transform. */
  readonly imageTransform?: ImageTransform
  /** Called when the photo is dragged; omit for a static (thumbnail) render. */
  readonly onTransformChange?: (transform: ImageTransform) => void
  /**
   * Optional ref to the underlying Konva `Stage`. Used by the PDF export to
   * snapshot an offscreen render; unused by the on-screen editor.
   */
  readonly stageRef?: Ref<Konva.Stage>
}

export function MonthPageCanvas({
  year,
  month,
  weekStart,
  language,
  size,
  title,
  subtitle,
  style,
  layout = DEFAULT_LAYOUT,
  imageUrl,
  imageTransform,
  onTransformChange,
  stageRef,
}: MonthPageCanvasProps) {
  const theme = useTheme()

  if (size.width <= 0 || size.height <= 0) return null

  // Resolve the style once (light-by-default explicit values; the theme-derived
  // fallback is only a safety net for a partial/absent style) and hand the
  // concrete values to the layout.
  const resolved = resolveStyle(style, {
    fontFamily: DEFAULT_STYLE.fontFamily,
    textColor: theme.palette.text.primary,
    saturdayColor: theme.palette.primary.main,
    sundayColor: theme.palette.error.main,
    backgroundColor: theme.palette.background.paper,
    fontScale: DEFAULT_STYLE.fontScale,
  })

  const content = getLayout(layout).render({
    size,
    year,
    month,
    weekStart,
    language,
    title,
    subtitle,
    style: resolved,
    imageUrl,
    imageTransform,
    imageInteractive: Boolean(onTransformChange),
    onTransformChange,
  })

  return (
    <Stage ref={stageRef} width={size.width} height={size.height}>
      {content}
    </Stage>
  )
}
