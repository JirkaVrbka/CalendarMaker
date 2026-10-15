/**
 * Classic Top layout (the app's default month-page design), restyled to match
 * the professional editor mockup. A photo region sits on top (~55%); the body
 * below is an editorial composition of five stacked bands:
 *
 *   1. CAPTION   — the project title in a display serif + an uppercase,
 *                  letter-spaced, muted subtitle (drawn only when provided).
 *   2. MONTH-HEAD — the localized month name (display serif, left) + the year
 *                  (muted, right), with a hairline rule beneath.
 *   3. HEADER    — the Monday-first weekday row (uppercase, small, muted).
 *   4. GRID      — the compact day grid, with Saturday/Sunday column tints and
 *                  weekend day numbers colored from the style.
 *   5. FOOTER    — "<Weekday> start" (left) + "CalendarMaker" (right), muted.
 *
 * The geometry is the PURE `computeClassicMonthLayout` helper; this module is a
 * thin react-konva node-placement layer. Day numbers and weekday headers keep
 * the user-chosen `style.fontFamily`; the caption title, month name and
 * wordmark use the mockup's Fraunces display family. Colors stay style-driven
 * (so defaults and the forced-light export are unchanged); grid lines and the
 * empty-photo placeholder remain theme-driven structural chrome.
 */
import { useTheme } from '@mui/material/styles'
import { Group, Layer, Line, Rect, Text } from 'react-konva'

import {
  getMonthMatrix,
  getMonthName,
  getWeekdayHeaders,
  getWeekStartLabel,
} from '../../../lib/calendar'
import type { PixelSize } from '../../../lib/page'
import { ImageFrame } from '../ImageFrame'
import {
  classicCellRect,
  classicHeaderCellRect,
  computeClassicMonthLayout,
  GRID_COLUMNS,
  splitMonthPage,
} from '../monthPageLayout'
import { isInteractive, type MonthLayoutProps } from './types'

/** The mockup's display serif, used for the caption title, month name + mark. */
const DISPLAY_FONT = 'Fraunces, Georgia, serif'

