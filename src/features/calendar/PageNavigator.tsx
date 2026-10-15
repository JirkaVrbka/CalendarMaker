/**
 * A vertical rail of lightweight page thumbnails (cover + 12 months). Each
 * thumbnail is a small, non-interactive render of the real page canvas, so the
 * rail is an accurate live preview. Selection is driven by the caller (the
 * store): clicking or keyboard-selecting a thumbnail calls `onSelect`.
 *
 * Accessibility: a single-select listbox with roving tab-stop. Arrow keys and
 * Home/End move the selection, Enter/Space confirm it, and the active option is
 * both visually highlighted and exposed via `aria-selected`.
 *
 * Thumbnails are intentionally small and non-virtualized — fine for 13 pages
 * with no images. Revisit caching/virtualization when image upload lands.
 */
import { memo, useRef } from 'react'

import Box from '@mui/material/Box'

import { assertNever } from '../../lib/assertNever'
import { getMonthName } from '../../lib/calendar'
import { A4_PORTRAIT, fitPageSize, type PixelSize } from '../../lib/page'
import type {
  CalendarStyle,
  ImageEntry,
  ImageTransform,
  Language,
  LayoutId,
  Page,
  TextPosition,
  WeekStart,
} from '../../types/calendar'
import { CoverPageCanvas } from '../editor/CoverPageCanvas'
import { MonthPageCanvas } from '../editor/MonthPageCanvas'

/** Fixed thumbnail box; A4 portrait is letterboxed into it. */
const THUMB_BOX = { maxWidth: 84, maxHeight: 120 }

interface ThumbnailProps {
  readonly page: Page
  readonly size: PixelSize
  readonly weekStart: WeekStart
  readonly language: Language
  /** Title shown on the cover thumbnail; ignored for month pages. */
  readonly title: string
  /** Subtitle shown on the cover thumbnail; ignored for month pages. */
  readonly subtitle?: string
  /** Cover title position (center anchor, page fraction). */
  readonly titlePosition?: TextPosition
  /** Cover subtitle position (center anchor, page fraction). */
  readonly subtitlePosition?: TextPosition
  /** Whole-calendar month-page layout forwarded to month thumbnails. */
  readonly layout?: LayoutId
  /** Whole-calendar style forwarded to the preview canvases. */
  readonly style?: CalendarStyle
  /** This page's photo object-URL, if any (static preview — no interaction). */
  readonly imageUrl?: string
  readonly imageTransform?: ImageTransform
}

/**
 * The per-page preview canvas. Memoized on its content inputs only (never the
 * active index or selection), so changing the active page re-renders the
 * selection borders on the option wrappers without re-rendering these canvases.
 */
const Thumbnail = memo(function Thumbnail({
  page,
  size,
  weekStart,
  language,
  title,
  subtitle,
  titlePosition,
  subtitlePosition,
  layout,
  style,
  imageUrl,
  imageTransform,
}: ThumbnailProps) {
  // The canvas is a preview only — swallow pointer events so the whole option
  // stays the click target.
  return (
    <Box sx={{ pointerEvents: 'none', lineHeight: 0 }}>
      {(() => {
        switch (page.kind) {
          case 'cover':
            return (
              <CoverPageCanvas
                title={title}
                subtitle={subtitle}
                titlePosition={titlePosition}
                subtitlePosition={subtitlePosition}
                size={size}
                style={style}
                imageUrl={imageUrl}
                imageTransform={imageTransform}
              />
            )
          case 'month':
            return (
              <MonthPageCanvas
                year={page.year}
                month={page.month}
                weekStart={weekStart}
                language={language}
                size={size}
                style={style}
                layout={layout}
                imageUrl={imageUrl}
                imageTransform={imageTransform}
              />
            )
          default:
            return assertNever(page)
        }
      })()}
    </Box>
  )
})

