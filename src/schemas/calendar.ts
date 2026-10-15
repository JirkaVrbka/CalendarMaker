/**
 * Zod schemas mirroring the `src/types/calendar.ts` model. These validate any
 * data that enters the app from outside (later: loaded projects, imports). For
 * this slice they also serve as the single source of truth for the default
 * project values.
 */
import { z } from 'zod'

import {
  DEFAULT_LAYOUT,
  DEFAULT_STYLE,
  DEFAULT_SUBTITLE_POSITION,
  DEFAULT_TITLE_POSITION,
} from '../types/calendar'
import type {
  CalendarProject,
  CalendarStyle,
  CoverPage,
  ImageTransform,
  Language,
  LayoutId,
  MonthPage,
  Page,
  PageSize,
  TextPosition,
  WeekStart,
} from '../types/calendar'

export const languageSchema = z.enum(['en', 'cs'])

export const weekStartSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
]) satisfies z.ZodType<WeekStart>

export const pageOrientationSchema = z.enum(['portrait', 'landscape'])

export const pageSizeSchema = z.object({
  widthMm: z.number().positive(),
  heightMm: z.number().positive(),
  orientation: pageOrientationSchema,
}) satisfies z.ZodType<PageSize>

export const coverPageSchema = z.object({
  kind: z.literal('cover'),
}) satisfies z.ZodType<CoverPage>

export const monthPageSchema = z.object({
  kind: z.literal('month'),
  year: z.number().int(),
  month: z.number().int().min(0).max(11),
}) satisfies z.ZodType<MonthPage>

export const pageSchema = z.discriminatedUnion('kind', [
  coverPageSchema,
  monthPageSchema,
]) satisfies z.ZodType<Page>

/**
 * The whole-calendar style. Each field defaults to its `DEFAULT_STYLE` value,
 * and the whole object defaults too — so a stored config from an earlier slice
 * (which has NO `style` key at all) validates and hydrates with the default
 * style instead of being rejected. This is the project's backward-compatibility
 * guarantee: adding `style` never invalidates an existing saved calendar.
 */
const calendarStyleObjectSchema = z
  .object({
    fontFamily: z.string().default(DEFAULT_STYLE.fontFamily),
    textColor: z.string().default(DEFAULT_STYLE.textColor),
    saturdayColor: z.string().default(DEFAULT_STYLE.saturdayColor),
    sundayColor: z.string().default(DEFAULT_STYLE.sundayColor),
    backgroundColor: z.string().default(DEFAULT_STYLE.backgroundColor),
    // Text-size multiplier (bounded). `.default` supplies 1 for a config saved
    // before this field existed (migration-safe); `.catch` coerces an
    // out-of-range / non-numeric stored value to the default rather than
    // rejecting the whole record (the never-wipe-a-calendar data-safety bar).
    fontScale: z
      .number()
      .min(0.6)
      .max(2)
      .default(DEFAULT_STYLE.fontScale)
      .catch(DEFAULT_STYLE.fontScale),
  })
  .default(DEFAULT_STYLE)

/**
 * Normalize a stored `style` before the object schema validates it, preserving
 * two backward-compatibility guarantees:
 *
 * 1. **`null` → default.** Zod `.default()` only fires on `undefined`, never on
 *    `null`. A stored `style: null` would otherwise be REJECTED → the whole
 *    calendar is lost. Coercing `null`/`undefined` to `undefined` lets the
 *    default populate `DEFAULT_STYLE` exactly as a missing `style` key does.
 * 2. **Legacy `weekendColor` → both days (slice 0007 migration).** Calendars
 *    saved before Saturday/Sunday were split carry a single `weekendColor` and
 *    no `saturdayColor`/`sundayColor`. Map that one color onto BOTH days so the
 *    saved look is preserved, then drop the legacy key. A record is NEVER
 *    rejected for the old shape (no whole-calendar wipe). If either per-day
 *    color is already present, the record is left untouched (not migrated).
 */
function migrateLegacyStyle(value: unknown): unknown {
  if (value == null) return undefined
  if (typeof value !== 'object') return value
  const style = value as Record<string, unknown>
  if (
    'weekendColor' in style &&
    style.saturdayColor === undefined &&
    style.sundayColor === undefined
  ) {
    const { weekendColor, ...rest } = style
    return { ...rest, saturdayColor: weekendColor, sundayColor: weekendColor }
  }
  return value
}

