/**
 * Visual month-page layout picker: one clickable PREVIEW per registered layout
 * (two in Wave 1, seven after Wave 2). Each preview renders that layout for the
 * active month page's data + the current style at a small size, reusing the
 * `MonthPageCanvas` dispatcher with a `layout` override (like the navigator
 * thumbnails). The active layout is highlighted; clicking one calls `setLayout`.
 *
 * Accessibility: a single-select radiogroup — each option is a `radio` with an
 * `aria-checked` state and a localized accessible name from the registry.
 */
import { memo } from 'react'

import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { A4_PORTRAIT, fitPageSize } from '../../lib/page'
import type { CalendarStyle, ImageTransform, Language, LayoutId, WeekStart } from '../../types/calendar'
import { MonthPageCanvas } from '../editor/MonthPageCanvas'
import { REGISTERED_LAYOUTS } from '../editor/layouts/registry'
import type { MonthLayout } from '../editor/layouts/types'

/** Small preview box; A4 portrait is letterboxed into it. */
const PREVIEW_BOX = { maxWidth: 72, maxHeight: 102 }

export interface LayoutPickerProps {
  /** The currently selected layout. */
  readonly activeLayout: LayoutId
  /** Called with the chosen layout id. */
  readonly onSelect: (id: LayoutId) => void
  /** UI language — picks the localized option label and preview month name. */
  readonly language: Language
  /** Accessible group label. */
  readonly groupLabel: string
  /** Preview data: the month page to render inside each option. */
  readonly year: number
  readonly month: number
  readonly weekStart: WeekStart
  readonly style?: CalendarStyle
  readonly imageUrl?: string
  readonly imageTransform?: ImageTransform
}

function layoutLabel(layout: MonthLayout, language: Language): string {
  return language === 'cs' ? layout.labelCs : layout.labelEn
}

interface OptionProps
  extends Omit<LayoutPickerProps, 'groupLabel' | 'activeLayout'> {
  readonly layout: MonthLayout
  readonly size: { readonly width: number; readonly height: number }
  readonly selected: boolean
  /** The RAW parent callback (stable identity) — the option calls it with its
      own id, so the memo isn't defeated by a fresh closure per render. */
  readonly onSelect: (id: LayoutId) => void
}

/**
 * One preview option. The canvas is memoized on its content inputs so changing
 * the selection only repaints the highlight border, not every preview canvas.
 */
const LayoutOption = memo(function LayoutOption({
  layout,
  language,
  year,
  month,
  weekStart,
  style,
  imageUrl,
  imageTransform,
  size,
  selected,
  onSelect,
}: OptionProps) {
  const label = layoutLabel(layout, language)
  return (
    <Stack
      role="radio"
      aria-checked={selected}
      aria-label={label}
      tabIndex={selected ? 0 : -1}
      spacing={0.5}
      onClick={() => onSelect(layout.id)}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(layout.id)
        }
      }}
      sx={{
        alignItems: 'center',
        cursor: 'pointer',
        borderRadius: 1,
        p: 0.5,
        border: '2px solid',
        borderColor: selected ? 'primary.main' : 'transparent',
        boxShadow: selected ? 3 : 0,
        transition: 'border-color 120ms, box-shadow 120ms',
        '&:hover': { borderColor: selected ? 'primary.main' : 'divider' },
        '&:focus-visible': {
          outline: '2px solid',
          outlineColor: 'primary.main',
          outlineOffset: 2,
        },
      }}
    >
      <Box sx={{ pointerEvents: 'none', lineHeight: 0 }}>
        <MonthPageCanvas
          year={year}
          month={month}
          weekStart={weekStart}
          language={language}
          size={size}
          style={style}
          layout={layout.id}
          imageUrl={imageUrl}
          imageTransform={imageTransform}
        />
      </Box>
      <Typography variant="caption" sx={{ color: selected ? 'primary.main' : 'text.secondary' }}>
        {label}
      </Typography>
    </Stack>
  )
})

export function LayoutPicker({
  activeLayout,
  onSelect,
  language,
  groupLabel,
  year,
  month,
  weekStart,
  style,
  imageUrl,
  imageTransform,
}: LayoutPickerProps) {
  const size = fitPageSize(A4_PORTRAIT, PREVIEW_BOX)
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" component="div" sx={{ color: 'text.secondary' }}>
        {groupLabel}
      </Typography>
      <Stack
        role="radiogroup"
        aria-label={groupLabel}
        direction="row"
        spacing={1}
        sx={{ flexWrap: 'wrap', gap: 1 }}
      >
        {REGISTERED_LAYOUTS.map((layout) => (
          <LayoutOption
            key={layout.id}
            layout={layout}
            language={language}
            year={year}
            month={month}
            weekStart={weekStart}
            style={style}
            imageUrl={imageUrl}
            imageTransform={imageTransform}
            size={size}
            selected={layout.id === activeLayout}
            onSelect={onSelect}
          />
        ))}
      </Stack>
    </Stack>
  )
}
