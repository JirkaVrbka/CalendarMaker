/**
 * Vertical Ribbon layout (mockup 10): a full-bleed photo with a dark vertical
 * date STRIP down the right side listing every day top-to-bottom (day number
 * only, no weekday abbreviation), a giant month number top-left over the
 * photo, and the month name + year below it.
 *
 * The strip is fixed dark CHROME, so its day numbers are a fixed LIGHT ink
 * (STRIP_INK) — only weekends follow the style (Saturday/Sunday colors). The big
 * number + month label sit over the photo, so they are fixed light + a drop
 * shadow for legibility over any image — the same doctrine as the Full-bleed
 * Ribbon band. Geometry comes from the pure `computeVerticalRibbonLayout`.
 */
import { Fragment } from 'react'
import { Group, Layer, Line, Rect, Text } from 'react-konva'

import { getDaysInMonth, getMonthName } from '../../../lib/calendar'
import { ImageFrame } from '../ImageFrame'
import {
  computeVerticalRibbonLayout,
  stripRowY,
} from './verticalRibbonLayout'
import { isInteractive, type MonthLayoutProps } from './types'

/** Fixed dark neutral for the date strip (chrome). */
const STRIP_FILL = '#15171c'
/** Fixed light ink for the strip day numbers (not style-driven). */
const STRIP_INK = '#e6e8ec'
/** Row divider on the dark strip. */
const STRIP_DIVIDER = 'rgba(255,255,255,0.1)'
/** Fixed light ink for the big number + month label over the photo. */
const OVERLAY_INK = '#ffffff'
/** Placeholder fill shown before an image is uploaded. */
const PLACEHOLDER_FILL = '#3a3f4b'

export function VerticalRibbonLayout(props: MonthLayoutProps) {
  // Vertical Ribbon lists days 1..n in calendar order (no week grid), so it does
  // not use `weekStart`.
  const { year, month, language, size, style, imageUrl, imageTransform, onTransformChange } =
    props

  const daysInMonth = getDaysInMonth(year, month)
  const monthName = getMonthName(year, month, language)
  const fontFamily = style.fontFamily

  const layout = computeVerticalRibbonLayout(size, daysInMonth)
  const hasImage = Boolean(imageUrl && imageTransform)
  const interactive = isInteractive(props)

  return (
    <>
      {/* Page base + empty-state placeholder behind the full-bleed photo. */}
      <Layer listening={false}>
        <Rect x={0} y={0} width={size.width} height={size.height} fill={style.background} />
        {!hasImage && (
          <Rect
            x={layout.photo.x}
            y={layout.photo.y}
            width={layout.photo.width}
            height={layout.photo.height}
            fill={PLACEHOLDER_FILL}
          />
        )}
      </Layer>

      {/* Full-bleed photo (draggable) in the left area. */}
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

      {/* Strip + big number + month label (over the photo, non-interactive). */}
      <Layer listening={false}>
        {/* Dark date strip. */}
        <Rect
          x={layout.strip.x}
          y={layout.strip.y}
          width={layout.strip.width}
          height={layout.strip.height}
          fill={STRIP_FILL}
        />

        {/* Giant month number, top-left over the photo. */}
        <Text
          x={layout.bigNumber.x}
          y={layout.bigNumber.y}
          text={String(month + 1)}
          fontFamily={fontFamily}
          fontSize={layout.bigNumber.fontSize}
          fontStyle="900"
          fill={OVERLAY_INK}
          shadowColor="#000000"
          shadowBlur={layout.bigNumber.fontSize * 0.14}
          shadowOffsetY={layout.bigNumber.fontSize * 0.03}
          shadowOpacity={0.4}
        />

        {/* Month name + year below the big number. */}
        <Text
          x={layout.monthLabel.x}
          y={layout.monthLabel.y}
          text={monthName.toUpperCase()}
          fontFamily={fontFamily}
          fontSize={layout.monthLabel.monthFontSize}
          fontStyle="800"
          fill={OVERLAY_INK}
          shadowColor="#000000"
          shadowBlur={layout.monthLabel.monthFontSize * 0.3}
          shadowOpacity={0.35}
        />
        <Text
          x={layout.monthLabel.x}
          y={layout.monthLabel.y + layout.monthLabel.monthFontSize + layout.monthLabel.yearGap}
          text={String(year)}
          fontFamily={fontFamily}
          fontSize={layout.monthLabel.yearFontSize}
          fontStyle="600"
          fill={OVERLAY_INK}
          opacity={0.8}
          shadowColor="#000000"
          shadowBlur={layout.monthLabel.yearFontSize * 0.4}
          shadowOpacity={0.3}
        />

        {/* Strip day rows: number only, weekends style-colored. */}
        <Group>
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1
            const weekday = new Date(year, month, day).getDay()
            const isSat = weekday === 6
            const isSun = weekday === 0
            const numColor = isSat ? style.saturday : isSun ? style.sunday : STRIP_INK
            const top = stripRowY(layout, i)
            return (
              <Fragment key={`v-${day}`}>
                <Text
                  x={layout.strip.x}
                  y={top}
                  width={layout.strip.width}
                  height={layout.rowHeight}
                  text={String(day)}
                  align="center"
                  verticalAlign="middle"
                  fontFamily={fontFamily}
                  fontSize={layout.numberFontSize}
                  fontStyle="700"
                  fill={numColor}
                />
                {i < daysInMonth - 1 && (
                  <Line
                    points={[
                      layout.strip.x + layout.strip.width * 0.18,
                      top + layout.rowHeight,
                      layout.strip.x + layout.strip.width * 0.82,
                      top + layout.rowHeight,
                    ]}
                    stroke={STRIP_DIVIDER}
                    strokeWidth={1}
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
