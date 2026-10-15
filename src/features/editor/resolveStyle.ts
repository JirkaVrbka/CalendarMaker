/**
 * Pure resolver turning a (possibly partial / absent) whole-calendar
 * `CalendarStyle` into the concrete values the Konva canvases paint with. Kept
 * side-effect-free and theme-agnostic so the real color/font logic is unit
 * testable without mounting a canvas.
 *
 * Each field falls back to the supplied `fallback` style only when its value is
 * missing or blank. In practice the store always carries a fully-populated style
 * (DEFAULT_STYLE at minimum), so every field is normally explicit and the
 * theme-derived `fallback` is just a safety net for a partial/absent style.
 * Because the values are thus explicit (light-by-default colors), they paint the
 * same on screen and in the forced-light PDF export rather than following the
 * MUI theme / dark mode.
 */
import type { CalendarStyle } from '../../types/calendar'

/** The concrete, fully-resolved values a page canvas renders with. */
export interface ResolvedStyle {
  /** CSS family for every `<Text>` node. */
  readonly fontFamily: string
  /** Paper / page background fill. */
  readonly background: string
  /** Standard text color (title, month name, weekday headers, day numbers). */
  readonly text: string
  /** Saturday color (column highlight tint + Saturday day numbers). */
  readonly saturday: string
  /** Sunday color (column highlight tint + Sunday day numbers). */
  readonly sunday: string
  /** Multiplier for the calendar's text sizes (1 = baseline). */
  readonly fontScale: number
}

/**
 * A color counts as SET only when it is a non-blank string. A missing
 * (`undefined`) OR blank (`''` / whitespace) value falls back, so a cleared
 * color input can never paint an empty/black fill; any real value wins verbatim.
 */
function resolveColor(value: string | undefined, fallback: string): string {
  return value !== undefined && value.trim() !== '' ? value : fallback
}

/**
 * A font scale counts as SET only when it is a finite, positive number. A
 * missing (`undefined`) or invalid (NaN / ≤ 0) value falls back, so a partial
 * or absent style can never collapse the calendar's text to size 0.
 */
function resolveScale(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : fallback
}

/**
 * Resolve a style against a fallback, field by field. A missing (`undefined`)
 * field — or an entirely absent `style` — takes the fallback value; a blank
 * color string also falls back; any present, non-blank value is used verbatim.
 */
export function resolveStyle(
  style: Partial<CalendarStyle> | undefined,
  fallback: CalendarStyle,
): ResolvedStyle {
  return {
    fontFamily: style?.fontFamily ?? fallback.fontFamily,
    background: resolveColor(style?.backgroundColor, fallback.backgroundColor),
    text: resolveColor(style?.textColor, fallback.textColor),
    saturday: resolveColor(style?.saturdayColor, fallback.saturdayColor),
    sunday: resolveColor(style?.sundayColor, fallback.sundayColor),
    fontScale: resolveScale(style?.fontScale, fallback.fontScale),
  }
}
