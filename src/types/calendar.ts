/**
 * Core data model for CalendarMaker.
 *
 * Holds the `Page` discriminated union (`CoverPage | MonthPage`, keyed on
 * `kind`) and the full `CalendarProject` model — the cover plus 12 month pages,
 * title, start month/year, language, week start and page size. Image/color/font
 * customization and saving arrive in later slices.
 *
 * Month values are **0-indexed** (0 = January, 11 = December) to match the
 * native `Date`/`Intl` convention used throughout `src/lib/calendar.ts`.
 */

/** Supported UI + localization languages for this slice. */
export type Language = 'en' | 'cs'

/**
 * Weekday a calendar week begins on, as a native `Date.getDay()` index
 * (0 = Sunday, 1 = Monday … 6 = Saturday). This slice ships Monday-first;
 * the numeric form keeps per-language week starts open for later.
 */
export type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6

/** Monday-first week start (the confirmed default for this slice). */
export const MONDAY: WeekStart = 1

/**
 * Identifier of a whole-calendar month-page LAYOUT template. One layout is
 * chosen for the project and applied to ALL 12 month pages (the cover is
 * unaffected). The union lists all seven planned templates so the model and
 * schema are stable across both build waves; only the layouts actually
 * registered in `features/editor/layouts` appear in the picker and can render.
 */
export type LayoutId =
  | 'classic-top'
  | 'fullbleed-ribbon'
  | 'bottom-photo'
  | 'framed'
  | 'minimal-overlay'
  | 'agenda'
  | 'vertical-ribbon'

/** The default month-page layout — the app's original top-photo arrangement. */
export const DEFAULT_LAYOUT: LayoutId = 'classic-top'

/** Page orientation. A4 portrait is the only one used in this slice. */
export type PageOrientation = 'portrait' | 'landscape'

/**
 * Physical page size in millimetres plus orientation. Stored in the model so
 * the aspect ratio is locked and the size can change in a later slice.
 */
export interface PageSize {
  readonly widthMm: number
  readonly heightMm: number
  readonly orientation: PageOrientation
}

/**
 * The cover page: the first page of the calendar. It carries no month data; it
 * renders the project `title` and (in a later slice) a user image. The frame is
 * a placeholder for now.
 */
export interface CoverPage {
  readonly kind: 'cover'
}

/** A single month page of the calendar. */
export interface MonthPage {
  readonly kind: 'month'
  /** Full year, e.g. 2026. */
  readonly year: number
  /** Month, 0-indexed (0 = January). */
  readonly month: number
}

/**
 * A page of the calendar: either the cover or one month. A discriminated union
 * on `kind` so rendering code can switch exhaustively.
 */
export type Page = CoverPage | MonthPage

/**
 * Whole-calendar visual style: one serializable `style` applied to ALL 13 pages
 * (global, not per-page). Every field is a plain string so the whole project
 * config stays JSON-serializable and rides the existing autosave untouched.
 * Colors are `#rrggbb` hex (what a native `<input type="color">` produces);
 * `fontFamily` is a CSS family name from the curated set (see `app/fonts`).
 */
export interface CalendarStyle {
  /** CSS font family for all calendar text (title, months, headers, days). */
  readonly fontFamily: string
  /** Color of the standard text (title, month name, weekday headers, days). */
  readonly textColor: string
  /** Color of the Saturday highlight (column tint + Saturday day numbers). */
  readonly saturdayColor: string
  /** Color of the Sunday highlight (column tint + Sunday day numbers). */
  readonly sundayColor: string
  /** Page/paper background fill. */
  readonly backgroundColor: string
}

/**
 * The default style — matches the app's established look: Nunito, a dark ink,
 * the brand blue for Saturdays, a warm red for Sundays, and white paper. New
 * projects start here and old records with no stored `style` hydrate to it
 * (schema defaults / resolver fallback), so loading a pre-style calendar is
 * never a breaking change.
 */
export const DEFAULT_STYLE: CalendarStyle = {
  fontFamily: 'Nunito',
  textColor: '#1f2933',
  saturdayColor: '#4c6ef5',
  sundayColor: '#e03131',
  backgroundColor: '#ffffff',
}

