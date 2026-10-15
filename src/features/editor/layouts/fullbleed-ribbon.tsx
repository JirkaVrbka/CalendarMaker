/**
 * Full-bleed Ribbon layout (mockup 02, Helmáč style): the photo fills the page
 * behind a thin dark frame, a giant month number sits in the top-right corner,
 * and a bottom dark band carries the month name + year above a single row of day
 * NUMBERS, with continuous vertical dividers at each week break and week numbers
 * along the bottom.
 *
 * The band background is a fixed dark neutral and the big number sits over the
 * full-bleed photo, so neither can follow the paper color. Their chrome text is
 * therefore a FIXED LIGHT ink (mockup 02: white on black), NOT style-driven —
 * mirroring classic-top's doctrine that fixed-background chrome is not themed.
 * Only the weekend accents follow the style: Saturdays/Sundays keep the
 * Saturday/Sunday colors (bold). The giant corner number gets a drop shadow so
 * it stays legible over any photo. Geometry comes from `computeRibbonLayout`.
 */
import { Fragment } from 'react'
import { Group, Layer, Line, Rect, Text } from 'react-konva'

import {
  getDaysInMonth,
  getIsoWeekNumber,
  getMonthName,
} from '../../../lib/calendar'
import { ImageFrame } from '../ImageFrame'
import {
  computeRibbonLayout,
  dayColumnX,
  dividerX,
} from './ribbonLayout'
import { isInteractive, type MonthLayoutProps } from './types'

/** Fixed dark neutral for the frame + date band (photo is full-bleed). */
const RIBBON_DARK = '#111418'
/** Placeholder fill shown in the photo frame before an image is uploaded. */
const RIBBON_PLACEHOLDER = '#2a2e37'
/** Week-break divider color on the fixed dark band (structural chrome). */
const RIBBON_DIVIDER = 'rgba(255,255,255,0.22)'
/**
 * Fixed LIGHT ink for the band + big-number chrome. The band is a fixed dark
 * color and the big number sits over the photo, so this text can't follow the
 * (default dark) style ink or it would be unreadable — it is fixed light to
 * match mockup 02 (white on black). Only weekend day numbers stay style-driven.
 */
const BAND_INK = '#f5f5f5'

/**
 * Measure a string's rendered width with an offscreen 2D canvas so the inline
 * year can trail the month name exactly — robust for long Czech names
 * (listopad/prosinec/září) where a per-char estimate drifts or overlaps.
 * Returns null when no canvas context is available (jsdom/no-`canvas` pkg), so
 * the caller falls back to the cheap estimate.
 */
function measureTextWidth(
  text: string,
  fontSize: number,
  fontFamily: string,
  fontWeight: string,
): number | null {
  if (typeof document === 'undefined') return null
  const ctx = document.createElement('canvas').getContext('2d')
  if (!ctx) return null
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
  return ctx.measureText(text).width
}