export interface PageNavigatorProps {
  readonly pages: readonly Page[]
  readonly activeIndex: number
  readonly onSelect: (index: number) => void
  readonly weekStart: WeekStart
  readonly language: Language
  /** Title shown on the cover thumbnail. */
  readonly title: string
  /** Subtitle shown on the cover thumbnail. */
  readonly subtitle?: string
  /** Cover title position (center anchor, page fraction). */
  readonly titlePosition?: TextPosition
  /** Cover subtitle position (center anchor, page fraction). */
  readonly subtitlePosition?: TextPosition
  /** Whole-calendar month-page layout forwarded to month thumbnails. */
  readonly layout?: LayoutId
  /** Whole-calendar style forwarded to every preview canvas. */
  readonly style?: CalendarStyle
  /** Photos keyed by page slot index (0 = cover, 1..12 = months). */
  readonly images?: Readonly<Record<number, ImageEntry>>
  /** Accessible name for the cover page option. */
  readonly coverLabel: string
  /** Accessible name for the whole rail. */
  readonly navigatorLabel: string
}

export function PageNavigator({
  pages,
  activeIndex,
  onSelect,
  weekStart,
  language,
  title,
  subtitle,
  titlePosition,
  subtitlePosition,
  layout,
  style,
  images,
  coverLabel,
  navigatorLabel,
}: PageNavigatorProps) {
  const optionRefs = useRef<Array<HTMLDivElement | null>>([])
  const thumb = fitPageSize(A4_PORTRAIT, THUMB_BOX)

  function moveTo(index: number) {
    const clamped = Math.max(0, Math.min(index, pages.length - 1))
    onSelect(clamped)
    optionRefs.current[clamped]?.focus()
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault()
        moveTo(activeIndex + 1)
        break
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault()
        moveTo(activeIndex - 1)
        break
      case 'Home':
        event.preventDefault()
        moveTo(0)
        break
      case 'End':
        event.preventDefault()
        moveTo(pages.length - 1)
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        onSelect(activeIndex)
        break
      default:
        break
    }
  }

  function optionLabel(page: Page): string {
    return page.kind === 'cover'
      ? coverLabel
      : `${getMonthName(page.year, page.month, language)} ${page.year}`
  }

  return (
    <Box
      role="listbox"
      aria-label={navigatorLabel}
      aria-orientation="vertical"
      onKeyDown={handleKeyDown}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        p: 1,
        overflowY: 'auto',
        height: '100%',
      }}
    >
      {pages.map((page, index) => {
        const selected = index === activeIndex
        const label = optionLabel(page)
        return (
          <Box
            key={page.kind === 'cover' ? 'cover' : `${page.year}-${page.month}`}
            ref={(el: HTMLDivElement | null) => {
              optionRefs.current[index] = el
            }}
            role="option"
            aria-selected={selected}
            aria-label={label}
            tabIndex={selected ? 0 : -1}
            onClick={() => {
              onSelect(index)
              // Keep DOM focus in sync with selection after a mouse click.
              optionRefs.current[index]?.focus()
            }}
            sx={{
              cursor: 'pointer',
              borderRadius: 1,
              p: 0.5,
              border: '2px solid',
              borderColor: selected ? 'primary.main' : 'transparent',
              boxShadow: selected ? 3 : 0,
              transition: 'border-color 120ms, box-shadow 120ms',
              '&:hover': {
                borderColor: selected ? 'primary.main' : 'divider',
              },
              '&:focus-visible': {
                outline: '2px solid',
                outlineColor: 'primary.main',
                outlineOffset: 2,
              },
            }}
          >
            <Thumbnail
              page={page}
              size={thumb}
              weekStart={weekStart}
              language={language}
              title={title}
              subtitle={subtitle}
              titlePosition={titlePosition}
              subtitlePosition={subtitlePosition}
              layout={layout}
              style={style}
              imageUrl={images?.[index]?.url}
              imageTransform={images?.[index]?.transform}
            />
          </Box>
        )
      })}
    </Box>
  )
}