/**
 * A text block's position on the cover, as the block's CENTER anchor expressed
 * as a FRACTION of the page (0..1 on each axis). Being a fraction makes it
 * resolution-independent — the same position places the text identically in the
 * small editor, the thumbnail, and the large A4@300DPI export (the same reason
 * `ImageTransform` stores its pan as a fraction). The cover's title and subtitle
 * each carry one; rendering converts it to pixels and clamps to the page via
 * `features/editor/coverTextLayout`.
 */
export interface TextPosition {
  readonly x: number
  readonly y: number
}

/** Default cover title position: top-center. */
export const DEFAULT_TITLE_POSITION: TextPosition = { x: 0.5, y: 0.14 }

/** Default cover subtitle position: centered, just below the title. */
export const DEFAULT_SUBTITLE_POSITION: TextPosition = { x: 0.5, y: 0.22 }

/**
 * The calendar project — the single source of truth for a calendar. The 12
 * month pages run consecutively from (`startMonth`, `startYear`) and may cross
 * a year boundary; `pages` is always the cover followed by those 12 months
 * (13 total), kept in sync with the start by `buildProjectPages`.
 */
export interface CalendarProject {
  /** Title shown on the cover page. */
  readonly title: string
  /** Subtitle shown on the cover page; empty string hides it. */
  readonly subtitle: string
  /** Cover title position (center anchor, page fraction). */
  readonly titlePosition: TextPosition
  /** Cover subtitle position (center anchor, page fraction). */
  readonly subtitlePosition: TextPosition
  /** First month of the 12, 0-indexed (0 = January). */
  readonly startMonth: number
  /** Calendar year the first month falls in, e.g. 2026. */
  readonly startYear: number
  readonly language: Language
  readonly weekStart: WeekStart
  readonly pageSize: PageSize
  /** Whole-calendar visual style (font + colors), applied to all 13 pages. */
  readonly style: CalendarStyle
  /** Whole-calendar month-page layout template, applied to all 12 months. */
  readonly layout: LayoutId
  /** Cover at index 0, then the 12 consecutive month pages. */
  readonly pages: readonly Page[]
}

/**
 * A photo's placement inside its frame, as plain serializable numbers. It is a
 * user adjustment layered on top of the cover-fit baseline:
 * - `scale` is a zoom multiplier ≥ 1 on top of cover-fit (1 = exactly cover-fit).
 * - `offsetX` / `offsetY` pan the image from the centered (cover-fit) position,
 *   expressed as a FRACTION of the frame's width / height (not pixels). So
 *   `0` = centered, `0.1` = panned by 10% of the frame. Being a fraction makes
 *   the pan resolution-independent: the same transform places the photo
 *   identically in the small editor frame, a thumbnail, and the large export
 *   frame (A4@300DPI). `composeImageTransform` converts it to pixels against the
 *   current frame when rendering.
 */
export interface ImageTransform {
  readonly offsetX: number
  readonly offsetY: number
  readonly scale: number
}

/** The default transform: cover-fit, centered, no extra zoom. */
export const DEFAULT_IMAGE_TRANSFORM: ImageTransform = {
  offsetX: 0,
  offsetY: 0,
  scale: 1,
}

/**
 * A user-uploaded photo held in memory (not persisted this slice): the raw
 * `blob`, a derived object-`url` for rendering, and its `transform`. Kept out
 * of the serializable `CalendarProject` and keyed by page slot in the store.
 */
export interface ImageEntry {
  readonly blob: Blob
  readonly url: string
  readonly transform: ImageTransform
}

/** One cell in the month grid. `null` represents a leading/trailing blank. */
export interface DayCell {
  /** Day of month, 1-based. */
  readonly day: number
  /** The concrete date this cell represents. */
  readonly date: Date
  /** True for Saturday and Sunday. */
  readonly isWeekend: boolean
}

/** A month grid: rows of weeks, each a fixed 7 columns of cells or blanks. */
export type MonthMatrix = ReadonlyArray<ReadonlyArray<DayCell | null>>