export function FullbleedRibbonLayout(props: MonthLayoutProps) {
  const {
    year,
    month,
    weekStart,
    language,
    size,
    style,
    imageUrl,
    imageTransform,
    onTransformChange,
  } = props

  const daysInMonth = getDaysInMonth(year, month)
  const layout = computeRibbonLayout(size, daysInMonth)
  const monthName = getMonthName(year, month, language)
  const fontFamily = style.fontFamily

  const hasImage = Boolean(imageUrl && imageTransform)
  const interactive = isInteractive(props)

  // The last weekday of the week (a divider is drawn after it): Sunday for a
  // Monday-first week. The week-number label sits at each week START.
  const weekEndDay = (weekStart + 6) % 7

  // Inline year placement: measure the month-name width so the year trails it
  // exactly, falling back to a per-char estimate when no canvas is available
  // (jsdom). A label-only placement — not part of the pure geometry.
  const monthTextWidth =
    measureTextWidth(monthName, layout.monthLabel.fontSize, fontFamily, '800') ??
    monthName.length * layout.monthLabel.fontSize * 0.58
  const yearX = layout.monthLabel.x + monthTextWidth + layout.yearLabel.gap
  const yearY =
    layout.monthLabel.y + (layout.monthLabel.fontSize - layout.yearLabel.fontSize)

  return (
    <>
      {/* Page background = dark frame + band; photo inset on top of it. */}
      <Layer listening={false}>
        <Rect x={0} y={0} width={size.width} height={size.height} fill={RIBBON_DARK} />
        {!hasImage && (
          <Rect
            x={layout.photo.x}
            y={layout.photo.y}
            width={layout.photo.width}
            height={layout.photo.height}
            fill={RIBBON_PLACEHOLDER}
          />
        )}
      </Layer>

      {/* Full-bleed photo (draggable) inside the frame. */}
      {hasImage && (
        <Layer>
          <ImageFrame
            url={imageUrl!}
            frame={layout.photo}
            transform={imageTransform!}
            onTransformChange={interactive ? onTransformChange : undefined}
          />
        </Layer>
      )}

      {/* Band + big number + dates (non-interactive, drawn over the photo). */}
      <Layer listening={false}>
        {/* Dark date band */}
        <Rect
          x={layout.band.x}
          y={layout.band.y}
          width={layout.band.width}
          height={layout.band.height}
          fill={RIBBON_DARK}
        />

        {/* Giant month number, top-right, over the photo: fixed light ink plus
            a soft drop shadow so it stays legible against any image. */}
        <Text
          x={layout.bigNumber.x}
          y={layout.bigNumber.y}
          width={layout.bigNumber.width}
          text={String(month + 1)}
          align="right"
          fontFamily={fontFamily}
          fontSize={layout.bigNumber.fontSize}
          fontStyle="900"
          fill={BAND_INK}
          shadowColor="#000000"
          shadowBlur={layout.bigNumber.fontSize * 0.15}
          shadowOffsetY={layout.bigNumber.fontSize * 0.03}
          shadowOpacity={0.45}
        />

        {/* Month name + year above the day row (fixed light band chrome). */}
        <Text
          x={layout.monthLabel.x}
          y={layout.monthLabel.y}
          text={monthName}
          fontFamily={fontFamily}
          fontSize={layout.monthLabel.fontSize}
          fontStyle="800"
          fill={BAND_INK}
        />
        <Text
          x={yearX}
          y={yearY}
          text={String(year)}
          fontFamily={fontFamily}
          fontSize={layout.yearLabel.fontSize}
          fontStyle="600"
          fill={BAND_INK}
          opacity={0.7}
        />

        {/* Week-break dividers, spanning the whole dates block. */}
        <Group>
          {Array.from({ length: daysInMonth }, (_, i) => {
            const weekday = new Date(year, month, i + 1).getDay()
            if (weekday !== weekEndDay) return null
            const x = dividerX(layout, i)
            return (
              <Line
                key={`div-${i}`}
                points={[x, layout.dividerTop, x, layout.dividerBottom]}
                stroke={RIBBON_DIVIDER}
                strokeWidth={1}
              />
            )
          })}
        </Group>

        {/* Day numbers (weekends colored + bold) and week numbers. */}
        <Group>
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1
            const date = new Date(year, month, day)
            const weekday = date.getDay()
            const isSat = weekday === 6
            const isSun = weekday === 0
            const dayColor = isSat ? style.saturday : isSun ? style.sunday : BAND_INK
            const x = dayColumnX(layout, i)
            const isWeekStart = day === 1 || weekday === weekStart
            return (
              <Fragment key={`d-${i}`}>
                <Text
                  x={x}
                  y={layout.daysRow.y}
                  width={layout.dayColumnWidth}
                  text={String(day).padStart(2, '0')}
                  align="center"
                  fontFamily={fontFamily}
                  fontSize={layout.daysRow.fontSize}
                  fontStyle={isSat || isSun ? '900' : '600'}
                  fill={dayColor}
                />
                {isWeekStart && (
                  <Text
                    x={x + layout.dayColumnWidth * 0.1}
                    y={layout.weeksRow.y}
                    text={String(getIsoWeekNumber(date))}
                    align="left"
                    fontFamily={fontFamily}
                    fontSize={layout.weeksRow.fontSize}
                    fontStyle="700"
                    fill={BAND_INK}
                    opacity={0.55}
                  />
                )}
              </Fragment>
            )
          })}
        </Group>
      </Layer>
    </>
  )
}