export function ClassicTopLayout(props: MonthLayoutProps) {
  const {
    year,
    month,
    weekStart,
    language,
    title,
    subtitle,
    size,
    style,
    imageUrl,
    imageTransform,
    onTransformChange,
  } = props
  const theme = useTheme()

  const matrix = getMonthMatrix(year, month, weekStart)
  const headers = getWeekdayHeaders(weekStart, language)
  const monthName = getMonthName(year, month, language)

  const regions = splitMonthPage(size)
  // The body is laid out within its own sub-rect, then translated into place.
  const bodySize: PixelSize = {
    width: regions.grid.width,
    height: regions.grid.height,
  }
  const layout = computeClassicMonthLayout(
    bodySize,
    matrix.length,
    style.fontScale,
  )

  const isDark = theme.palette.mode === 'dark'
  const paper = style.background
  const ink = style.text
  const saturdayColor = style.saturday
  const sundayColor = style.sunday
  const fontFamily = style.fontFamily
  // Grid lines and the empty-photo placeholder are structural chrome → keep them
  // theme-driven rather than style-driven.
  const line = theme.palette.divider
  const placeholderFill = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'

  const cellPad = layout.grid.columnWidth * 0.08
  const hasImage = Boolean(imageUrl && imageTransform)
  const interactive = isInteractive(props)

  // Caption text is optional; draw each line only when it is non-empty.
  const captionTitle = title?.trim() ? title : undefined
  const captionSubtitle = subtitle?.trim() ? subtitle : undefined
  const hasCaption = Boolean(captionTitle || captionSubtitle)

  return (
    <>
      {/* Paper + photo-region placeholder + body (all non-interactive). */}
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
          cornerRadius={layout.padX * 0.25}
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

        {/* Body region: caption, month-head, weekday headers, grid and footer. */}
        <Group x={regions.grid.x} y={regions.grid.y}>
          {/* Caption: display-serif title + uppercase, letter-spaced subtitle. */}
          {hasCaption && (
            <Group>
              {captionTitle && (
                <Text
                  x={layout.caption.x}
                  y={layout.caption.y}
                  width={layout.caption.width}
                  text={captionTitle}
                  align="center"
                  fontFamily={DISPLAY_FONT}
                  fontSize={layout.caption.titleFontSize}
                  fontStyle="600"
                  fill={ink}
                />
              )}
              {captionSubtitle && (
                <Text
                  x={layout.caption.x}
                  y={
                    layout.caption.y +
                    (captionTitle ? layout.caption.titleFontSize * 1.25 : 0)
                  }
                  width={layout.caption.width}
                  text={captionSubtitle.toUpperCase()}
                  align="center"
                  fontFamily={fontFamily}
                  fontSize={layout.caption.subtitleFontSize}
                  fontStyle="600"
                  letterSpacing={layout.caption.subtitleFontSize * 0.14}
                  fill={ink}
                  opacity={0.6}
                />
              )}
            </Group>
          )}

          {/* Month-head: big month name (left) + year (right), ruled beneath. */}
          <Group>
            <Text
              x={layout.monthHead.x}
              y={layout.monthHead.y}
              height={layout.monthHead.height}
              text={monthName}
              verticalAlign="bottom"
              fontFamily={DISPLAY_FONT}
              fontSize={layout.monthHead.nameFontSize}
              fontStyle="600"
              fill={ink}
            />
            <Text
              x={layout.monthHead.x}
              y={layout.monthHead.y}
              width={layout.monthHead.width}
              height={layout.monthHead.height}
              text={String(year)}
              align="right"
              verticalAlign="bottom"
              fontFamily={DISPLAY_FONT}
              fontSize={layout.monthHead.yearFontSize}
              letterSpacing={layout.monthHead.yearFontSize * 0.3}
              fill={ink}
              opacity={0.65}
            />
            {/* Rule under the month-head (ink, like the mockup's 1.5px border). */}
            <Line
              points={[
                layout.monthHead.x,
                layout.monthHead.y + layout.monthHead.height,
                layout.monthHead.x + layout.monthHead.width,
                layout.monthHead.y + layout.monthHead.height,
              ]}
              stroke={ink}
              strokeWidth={1.5}
            />
          </Group>

          {/* Weekday headers + weekend column tints behind the grid. */}
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
              const hr = classicHeaderCellRect(layout, col)
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
                    text={label.toUpperCase()}
                    align="center"
                    verticalAlign="middle"
                    fontFamily={fontFamily}
                    fontSize={layout.header.fontSize}
                    fontStyle="700"
                    letterSpacing={layout.header.fontSize * 0.08}
                    fill={columnColor ?? ink}
                    opacity={columnColor ? 0.85 : 0.5}
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
                const rect = classicCellRect(layout, row, col)
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

          {/* Footer: week-start note (left) + wordmark (right), muted. */}
          <Group>
            <Line
              points={[
                layout.footer.x,
                layout.footer.y,
                layout.footer.x + layout.footer.width,
                layout.footer.y,
              ]}
              stroke={line}
              strokeWidth={1}
            />
            <Text
              x={layout.footer.x}
              y={layout.footer.y}
              height={layout.footer.height}
              text={getWeekStartLabel(weekStart, language).toUpperCase()}
              verticalAlign="middle"
              fontFamily={fontFamily}
              fontSize={layout.footer.fontSize}
              letterSpacing={layout.footer.fontSize * 0.08}
              fill={ink}
              opacity={0.5}
            />
            <Text
              x={layout.footer.x}
              y={layout.footer.y}
              width={layout.footer.width}
              height={layout.footer.height}
              text="CalendarMaker"
              align="right"
              verticalAlign="middle"
              fontFamily={DISPLAY_FONT}
              fontStyle="italic"
              fontSize={layout.footer.fontSize * 1.2}
              fill={ink}
              opacity={0.5}
            />
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
