import { describe, expect, it } from 'vitest'

import {
  calendarProjectSchema,
  calendarStyleSchema,
  layoutSchema,
  subtitlePositionSchema,
  titlePositionSchema,
} from './calendar'
import {
  DEFAULT_LAYOUT,
  DEFAULT_STYLE,
  DEFAULT_SUBTITLE_POSITION,
  DEFAULT_TITLE_POSITION,
} from '../types/calendar'

/**
 * The style schema is the project's data-safety boundary for slice 0007: it
 * must migrate calendars saved with the legacy single `weekendColor` onto the
 * new per-day `saturdayColor`/`sundayColor` WITHOUT ever rejecting a record
 * (which would wipe the whole calendar). These tests pin every branch.
 */
describe('calendarStyleSchema migration', () => {
  it('migrates a legacy weekendColor onto BOTH Saturday and Sunday', () => {
    const parsed = calendarStyleSchema.parse({
      fontFamily: 'Inter',
      textColor: '#111111',
      weekendColor: '#abcdef',
      backgroundColor: '#ffffff',
    })
    expect(parsed).toEqual({
      fontFamily: 'Inter',
      textColor: '#111111',
      saturdayColor: '#abcdef',
      sundayColor: '#abcdef',
      backgroundColor: '#ffffff',
      fontScale: DEFAULT_STYLE.fontScale,
    })
    // The legacy key is dropped, not carried through.
    expect('weekendColor' in (parsed as unknown as Record<string, unknown>)).toBe(false)
  })

  it('falls back to DEFAULT_STYLE when no style is stored (undefined)', () => {
    expect(calendarStyleSchema.parse(undefined)).toEqual(DEFAULT_STYLE)
  })

  it('falls back to DEFAULT_STYLE for an explicit null style (not rejected)', () => {
    expect(calendarStyleSchema.parse(null)).toEqual(DEFAULT_STYLE)
  })

  it('fills missing fields with defaults for an empty style object', () => {
    expect(calendarStyleSchema.parse({})).toEqual(DEFAULT_STYLE)
  })

  it('keeps explicit Saturday/Sunday colors untouched (no migration)', () => {
    const style = {
      fontFamily: 'Nunito',
      textColor: '#1f2933',
      saturdayColor: '#111111',
      sundayColor: '#222222',
      backgroundColor: '#ffffff',
      fontScale: 1.25,
    }
    expect(calendarStyleSchema.parse(style)).toEqual(style)
  })

  it('does NOT migrate when a per-day color already exists alongside legacy weekendColor', () => {
    // Mixed shape: an explicit saturdayColor is present → keep it, default the
    // missing sundayColor, and drop the stray legacy key rather than overwrite.
    const parsed = calendarStyleSchema.parse({
      saturdayColor: '#0000ff',
      weekendColor: '#abcdef',
    })
    expect(parsed.saturdayColor).toBe('#0000ff')
    expect(parsed.sundayColor).toBe(DEFAULT_STYLE.sundayColor)
    expect('weekendColor' in (parsed as unknown as Record<string, unknown>)).toBe(false)
  })

  it('fills only the missing per-day color, keeping the provided ones', () => {
    const parsed = calendarStyleSchema.parse({ saturdayColor: '#123456' })
    expect(parsed).toEqual({ ...DEFAULT_STYLE, saturdayColor: '#123456' })
  })

  it('defaults fontScale to 1 when the field is absent (migration-safe)', () => {
    // A style saved before the font-size feature carries no `fontScale`; the
    // default must supply 1 so the saved calendar renders at its baseline size.
    const parsed = calendarStyleSchema.parse({
      fontFamily: 'Nunito',
      textColor: '#1f2933',
      saturdayColor: '#4c6ef5',
      sundayColor: '#e03131',
      backgroundColor: '#ffffff',
    })
    expect(parsed.fontScale).toBe(1)
  })

  it('keeps a provided in-range fontScale verbatim', () => {
    expect(calendarStyleSchema.parse({ fontScale: 1.5 }).fontScale).toBe(1.5)
    expect(calendarStyleSchema.parse({ fontScale: 0.6 }).fontScale).toBe(0.6)
    expect(calendarStyleSchema.parse({ fontScale: 2 }).fontScale).toBe(2)
  })

  it('coerces an out-of-range / non-numeric fontScale to the default (never rejected)', () => {
    // Out-of-range or garbage values must not reject the record (whole-calendar
    // wipe); they fall back to the default scale instead.
    expect(calendarStyleSchema.parse({ fontScale: 5 }).fontScale).toBe(
      DEFAULT_STYLE.fontScale,
    )
    expect(calendarStyleSchema.parse({ fontScale: 0 }).fontScale).toBe(
      DEFAULT_STYLE.fontScale,
    )
    expect(calendarStyleSchema.parse({ fontScale: 'big' }).fontScale).toBe(
      DEFAULT_STYLE.fontScale,
    )
  })
})

