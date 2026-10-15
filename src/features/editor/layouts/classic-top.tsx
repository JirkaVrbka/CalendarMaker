/**
 * Classic Top layout (the app's original month-page design): a photo region on
 * top (~55%) and the day grid below (~45%), with a centered localized month
 * title, a Monday-first weekday header row and Saturday/Sunday highlights. This
 * is the verbatim refactor of the former `MonthPageCanvas` drawing — it now
 * returns the layers only; the dispatcher owns the `<Stage>`.
 *
 * Text colors and font come from the resolved calendar style (passed in);
 * structural chrome (grid lines, empty placeholder) stays theme-driven.
 */
import { useTheme } from '@mui/material/styles'
import { Group, Layer, Line, Rect, Text } from 'react-konva'

import {
  getMonthMatrix,
  getMonthName,
  getWeekdayHeaders,
} from '../../../lib/calendar'
import type { PixelSize } from '../../../lib/page'
import { ImageFrame } from '../ImageFrame'
import {
  cellRect,
  computeMonthPageLayout,
  GRID_COLUMNS,
  headerCellRect,
  splitMonthPage,
} from '../monthPageLayout'
import { isInteractive, type MonthLayoutProps } from './types'

export function ClassicTopLayout(props: MonthLayoutProps) {
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
  const theme = useTheme()

  const matrix = getMonthMatrix(year, month, weekStart)
  const headers = getWeekdayHeaders(weekStart, language)
  const title = getMonthName(year, month, language)

  const regions = splitMonthPage(size)
  // The grid is laid out within its own sub-rect, then translated into place.
  const gridSize: PixelSize = {
    width: regions.grid.width,
    height: regions.grid.height,
  }
  const layout = computeMonthPageLayout(gridSize, matrix.length)

  const isDark = theme.palette.mode === 'dark'
  const paper = style.background
  const ink = style.text
  const saturdayColor = style.saturday
  const sundayColor = style.sunday
  const fontFamily = style.fontFamily
  // Grid lines and the empty-photo placeholder are structural chrome (accent /
  // grid color is out of scope this slice) → keep them theme-driven.
  const line = theme.palette.divider
  const placeholderFill = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'

  const cellPad = layout.grid.columnWidth * 0.08
  const hasImage = Boolean(imageUrl && imageTransform)
  const interactive = isInteractive(props)

  return (
    <>
      {/* Paper + photo-region placeholder + grid (all non-interactive). */}
      <Layer listening={false}>
        {/* Paper */}
        <Rect
          x={0}
          y={0}
          width={size.width}
          height={size.height}
          fill={paper}
          stroke={line}
          strokeWidth={1}
          cornerRadius={layout.padding * 0.25}
        />

        {/* Empty-state photo region */}
        {!hasImage && (
          <Rect
            x={regions.photo.x}
            y={regions.photo.y}
            width={regions.photo.width}
            height={regions.photo.height}
            fill={placeholderFill}
          />
        )}

        {/* Grid region: month title, headers, grid lines and day numbers. */}
        <Group x={regions.grid.x} y={regions.grid.y}>
          {/* Month title */}
          <Text
            x={layout.title.x}
            y={layout.title.y}
            width={layout.title.width}
            height={layout.title.height}
            text={title}
            align="center"
            verticalAlign="middle"
            fontFamily={fontFamily}
            fontSize={layout.title.fontSize}
            fontStyle="700"
            fill={ink}
          />

          {/* Weekday headers + weekend highlights */}
          <Group>
            {headers.map((label, col) => {
              // Column → weekday: 6 = Saturday, 0 = Sunday (the two tinted
              // columns); each gets its own color. Weekdays stay untinted.
              const weekdayIndex = (weekStart + col) % GRID_COLUMNS
              const columnColor =
                weekdayIndex === 6
                  ? saturdayColor
                  : weekdayIndex === 0
                    ? sundayColor
                    : undefined
              const hr = headerCellRect(layout, col)
              return (
                <Group key={`h-${col}`}>
                  {columnColor && (
                    <Rect
                      x={hr.x}
                      y={hr.y}
                      width={hr.width}
                      height={layout.grid.y + layout.grid.height - hr.y}
                      fill={columnColor}
                      opacity={0.1}
                      cornerRadius={layout.grid.columnWidth * 0.06}
                    />
                  )}
                  <Text
                    x={hr.x}
                    y={hr.y}
                    width={hr.width}
                    height={hr.height}
                    text={label}
                    align="center"
                    verticalAlign="middle"
                    fontFamily={fontFamily}
                    fontSize={layout.headerFontSize}
                    fontStyle="700"
                    fill={ink}
                    opacity={0.65}
                  />
                </Group>
              )
            })}
          </Group>

          {/* Grid lines */}
          <Group>
            {Array.from({ length: GRID_COLUMNS + 1 }, (_, i) => {
              const x = layout.grid.x + i * layout.grid.columnWidth
              return (
                <Line
                  key={`v-${i}`}
                  points={[x, layout.grid.y, x, layout.grid.y + layout.grid.height]}
                  stroke={line}
                  strokeWidth={1}
                />
              )
            })}
            {Array.from({ length: layout.grid.rows + 1 }, (_, i) => {
              const y = layout.grid.y + i * layout.grid.rowHeight
              return (
                <Line
                  key={`hl-${i}`}
                  points={[layout.grid.x, y, layout.grid.x + layout.grid.width, y]}
                  stroke={line}
                  strokeWidth={1}
                />
              )
            })}
          </Group>

          {/* Day numbers */}
          <Group>
            {matrix.map((week, row) =>
              week.map((cell, col) => {
                if (cell === null) return null
                const rect = cellRect(layout, row, col)
                // Day numbers are colored by the day's OWN weekday: Saturday
                // (6) and Sunday (0) each take their color; weekdays use ink.
                const weekday = cell.date.getDay()
                const dayColor =
                  weekday === 6
                    ? saturdayColor
                    : weekday === 0
                      ? sundayColor
                      : ink
                return (
                  <Text
                    key={`d-${row}-${col}`}
                    x={rect.x + cellPad}
                    y={rect.y + cellPad}
                    width={rect.width - cellPad * 2}
                    text={String(cell.day)}
                    align="left"
                    fontFamily={fontFamily}
                    fontSize={layout.dayFontSize}
                    fontStyle={cell.isWeekend ? '700' : '400'}
                    fill={dayColor}
                  />
                )
              }),
            )}
          </Group>
        </Group>
      </Layer>

      {/* Photo (draggable) in its own listening layer. */}
      {hasImage && (
        <Layer>
          <ImageFrame
            url={imageUrl!}
            frame={regions.photo}
            transform={imageTransform!}
            onTransformChange={interactive ? onTransformChange : undefined}
          />
        </Layer>
      )}
    </>
  )
}
