import { describe, expect, it } from 'vitest'

import { A4_PORTRAIT } from '../../lib/page'
import { buildProjectPages } from '../../lib/projectPages'
import { DEFAULT_IMAGE_TRANSFORM, DEFAULT_STYLE, MONDAY } from '../../types/calendar'
import type { CalendarProject } from '../../types/calendar'
import {
  IMAGE_PAN_UNIT,
  STORAGE_VERSION,
  fromImageRecords,
  fromProjectRecord,
  toImageRecord,
  toProjectRecord,
} from './mapping'

/** A valid baseline project (July 2026 start) for round-trip tests. */
function sampleProject(): CalendarProject {
  return {
    title: 'Family 2026',
    subtitle: 'Our year',
    titlePosition: { x: 0.4, y: 0.1 },
    subtitlePosition: { x: 0.6, y: 0.3 },
    startMonth: 6,
    startYear: 2026,
    language: 'cs',
    weekStart: MONDAY,
    pageSize: A4_PORTRAIT,
    style: DEFAULT_STYLE,
    layout: 'classic-top',
    pages: buildProjectPages(6, 2026),
  }
}

const blob = () => new Blob(['x'], { type: 'image/png' })

describe('project record mapping', () => {
  it('round-trips a config through to/from record (pages rebuilt, not stored)', () => {
    const config = sampleProject()
    const record = toProjectRecord(config)
    expect(record.id).toBe('current')
    expect(record.version).toBe(STORAGE_VERSION)
    // `pages` are derived and must NOT be persisted (rebuilt on load).
    expect('pages' in record.config).toBe(false)
    const { pages: _pages, ...withoutPages } = config
    expect(fromProjectRecord(record)).toEqual(withoutPages)
  })

  it('accepts a stored row without a `pages` key', () => {
    const { pages: _pages, ...withoutPages } = sampleProject()
    const record = { id: 'current', version: STORAGE_VERSION, config: withoutPages }
    expect(fromProjectRecord(record)).toEqual(withoutPages)
  })

  it('loads a stored record with NO `style` key using the default style (backward compatible)', () => {
    // Simulates a calendar saved by an earlier slice, before `style` existed.
    const { pages: _pages, style: _style, ...withoutStyle } = sampleProject()
    const record = { id: 'current', version: STORAGE_VERSION, config: withoutStyle }
    const loaded = fromProjectRecord(record)
    expect(loaded).not.toBeNull()
    expect(loaded?.style).toEqual(DEFAULT_STYLE)
  })

  it('hydrates a stored style WITHOUT fontScale to the default scale (backward compatible)', () => {
    // A calendar saved before the font-size feature: its style carries every
    // color/font but no `fontScale`. The schema default must supply 1 rather
    // than rejecting the record.
    const { pages: _pages, style: _style, ...rest } = sampleProject()
    const { fontScale: _fontScale, ...styleWithoutScale } = DEFAULT_STYLE
    const config = { ...rest, style: styleWithoutScale }
    const record = { id: 'current', version: STORAGE_VERSION, config }
    const loaded = fromProjectRecord(record)
    expect(loaded).not.toBeNull()
    expect(loaded?.style.fontScale).toBe(1)
  })

  it('loads a stored record with style:null using the default style (not rejected)', () => {
    // Zod `.default()` only fires on `undefined`; a stored `style: null` must be
    // coerced to the default rather than rejecting the whole record (which would
    // lose the entire calendar).
    const { pages: _pages, style: _style, ...rest } = sampleProject()
    const config = { ...rest, style: null }
    const record = { id: 'current', version: STORAGE_VERSION, config }
    const loaded = fromProjectRecord(record)
    expect(loaded).not.toBeNull()
    expect(loaded?.style).toEqual(DEFAULT_STYLE)
  })

  it('migrates a legacy weekendColor record onto both days (not rejected)', () => {
    // A calendar saved before Saturday/Sunday were split: one `weekendColor`.
    // It must load (never be rejected → whole-calendar wipe) with that color on
    // BOTH days, preserving its saved look.
    const { pages: _pages, style: _style, ...rest } = sampleProject()
    const config = {
      ...rest,
      style: {
        fontFamily: 'Nunito',
        textColor: '#1f2933',
        weekendColor: '#654321',
        backgroundColor: '#ffffff',
      },
    }
    const record = { id: 'current', version: STORAGE_VERSION, config }
    const loaded = fromProjectRecord(record)
    expect(loaded).not.toBeNull()
    const style = loaded!.style as unknown as Record<string, unknown>
    expect(style.saturdayColor).toBe('#654321')
    expect(style.sundayColor).toBe('#654321')
    expect('weekendColor' in style).toBe(false)
  })

  it('fills any missing style fields with defaults, keeping the provided ones', () => {
    const { pages: _pages, style: _style, ...rest } = sampleProject()
    const config = { ...rest, style: { textColor: '#abcdef' } }
    const record = { id: 'current', version: STORAGE_VERSION, config }
    const loaded = fromProjectRecord(record)
    expect(loaded?.style).toEqual({ ...DEFAULT_STYLE, textColor: '#abcdef' })
  })

  it('ignores a corrupted `pages` array and still loads a valid config', () => {
    const config = { ...sampleProject(), pages: 'not-an-array' }
    const record = { id: 'current', version: STORAGE_VERSION, config }
    const { pages: _pages, ...withoutPages } = sampleProject()
    expect(fromProjectRecord(record)).toEqual(withoutPages)
  })

  it('returns null for a missing row (undefined)', () => {
    expect(fromProjectRecord(undefined)).toBeNull()
  })

  it('returns null for a malformed config (bad month)', () => {
    const bad = {
      id: 'current',
      version: STORAGE_VERSION,
      config: { ...sampleProject(), startMonth: 99 },
    }
    expect(fromProjectRecord(bad)).toBeNull()
  })

  it('returns null for a structurally wrong record', () => {
    expect(fromProjectRecord({ id: 'current', version: STORAGE_VERSION })).toBeNull()
    expect(fromProjectRecord({ nonsense: true })).toBeNull()
  })

  it('returns null for a stale version (falls back to default)', () => {
    const stale = { ...toProjectRecord(sampleProject()), version: STORAGE_VERSION + 1 }
    expect(fromProjectRecord(stale)).toBeNull()
  })
})

