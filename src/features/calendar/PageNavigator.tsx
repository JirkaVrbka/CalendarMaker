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
                title={title}
                subtitle={subtitle}
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
  /**
   * Optional rail header text (e.g. "Pages"), rendered above the listbox with
   * the page count in a small pill. Omit to render the rail with no header.
   */
  readonly railTitle?: string
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
  railTitle,
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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {railTitle !== undefined && (
        <Box
          sx={(theme) => ({
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            px: 2,
            py: 1.25,
            borderBottom: '1px solid',
            borderColor: theme.tokens.hairline2,
          })}
        >
          <Box
            component="span"
            sx={{
              fontSize: '10.5px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'text.secondary',
            }}
          >
            {railTitle}
          </Box>
          <Box
            component="span"
            data-testid="page-navigator-count"
            sx={(theme) => ({
              fontSize: 11,
              fontWeight: 600,
              lineHeight: 1,
              color: 'text.secondary',
              backgroundColor: theme.tokens.accentTint,
              borderRadius: `${theme.tokens.radius.sm}px`,
              px: 0.75,
              py: 0.375,
              fontVariantNumeric: 'tabular-nums',
            })}
          >
            {pages.length}
          </Box>
        </Box>
      )}
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
          flex: 1,
          minHeight: 0,
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
              sx={(theme) => ({
                cursor: 'pointer',
                borderRadius: 1,
                p: 0.5,
                border: '2px solid',
                borderColor: selected ? 'primary.main' : 'transparent',
                boxShadow: selected ? theme.tokens.shadow.sm : 'none',
                backgroundColor: selected ? theme.tokens.accentTint : 'transparent',
                transition: 'border-color 120ms, box-shadow 120ms, background-color 120ms',
                '&:hover': {
                  borderColor: selected ? 'primary.main' : 'divider',
                },
                '&:focus-visible': {
                  outline: '2px solid',
                  outlineColor: 'primary.main',
                  outlineOffset: 2,
                },
              })}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                {/* Purely visual page index ("—" for the cover, 1..12 for months);
                    the option's aria-label already carries the accessible name. */}
                <Box
                  aria-hidden="true"
                  component="span"
                  data-testid="page-navigator-index"
                  sx={{
                    flexShrink: 0,
                    width: 16,
                    fontSize: 11,
                    fontWeight: 600,
                    lineHeight: 1,
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                    color: selected ? 'primary.main' : 'text.secondary',
                  }}
                >
                  {index === 0 ? '—' : index}
                </Box>
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
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
