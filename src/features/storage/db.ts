/**
 * The IndexedDB database definition (Dexie). Two tables, both client-side only:
 *  - `project`: a single row keyed by the fixed `PROJECT_KEY` ('current'),
 *    holding `{ version, config }` — the one current calendar's settings.
 *  - `images`: one row per page slot (0 = cover, 1..12 = months), holding the
 *    photo Blob + its transform.
 *
 * This file only declares the schema and exports typed table accessors; the
 * read/write logic lives in `service.ts` (thin) and `mapping.ts` (pure).
 */
import Dexie, { type EntityTable } from 'dexie'

import type { ImageRecord, ProjectRecord } from './mapping'

export class CalendarDB extends Dexie {
  /** Single-row current project (primary key: `id`). */
  project!: EntityTable<ProjectRecord, 'id'>
  /** Per-slot photos (primary key: `slot`). */
  images!: EntityTable<ImageRecord, 'slot'>

  constructor() {
    super('CalendarMakerDB')
    // Only the primary keys are indexed; no secondary indexes are needed.
    this.version(1).stores({
      project: 'id',
      images: 'slot',
    })
  }
}

/** The shared database instance for the app. */
export const db = new CalendarDB()