export const calendarStyleSchema = z.preprocess(
  migrateLegacyStyle,
  calendarStyleObjectSchema,
) as z.ZodType<CalendarStyle>

/**
 * The whole-calendar layout id. Two backward-compatibility guarantees, matching
 * the style migration's data-safety bar (a record is NEVER rejected over this
 * field — that would wipe the whole calendar):
 *
 * 1. **Missing → default.** A config saved before this feature has no `layout`
 *    key; `.default` hydrates it to `'classic-top'`, preserving the look old
 *    calendars had.
 * 2. **Unknown → default.** A stored value outside the union (e.g. a layout
 *    removed later, or corruption) is coerced to `'classic-top'` by `.catch`
 *    rather than rejecting the record.
 */
export const layoutSchema = z
  .enum([
    'classic-top',
    'fullbleed-ribbon',
    'bottom-photo',
    'framed',
    'minimal-overlay',
    'agenda',
    'vertical-ribbon',
  ])
  .default(DEFAULT_LAYOUT)
  .catch(DEFAULT_LAYOUT) satisfies z.ZodType<LayoutId>

/**
 * A cover text block's position (center anchor, page fraction). Built per text
 * because the title and subtitle have different defaults. Matches the project's
 * data-safety bar (a record is NEVER rejected over these fields — that would
 * wipe the whole calendar):
 *
 * 1. **Missing → default.** A config saved before this feature has no position;
 *    each field `.default`s and the whole object `.default`s to `fallback`.
 * 2. **`null`/bad → default.** `.default()` only fires on `undefined`, so a
 *    stored `null` is first coerced to `undefined` (preprocess); any non-number
 *    field is coerced by its `.catch`, and a non-object value by the object
 *    `.catch`.
 */
function textPositionSchema(fallback: TextPosition): z.ZodType<TextPosition> {
  const object = z
    .object({
      x: z.number().default(fallback.x).catch(fallback.x),
      y: z.number().default(fallback.y).catch(fallback.y),
    })
    .default(fallback)
    .catch(fallback)
  return z.preprocess(
    (value) => (value == null ? undefined : value),
    object,
  ) as z.ZodType<TextPosition>
}

export const titlePositionSchema = textPositionSchema(DEFAULT_TITLE_POSITION)
export const subtitlePositionSchema = textPositionSchema(
  DEFAULT_SUBTITLE_POSITION,
)

export const calendarProjectSchema = z.object({
  title: z.string(),
  // Missing/`null`/non-string subtitle → '' (hidden), never rejected.
  subtitle: z.preprocess(
    (value) => (value == null ? undefined : value),
    z.string().default('').catch(''),
  ),
  titlePosition: titlePositionSchema,
  subtitlePosition: subtitlePositionSchema,
  startMonth: z.number().int().min(0).max(11),
  startYear: z.number().int(),
  language: languageSchema,
  weekStart: weekStartSchema,
  pageSize: pageSizeSchema,
  style: calendarStyleSchema,
  layout: layoutSchema,
  pages: z.array(pageSchema),
}) satisfies z.ZodType<CalendarProject>

/**
 * The shape we actually PERSIST: identical to a project but without `pages`.
 * Pages are derived (authoritative only via `startMonth`/`startYear`) and are
 * rebuilt on load, so storing them is redundant. Any `pages` key present in a
 * stored row is ignored (stripped), which also means an externally-corrupted
 * `pages` array can't reject an otherwise-valid config.
 */
export const storedCalendarProjectSchema = calendarProjectSchema.omit({
  pages: true,
})

/** A persisted project config (no `pages` — those are rebuilt on load). */
export type StoredCalendarProject = z.infer<typeof storedCalendarProjectSchema>

/**
 * A photo's placement transform. Numbers are stored verbatim; kept lenient
 * (no range bounds) so slightly out-of-range persisted values still load
 * rather than getting rejected — rendering re-clamps as needed.
 */
export const imageTransformSchema = z.object({
  offsetX: z.number(),
  offsetY: z.number(),
  scale: z.number(),
}) satisfies z.ZodType<ImageTransform>

/** Narrow a string to a supported `Language`, falling back to English. */
export function parseLanguage(value: string): Language {
  const result = languageSchema.safeParse(value)
  return result.success ? result.data : 'en'
}
