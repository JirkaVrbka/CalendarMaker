/**
 * PURE mapping + validation between the Zustand store and the persisted
 * IndexedDB records. No Dexie / IndexedDB here on purpose: all the risky logic
 * (serialize, Zod-validate, version/staleness check, image map ↔ records) lives
 * in these side-effect-free functions so it is fully unit-testable without a
 * database (jsdom has no IndexedDB and we add no dependency for one).
 *
 * The thin Dexie wrapper (`service.ts`) and the store's `hydrate` action build
 * on these; object-URL creation is deliberately left to the store (a side
 * effect), keeping this module pure.
 */
import { z } from 'zod'

import {
  imageTransformSchema,
  storedCalendarProjectSchema,
} from '../../schemas/calendar'
import type { StoredCalendarProject } from '../../schemas/calendar'
import type { CalendarProject, ImageTransform } from '../../types/calendar'

/**
 * Persisted-schema version. Bump when the stored shape changes; a loaded record
 * whose version differs is treated as stale and discarded (→ default calendar).
 */
export const STORAGE_VERSION = 1

/** Fixed primary key for the single current-project row. */
export const PROJECT_KEY = 'current'

/**
 * Marker stamped on every image record written with the CURRENT pan model,
 * where `transform.offsetX/offsetY` are a FRACTION of the frame (resolution
 * independent). Records saved before this change hold the OLD pan model —
 * absolute frame pixels captured at the small editor size, which can't be
 * converted to a fraction (the creation frame was never recorded). A loaded
 * record lacking this marker therefore has its pan reset to 0 (centered) once,
 * on load, keeping the zoom; new writes carry the marker, so a fractional pan
 * committed afterwards persists normally and is never reset again.
 */
export const IMAGE_PAN_UNIT = 'fraction' as const

/**
 * The single-row `project` table record: one versioned calendar config. The
 * stored `config` omits `pages` — they are derived from start month/year and
 * rebuilt on load (see `StoredCalendarProject`).
 */
export interface ProjectRecord {
  readonly id: typeof PROJECT_KEY
  readonly version: number
  readonly config: StoredCalendarProject
}

/** An `images` table record: a photo Blob + its transform, keyed by page slot. */
export interface ImageRecord {
  readonly slot: number
  readonly blob: Blob
  readonly transform: ImageTransform
  /**
   * Pan-model marker. Present (`'fraction'`) on records written with the
   * current fractional pan; absent on legacy records whose pan was stored in
   * pixels. See `IMAGE_PAN_UNIT` and the one-shot reset in `fromImageRecords`.
   */
  readonly panUnit?: typeof IMAGE_PAN_UNIT
}

/** A validated photo ready to become a store `ImageEntry` (url added later). */
export interface PersistedImage {
  readonly slot: number
  readonly blob: Blob
  readonly transform: ImageTransform
}

/** Everything loaded from storage, already validated and defaulted. */
export interface PersistedData {
  /**
   * The stored config (without `pages`; those are rebuilt on load), or `null`
   * when absent/invalid/stale → use default.
   */
  readonly config: StoredCalendarProject | null
  readonly images: readonly PersistedImage[]
}

const projectRecordSchema = z.object({
  id: z.literal(PROJECT_KEY),
  version: z.number(),
  config: storedCalendarProjectSchema,
})

const imageRecordSchema = z.object({
  slot: z.number().int().min(0),
  blob: z.instanceof(Blob),
  transform: imageTransformSchema,
  // Optional so a legacy record (no marker) still validates; its absence is the
  // signal to reset the stale pixel pan once (see `fromImageRecords`).
  panUnit: z.literal(IMAGE_PAN_UNIT).optional(),
})

/**
 * Serialize the store's project config into the single versioned record. The
 * derived `pages` array is stripped — it is rebuilt from start month/year on
 * load, so persisting it would be redundant (and a corruptible liability).
 */
export function toProjectRecord(config: CalendarProject): ProjectRecord {
  const { pages: _pages, ...stored } = config
  return { id: PROJECT_KEY, version: STORAGE_VERSION, config: stored }
}

/**
 * Validate a loaded project row and return its config (without `pages`, which
 * the store rebuilds on hydrate), or `null` when the row is missing, malformed,
 * or from a different (stale) `STORAGE_VERSION`. Never throws — callers fall
 * back to the default calendar on `null`.
 */
export function fromProjectRecord(
  record: unknown,
): StoredCalendarProject | null {
  const parsed = projectRecordSchema.safeParse(record)
  if (!parsed.success) return null
  if (parsed.data.version !== STORAGE_VERSION) return null
  return parsed.data.config
}

/** Map a slot's photo (blob + transform) into an image record. */
export function toImageRecord(
  slot: number,
  blob: Blob,
  transform: ImageTransform,
): ImageRecord {
  // Always stamp the current pan model so this record is never reset on reload.
  return { slot, blob, transform, panUnit: IMAGE_PAN_UNIT }
}

/**
 * Validate loaded image rows, dropping any malformed one, and return them as
 * plain `PersistedImage`s (no object-URLs — the store creates those on
 * hydrate). Never throws.
 */
export function fromImageRecords(records: readonly unknown[]): PersistedImage[] {
  const result: PersistedImage[] = []
  for (const record of records) {
    const parsed = imageRecordSchema.safeParse(record)
    if (parsed.success) {
      const { slot, blob, transform, panUnit } = parsed.data
      // One-shot pan migration: a legacy record (no `panUnit`) holds an old
      // PIXEL pan that can't be converted to the new fractional model, so reset
      // it to centered (0) while keeping the zoom. Records already on the
      // fractional model keep their pan. Resetting legacy pan is idempotent
      // (0 → 0), and once the store re-saves with the marker it is never reset
      // again.
      const migrated =
        panUnit === IMAGE_PAN_UNIT
          ? transform
          : { ...transform, offsetX: 0, offsetY: 0 }
      result.push({ slot, blob, transform: migrated })
    }
  }
  return result
}
