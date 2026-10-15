/**
 * Thin async wrapper over the Dexie tables (`db.ts`), delegating all mapping and
 * validation to the pure functions in `mapping.ts`. Kept intentionally minimal:
 * there is no branching logic here to unit-test — its correctness is covered by
 * the type-checker/build and exercised manually (`npm run dev`, reload). The
 * testable logic lives in `mapping.ts` and the store's `hydrate`/`resetProject`.
 */
import type { CalendarProject, ImageTransform } from '../../types/calendar'
import { db } from './db'
import {
  IMAGE_PAN_UNIT,
  PROJECT_KEY,
  fromImageRecords,
  fromProjectRecord,
  toImageRecord,
  toProjectRecord,
} from './mapping'
import type { PersistedData } from './mapping'

/**
 * Load the current project config + all images. Validation never throws (bad
 * rows map to `null`/are dropped); the underlying DB call may still reject, and
 * the caller (App's boot effect) falls back to the default calendar on that.
 */
export async function loadAll(): Promise<PersistedData> {
  const [projectRow, imageRows] = await Promise.all([
    db.project.get(PROJECT_KEY),
    db.images.toArray(),
  ])
  return {
    config: fromProjectRecord(projectRow),
    images: fromImageRecords(imageRows),
  }
}

/** Persist (replace) the single current project config. */
export async function saveProjectConfig(config: CalendarProject): Promise<void> {
  await db.project.put(toProjectRecord(config))
}

/** Persist a slot's photo Blob + transform (write the heavy Blob here only). */
export async function putImage(
  slot: number,
  blob: Blob,
  transform: ImageTransform,
): Promise<void> {
  await db.images.put(toImageRecord(slot, blob, transform))
}

/**
 * Update only a slot's transform, leaving the stored Blob untouched (Dexie does
 * a partial update). No-ops if the slot has no stored image. This is the path
 * hit on debounced drag/zoom — it must not rewrite the Blob. It also stamps the
 * current pan-model marker, since a committed fractional pan arrives here (not
 * via `toImageRecord`); without it a migrated legacy record would re-reset.
 */
export async function putImageTransform(
  slot: number,
  transform: ImageTransform,
): Promise<void> {
  await db.images.update(slot, { transform, panUnit: IMAGE_PAN_UNIT })
}

/** Delete a slot's stored photo. */
export async function deleteImage(slot: number): Promise<void> {
  await db.images.delete(slot)
}

/** Wipe all persisted data (used by New/Reset). */
export async function clearAll(): Promise<void> {
  await Promise.all([db.project.clear(), db.images.clear()])
}