/**
 * The layout id is the slice 0008 data-safety boundary: a config saved before
 * the feature has no `layout` key (→ default), and a stored value outside the
 * union must be coerced rather than rejecting (and wiping) the calendar.
 */
describe('layoutSchema migration', () => {
  it('defaults to classic-top when no layout is stored (undefined)', () => {
    expect(layoutSchema.parse(undefined)).toBe(DEFAULT_LAYOUT)
    expect(DEFAULT_LAYOUT).toBe('classic-top')
  })

  it('coerces an unknown/invalid layout to classic-top (never rejected)', () => {
    expect(layoutSchema.parse('not-a-real-layout')).toBe('classic-top')
    expect(layoutSchema.parse(null)).toBe('classic-top')
    expect(layoutSchema.parse(42)).toBe('classic-top')
  })

  it('keeps a valid registered layout untouched', () => {
    expect(layoutSchema.parse('fullbleed-ribbon')).toBe('fullbleed-ribbon')
  })

  it('keeps a valid but not-yet-registered Wave 2 layout untouched', () => {
    // The union lists all seven ids; the schema accepts them even before the
    // layout module exists (the registry falls back to classic-top to render).
    expect(layoutSchema.parse('agenda')).toBe('agenda')
  })
})

/**
 * The cover subtitle + title/subtitle positions are the slice 0009 data-safety
 * boundary: a config saved before the feature has none of them, and any
 * bad/null value must coerce to the defaults rather than rejecting (wiping) the
 * calendar.
 */
describe('cover text position schemas', () => {
  it('default to their anchor when the value is missing (undefined)', () => {
    expect(titlePositionSchema.parse(undefined)).toEqual(DEFAULT_TITLE_POSITION)
    expect(subtitlePositionSchema.parse(undefined)).toEqual(
      DEFAULT_SUBTITLE_POSITION,
    )
  })

  it('coerce null / non-object / NaN to the default (never rejected)', () => {
    expect(titlePositionSchema.parse(null)).toEqual(DEFAULT_TITLE_POSITION)
    expect(titlePositionSchema.parse('nope')).toEqual(DEFAULT_TITLE_POSITION)
    expect(titlePositionSchema.parse(42)).toEqual(DEFAULT_TITLE_POSITION)
  })

  it('fill a missing or non-numeric axis with the default, keeping the valid one', () => {
    expect(titlePositionSchema.parse({ x: 0.9 })).toEqual({
      x: 0.9,
      y: DEFAULT_TITLE_POSITION.y,
    })
    expect(titlePositionSchema.parse({ x: 'bad', y: 0.7 })).toEqual({
      x: DEFAULT_TITLE_POSITION.x,
      y: 0.7,
    })
  })

  it('keep a fully valid position untouched', () => {
    expect(titlePositionSchema.parse({ x: 0.25, y: 0.8 })).toEqual({
      x: 0.25,
      y: 0.8,
    })
  })
})

describe('calendarProjectSchema — slice 0009 backward compatibility', () => {
  /** A pre-feature config: no subtitle / titlePosition / subtitlePosition. */
  function legacyConfig(): Record<string, unknown> {
    return {
      title: 'Legacy',
      startMonth: 0,
      startYear: 2026,
      language: 'en',
      weekStart: 1,
      pageSize: { widthMm: 210, heightMm: 297, orientation: 'portrait' },
      style: DEFAULT_STYLE,
      layout: 'classic-top',
      pages: [],
    }
  }

  it('hydrates a legacy config with an empty subtitle and default positions (not rejected)', () => {
    const parsed = calendarProjectSchema.parse(legacyConfig())
    expect(parsed.subtitle).toBe('')
    expect(parsed.titlePosition).toEqual(DEFAULT_TITLE_POSITION)
    expect(parsed.subtitlePosition).toEqual(DEFAULT_SUBTITLE_POSITION)
  })

  it('coerces null subtitle and bad positions to defaults rather than rejecting', () => {
    const parsed = calendarProjectSchema.parse({
      ...legacyConfig(),
      subtitle: null,
      titlePosition: null,
      subtitlePosition: { x: 'bad', y: 0.9 },
    })
    expect(parsed.subtitle).toBe('')
    expect(parsed.titlePosition).toEqual(DEFAULT_TITLE_POSITION)
    expect(parsed.subtitlePosition).toEqual({
      x: DEFAULT_SUBTITLE_POSITION.x,
      y: 0.9,
    })
  })

  it('keeps provided subtitle + positions intact', () => {
    const parsed = calendarProjectSchema.parse({
      ...legacyConfig(),
      subtitle: 'Hello',
      titlePosition: { x: 0.1, y: 0.2 },
      subtitlePosition: { x: 0.3, y: 0.4 },
    })
    expect(parsed.subtitle).toBe('Hello')
    expect(parsed.titlePosition).toEqual({ x: 0.1, y: 0.2 })
    expect(parsed.subtitlePosition).toEqual({ x: 0.3, y: 0.4 })
  })
})
