/**
 * Shared contract for month-page LAYOUT templates. A layout owns the drawing of
 * ONE month page's calendar (and its photo frame) as react-konva content; the
 * `MonthPageCanvas` dispatcher owns the surrounding `<Stage>` and feeds every
 * layout the same `MonthLayoutProps`. Keeping one interface here lets the
 * registry treat all layouts uniformly and lets the picker render any of them.
 *
 * Each layout computes its own photo-frame rect (reusing `ImageFrame`) and draws
 * its calendar with a PURE, unit-tested geometry helper, so the Konva module
 * stays a thin node-placement layer.
 */
import type { ReactNode } from 'react'

import type { PixelSize } from '../../../lib/page'
import type { ImageTransform, Language, WeekStart } from '../../../types/calendar'
import type { ResolvedStyle } from '../resolveStyle'

/** Everything a layout needs to render one month page. */
export interface MonthLayoutProps {
  /** Page pixel size (A4 portrait, letterboxed to the host box). */
  readonly size: PixelSize
  /** Full year, e.g. 2026. */
  readonly year: number
  /** 0-indexed month (0 = January). */
  readonly month: number
  readonly weekStart: WeekStart
  readonly language: Language
  /**
   * Editorial caption title drawn on the page (the project's cover title).
   * Optional — layouts that have no caption band (and empty values) ignore it;
   * Classic Top renders it only when non-empty.
   */
  readonly title?: string
  /** Editorial caption subtitle; same optional/ignored rules as `title`. */
  readonly subtitle?: string
  /** Fully-resolved style (font + colors) the dispatcher derived once. */
  readonly style: ResolvedStyle
  /** Object-URL of the month photo, if one has been uploaded. */
  readonly imageUrl?: string
  /** The month photo's zoom/pan transform. */
  readonly imageTransform?: ImageTransform
  /**
   * Whether the photo should be draggable. Defaults to "interactive when an
   * `onTransformChange` is supplied" — thumbnails, previews and the PDF export
   * pass a static (non-interactive) render.
   */
  readonly imageInteractive?: boolean
  /** Called when the photo is dragged; omit (or set non-interactive) for statics. */
  readonly onTransformChange?: (transform: ImageTransform) => void
}

/** A registered month-page layout template. */
export interface MonthLayout {
  readonly id: import('../../../types/calendar').LayoutId
  /** Human label for the picker (English). */
  readonly labelEn: string
  /** Human label for the picker (Czech). */
  readonly labelCs: string
  /** Render this layout's react-konva content for one month page. */
  readonly render: (props: MonthLayoutProps) => ReactNode
}

/** Resolve whether a layout render should be photo-interactive. */
export function isInteractive(props: MonthLayoutProps): boolean {
  return props.imageInteractive ?? Boolean(props.onTransformChange)
}
