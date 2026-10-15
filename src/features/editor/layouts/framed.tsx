/**
 * Framed layout (mockup 05, polaroid style): the photo sits inside a light
 * MAT/border in the upper area, the month name is a caption under the photo, and
 * a tidy 7-column grid block sits below. The mat + grid card are fixed light
 * neutral CHROME (not style-driven, like Classic Top's grid lines); because they
 * are a fixed light surface, the NEUTRAL text on them (caption, weekday headers,
 * weekday day numbers) uses a fixed dark MAT_INK — not the style ink — so a
 * light-on-dark project stays legible (fixed chrome → fixed ink, mirroring the
 * Ribbon band). The page background follows the resolved style, and
 * Saturday/Sunday day numbers keep their style colors. Geometry comes from
 * `computeFramedLayout` and the shared `computeCalendarGrid`.
 */
import { Group, Layer, Rect, Text } from 'react-konva'

import {
  getMonthMatrix,
  getMonthName,
  getWeekdayHeaders,
} from '../../../lib/calendar'
import { ImageFrame } from '../ImageFrame'
import { GRID_COLUMNS } from '../monthPageLayout'
import {
  calendarCellRect,
  calendarHeaderRect,
  computeCalendarGrid,
} from './calendarGrid'
import { computeFramedLayout } from './framedLayout'
import { isInteractive, type MonthLayoutProps } from './types'

/** Fixed light neutral for the mat + grid card (chrome, not style-driven). */
const MAT_FILL = '#ffffff'
/** Soft shadow color for the mat + card (structural chrome). */
const CHROME_SHADOW = 'rgba(30,35,55,0.18)'
/**
 * Fixed DARK ink for the neutral text sitting ON the white mat/grid card
 * (caption, weekday headers, weekday day numbers). The mat is a fixed light
 * color, so this text can't follow the style ink or a light-on-dark project
 * (e.g. paper #1a1a1a / text #ffffff) would render white-on-white = invisible.
 * Mirrors the Full-bleed Ribbon's fixed BAND_INK doctrine (fixed chrome → fixed
 * ink). Only weekend day numbers stay style-driven (Saturday/Sunday colors).
 */
const MAT_INK = '#1f2430'

export function FramedLayout(props: MonthLayoutProps) {
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

  const matrix = getMonthMatrix(year, month, weekStart)
  const headers = getWeekdayHeaders(weekStart, language)
  const monthName = getMonthName(year, month, language)
  const fontFamily = style.fontFamily
  const ink = MAT_INK

  const layout = computeFramedLayout(size)
  const gridInner = {
    width: layout.grid.width - layout.gridPad * 2,
    height: layout.grid.height - layout.gridPad * 2,
  }
  const grid = computeCalendarGrid(gridInner, matrix.length)
  const cellPad = grid.body.columnWidth * 0.08

  const hasImage = Boolean(imageUrl && imageTransform)
  const interactive = isInteractive(props)

  return (
    <>
      {/* Page background (style paper) + mat + caption + grid card. */}
      <Layer listening={false}>
        <Rect x={0} y={0} width={size.width} height={size.height} fill={style.background} />

        {/* Polaroid mat (fixed light chrome). */}
        <Rect
          x={layout.mat.x}
          y={layout.mat.y}
          width={layout.mat.width}
          height={layout.mat.height}
          fill={MAT_FILL}
          cornerRadius={size.width * 0.008}
          shadowColor={CHROME_SHADOW}
          shadowBlur={size.width * 0.03}
          shadowOffsetY={size.height * 0.012}
        />

        {/* Empty-state photo region inside the mat. */}
        {!hasImage && (
          <Rect
            x={layout.photo.x}
            y={layout.photo.y}
            width={layout.photo.width}
            height={layout.photo.height}
            fill="rgba(0,0,0,0.05)"
          />
        )}

        {/* Month caption on the mat (style ink + muted year). */}
        <Text
          x={layout.caption.x}
          y={layout.caption.y + layout.caption.height * 0.1}
          width={layout.caption.width}
          text={monthName}
          align="center"
          fontFamily={fontFamily}
          fontSize={layout.caption.monthFontSize}
          fontStyle="700"
          fill={ink}
        />
        <Text
          x={layout.caption.x}
          y={layout.caption.y + layout.caption.height * 0.1 + layout.caption.monthFontSize * 1.1}
          width={layout.caption.width}
          text={String(year)}
          align="center"
          fontFamily={fontFamily}
          fontSize={layout.caption.yearFontSize}
          fontStyle="700"
          fill={ink}
          opacity={0.5}
        />

        {/* Grid card (fixed light chrome). */}
        <Rect
          x={layout.grid.x}
          y={layout.grid.y}
          width={layout.grid.width}
          height={layout.grid.height}
          fill={MAT_FILL}
          cornerRadius={size.width * 0.012}
          shadowColor={CHROME_SHADOW}
          shadowBlur={size.width * 0.02}
          shadowOffsetY={size.height * 0.008}
        />

        {/* Compact grid: weekday headers + day numbers (style-driven). */}
        <Group x={layout.grid.x + layout.gridPad} y={layout.grid.y + layout.gridPad}>
          {headers.map((label, col) => {
            const weekdayIndex = (weekStart + col) % GRID_COLUMNS
            const headerColor =
              weekdayIndex === 6
                ? style.saturday
                : weekdayIndex === 0
                  ? style.sunday
                  : ink
            const hr = calendarHeaderRect(grid, col)
            return (
              <Text
                key={`h-${col}`}
                x={hr.x}
                y={hr.y}
                width={hr.width}
                height={hr.height}
                text={label}
                align="center"
                verticalAlign="middle"
                fontFamily={fontFamily}
                fontSize={grid.headerFontSize}
                fontStyle="700"
                fill={headerColor}
                opacity={weekdayIndex === 6 || weekdayIndex === 0 ? 0.9 : 0.6}
              />
            )
          })}

          {matrix.map((week, row) =>
            week.map((cell, col) => {
              if (cell === null) return null
              const rect = calendarCellRect(grid, row, col)
              const weekday = cell.date.getDay()
              const dayColor =
                weekday === 6
                  ? style.saturday
                  : weekday === 0
                    ? style.sunday
                    : ink
              return (
                <Text
                  key={`d-${row}-${col}`}
                  x={rect.x + cellPad}
                  y={rect.y}
                  width={rect.width - cellPad * 2}
                  height={rect.height}
                  text={String(cell.day)}
                  align="center"
                  verticalAlign="middle"
                  fontFamily={fontFamily}
                  fontSize={grid.dayFontSize}
                  fontStyle={cell.isWeekend ? '700' : '500'}
                  fill={dayColor}
                />
              )
            }),
          )}
        </Group>
      </Layer>

      {/* Photo (draggable) inside the mat. */}
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
