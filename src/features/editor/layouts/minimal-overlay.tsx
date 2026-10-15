/**
 * Minimal Overlay layout (mockup 06): a full-bleed photo, the month name
 * overlaid top-left, and a small translucent rounded card in the bottom-right
 * holding a COMPACT month grid. The card is a fixed translucent light panel and
 * the overlaid title is fixed light ink + shadow (both sit over the photo, so
 * neither can follow the style — same doctrine as the Full-bleed Ribbon band).
 * The card is a fixed light panel too, so its NEUTRAL grid text (weekday headers
 * + weekday day numbers) uses a fixed dark CARD_INK — not the style ink — so a
 * light-on-dark project stays legible; only weekend day numbers honor the style
 * (Saturday/Sunday colored).
 * Geometry comes from `computeMinimalOverlayLayout` + the shared compact grid.
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
import { computeMinimalOverlayLayout } from './minimalOverlayLayout'
import { isInteractive, type MonthLayoutProps } from './types'

/** Fixed translucent light panel for the card (chrome, over the photo). */
const CARD_FILL = 'rgba(255,255,255,0.86)'
/**
 * Fixed DARK ink for the neutral grid text ON the translucent white card
 * (weekday headers + weekday day numbers). The card is a fixed light panel, so
 * this text can't follow the style ink or a light-on-dark project (e.g. paper
 * #1a1a1a / text #ffffff) would render white-on-white = invisible. Mirrors the
 * Ribbon's fixed BAND_INK doctrine (fixed chrome → fixed ink). Only weekend day
 * numbers stay style-driven (Saturday/Sunday colors).
 */
const CARD_INK = '#1f2430'
/** Fixed light ink for the overlaid month title (sits over the photo). */
const OVERLAY_INK = '#ffffff'
/** Placeholder fill shown before an image is uploaded. */
const PLACEHOLDER_FILL = '#3a3f4b'

export function MinimalOverlayLayout(props: MonthLayoutProps) {
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
  const ink = CARD_INK

  const layout = computeMinimalOverlayLayout(size, matrix.length)
  const gridInner = {
    width: layout.card.width - layout.cardPad * 2,
    height: layout.card.height - layout.cardPad * 2,
  }
  const grid = computeCalendarGrid(gridInner, matrix.length, 0.12)

  const hasImage = Boolean(imageUrl && imageTransform)
  const interactive = isInteractive(props)

  return (
    <>
      {/* Page base + empty-state placeholder (behind the full-bleed photo). */}
      <Layer listening={false}>
        <Rect x={0} y={0} width={size.width} height={size.height} fill={style.background} />
        {!hasImage && (
          <Rect x={0} y={0} width={size.width} height={size.height} fill={PLACEHOLDER_FILL} />
        )}
      </Layer>

      {/* Full-bleed photo (draggable). */}
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

      {/* Title overlay + translucent card with the compact grid. */}
      <Layer listening={false}>
        <Text
          x={layout.title.x}
          y={layout.title.y}
          text={monthName}
          fontFamily={fontFamily}
          fontSize={layout.title.monthFontSize}
          fontStyle="700"
          fill={OVERLAY_INK}
          shadowColor="#000000"
          shadowBlur={layout.title.monthFontSize * 0.3}
          shadowOffsetY={layout.title.monthFontSize * 0.06}
          shadowOpacity={0.35}
        />
        <Text
          x={layout.title.x}
          y={layout.title.y + layout.title.monthFontSize + layout.title.yearGap}
          text={String(year)}
          fontFamily={fontFamily}
          fontSize={layout.title.yearFontSize}
          fontStyle="700"
          fill={OVERLAY_INK}
          opacity={0.85}
          shadowColor="#000000"
          shadowBlur={layout.title.yearFontSize * 0.4}
          shadowOpacity={0.3}
        />

        {/* Translucent card (fixed light chrome). */}
        <Rect
          x={layout.card.x}
          y={layout.card.y}
          width={layout.card.width}
          height={layout.card.height}
          fill={CARD_FILL}
          cornerRadius={layout.cardRadius}
          shadowColor="#000000"
          shadowBlur={size.width * 0.04}
          shadowOffsetY={size.height * 0.01}
          shadowOpacity={0.25}
        />

        {/* Compact grid inside the card (style-driven text). */}
        <Group x={layout.card.x + layout.cardPad} y={layout.card.y + layout.cardPad}>
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
                text={label.charAt(0)}
                align="center"
                verticalAlign="middle"
                fontFamily={fontFamily}
                fontSize={grid.headerFontSize}
                fontStyle="700"
                fill={headerColor}
                opacity={weekdayIndex === 6 || weekdayIndex === 0 ? 0.9 : 0.55}
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
                  x={rect.x}
                  y={rect.y}
                  width={rect.width}
                  height={rect.height}
                  text={String(cell.day)}
                  align="center"
                  verticalAlign="middle"
                  fontFamily={fontFamily}
                  fontSize={grid.dayFontSize}
                  fontStyle="700"
                  fill={dayColor}
                />
              )
            }),
          )}
        </Group>
      </Layer>
    </>
  )
}
