/**
 * Agenda layout (mockup 08, two-column list): a photo on top (~46%), the month
 * name below it, then the month's days as a two-column LIST — each row is a day
 * number + localized weekday abbreviation, filled top-to-bottom (left column
 * first). Weekends take the Saturday/Sunday colors. Page background, month name
 * and day text all follow the resolved style; the row dividers are a faint tint
 * of the style ink so they adapt to any paper. Geometry (the balanced split and
 * the row rects) comes from the pure `computeAgendaLayout`.
 */
import { Fragment } from 'react'
import { Group, Layer, Line, Rect, Text } from 'react-konva'

import {
  getDaysInMonth,
  getMonthName,
  getWeekdayHeaders,
} from '../../../lib/calendar'
import { ImageFrame } from '../ImageFrame'
import { agendaRowRect, computeAgendaLayout } from './agendaLayout'
import { isInteractive, type MonthLayoutProps } from './types'

export function AgendaLayout(props: MonthLayoutProps) {
  // Agenda lists days 1..n in calendar order (no week grid), so it does not use
  // `weekStart`.
  const { year, month, language, size, style, imageUrl, imageTransform, onTransformChange } =
    props

  const daysInMonth = getDaysInMonth(year, month)
  const monthName = getMonthName(year, month, language)
  // Weekday abbreviations indexed by JS getDay() (Sunday-first order).
  const weekdayNames = getWeekdayHeaders(0, language)
  const fontFamily = style.fontFamily
  const ink = style.text

  const layout = computeAgendaLayout(size, daysInMonth)
  const hasImage = Boolean(imageUrl && imageTransform)
  const interactive = isInteractive(props)

  // Day → (column index, row index): days 1..col1 in the left column, the rest
  // in the right, each filled top-to-bottom.
  function placement(day: number): { col: number; row: number } {
    if (day <= layout.split.col1) return { col: 0, row: day - 1 }
    return { col: 1, row: day - layout.split.col1 - 1 }
  }

  return (
    <>
      <Layer listening={false}>
        <Rect x={0} y={0} width={size.width} height={size.height} fill={style.background} />

        {!hasImage && (
          <Rect
            x={layout.photo.x}
            y={layout.photo.y}
            width={layout.photo.width}
            height={layout.photo.height}
            fill="rgba(0,0,0,0.05)"
          />
        )}

        {/* Month name + year below the photo. */}
        <Text
          x={layout.header.x}
          y={layout.header.y}
          text={monthName}
          fontFamily={fontFamily}
          fontSize={layout.header.monthFontSize}
          fontStyle="700"
          fill={ink}
        />
        <Text
          x={layout.header.x}
          y={layout.header.y}
          width={layout.header.width}
          text={String(year)}
          align="right"
          fontFamily={fontFamily}
          fontSize={layout.header.yearFontSize}
          fontStyle="700"
          fill={ink}
          opacity={0.5}
        />

        {/* Two columns of day rows. */}
        <Group>
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1
            const date = new Date(year, month, day)
            const weekday = date.getDay()
            const isSat = weekday === 6
            const isSun = weekday === 0
            const rowColor = isSat ? style.saturday : isSun ? style.sunday : ink
            const { col, row } = placement(day)
            const rect = agendaRowRect(layout, col, row)
            const numWidth = rect.width * 0.26
            const textY = rect.y + rect.height / 2
            return (
              <Fragment key={`r-${day}`}>
                {(isSat || isSun) && (
                  <Rect
                    x={rect.x}
                    y={rect.y}
                    width={rect.width}
                    height={rect.height}
                    fill={rowColor}
                    opacity={0.06}
                  />
                )}
                <Text
                  x={rect.x + rect.width * 0.03}
                  y={textY - layout.dayFontSize / 2}
                  width={numWidth}
                  text={String(day).padStart(2, '0')}
                  align="right"
                  fontFamily={fontFamily}
                  fontSize={layout.dayFontSize}
                  fontStyle="700"
                  fill={rowColor}
                />
                <Text
                  x={rect.x + rect.width * 0.03 + numWidth + rect.width * 0.05}
                  y={textY - layout.weekdayFontSize / 2}
                  text={weekdayNames[weekday].toUpperCase()}
                  fontFamily={fontFamily}
                  fontSize={layout.weekdayFontSize}
                  fontStyle="600"
                  fill={rowColor}
                  opacity={isSat || isSun ? 0.9 : 0.6}
                />
                <Line
                  points={[
                    rect.x,
                    rect.y + rect.height,
                    rect.x + rect.width,
                    rect.y + rect.height,
                  ]}
                  stroke={ink}
                  strokeWidth={1}
                  opacity={0.12}
                />
              </Fragment>
            )
          })}
        </Group>
      </Layer>

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
    </>
  )
}