describe('image record mapping', () => {
  it('maps a slot photo into a record, stamping the current pan-model marker', () => {
    const b = blob()
    const record = toImageRecord(2, b, DEFAULT_IMAGE_TRANSFORM)
    expect(record).toEqual({
      slot: 2,
      blob: b,
      transform: DEFAULT_IMAGE_TRANSFORM,
      panUnit: IMAGE_PAN_UNIT,
    })
  })

  it('round-trips valid (marked) records back to persisted images', () => {
    // `toImageRecord` stamps the current pan model, so a fractional pan is kept.
    const records = [
      toImageRecord(0, blob(), DEFAULT_IMAGE_TRANSFORM),
      toImageRecord(5, blob(), { offsetX: -0.4, offsetY: 0.3, scale: 1.5 }),
    ]
    const out = fromImageRecords(records)
    expect(out).toHaveLength(2)
    expect(out[0].slot).toBe(0)
    expect(out[1].transform).toEqual({ offsetX: -0.4, offsetY: 0.3, scale: 1.5 })
    expect(out[1].blob).toBeInstanceOf(Blob)
  })

  it('resets a legacy record pan to 0 once on load, keeping its zoom (pan migration)', () => {
    // A record saved BEFORE the fractional pan model: no `panUnit` marker, and
    // its offsets are stale absolute PIXELS that can't be converted. They must
    // be zeroed (centered) on load while the zoom is preserved — never rejected.
    const legacy = {
      slot: 3,
      blob: blob(),
      transform: { offsetX: 123, offsetY: -456, scale: 1.8 },
    }
    const out = fromImageRecords([legacy])
    expect(out).toHaveLength(1)
    expect(out[0].transform).toEqual({ offsetX: 0, offsetY: 0, scale: 1.8 })
  })

  it('keeps the pan of a record already on the fractional model (no reset)', () => {
    // A record written with the marker holds valid fractional offsets: keep them
    // (this is the "persist normally, do not reset on every load" guarantee).
    const marked = {
      slot: 4,
      blob: blob(),
      transform: { offsetX: 0.25, offsetY: -0.1, scale: 1.2 },
      panUnit: IMAGE_PAN_UNIT,
    }
    const out = fromImageRecords([marked])
    expect(out).toHaveLength(1)
    expect(out[0].transform).toEqual({ offsetX: 0.25, offsetY: -0.1, scale: 1.2 })
  })

  it('drops malformed records (non-blob, bad transform) without throwing', () => {
    const records = [
      toImageRecord(1, blob(), DEFAULT_IMAGE_TRANSFORM), // good
      { slot: 2, blob: 'not-a-blob', transform: DEFAULT_IMAGE_TRANSFORM }, // bad blob
      { slot: 3, blob: blob(), transform: { offsetX: 0 } }, // bad transform
      { slot: 4 }, // incomplete
    ]
    const out = fromImageRecords(records)
    expect(out).toHaveLength(1)
    expect(out[0].slot).toBe(1)
  })
})
