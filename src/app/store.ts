/**
 * The single source of truth for the calendar project, as a Zustand store.
 * Holds the `CalendarProject` plus the currently selected page index, and
 * exposes the small set of actions the UI needs. Persistence lives outside the
 * store: `App` loads on boot and calls `hydrate`, then autosaves config changes
 * and image edits to IndexedDB (via `features/storage`). The store stays free of
 * persistence middleware — it just exposes `hydrate`/`resetProject` for App to
 * drive.
 *
 * Months are 0-indexed (0 = January) everywhere, matching `src/lib`.
 */
import { create } from 'zustand'

import type { PersistedData } from '../features/storage/mapping'
import { A4_PORTRAIT } from '../lib/page'
import { buildProjectPages } from '../lib/projectPages'
import {
  DEFAULT_IMAGE_TRANSFORM,
  DEFAULT_LAYOUT,
  DEFAULT_STYLE,
  DEFAULT_SUBTITLE_POSITION,
  DEFAULT_TITLE_POSITION,
  MONDAY,
} from '../types/calendar'
import type {
  CalendarProject,
  CalendarStyle,
  ImageEntry,
  ImageTransform,
  Language,
  LayoutId,
  TextPosition,
} from '../types/calendar'

/** Clamp `index` into the valid `[0, length - 1]` page range. */
function clampIndex(index: number, length: number): number {
  return Math.max(0, Math.min(index, length - 1))
}

function createInitialProject(): CalendarProject {
  const now = new Date()
  const startMonth = now.getMonth()
  const startYear = now.getFullYear()
  return {
    title: 'My Calendar',
    subtitle: '',
    titlePosition: DEFAULT_TITLE_POSITION,
    subtitlePosition: DEFAULT_SUBTITLE_POSITION,
    startMonth,
    startYear,
    language: 'en',
    weekStart: MONDAY,
    pageSize: A4_PORTRAIT,
    style: DEFAULT_STYLE,
    layout: DEFAULT_LAYOUT,
    pages: buildProjectPages(startMonth, startYear),
  }
}

export interface ProjectStore {
  readonly project: CalendarProject
  readonly activePageIndex: number
  /**
   * User photos, keyed by **page slot index** (0 = cover, 1..12 = month pages),
   * held separately from the serializable `project`. Keying by slot is
   * deliberate: photos stay with page position across a start-month rebuild
   * (`setStart` never touches this map). Persisted as Blobs via
   * `features/storage`; object-URLs are a render-time concern held only here.
   */
  readonly images: Readonly<Record<number, ImageEntry>>
  /**
   * `false` until the initial load from IndexedDB has been applied via
   * `hydrate`. Autosave MUST stay gated behind this flag — saving the default
   * starting state before hydration would overwrite the stored calendar on boot
   * (the #1 correctness trap of persistence).
   */
  readonly hydrated: boolean
  /**
   * Apply persisted data loaded from storage, then mark the store `hydrated`.
   * Rebuilds the 12 month pages from the stored start month/year (never trusts
   * stored `pages`), and mints FRESH object-URLs from the stored Blobs. Revokes
   * any object-URLs already held (hydrate-replace) so nothing leaks. A `null`
   * config falls back to a fresh default calendar.
   */
  hydrate: (persisted: PersistedData) => void
  /**
   * Start a fresh default calendar: revoke every held object-URL and reset the
   * project + images to their initial state. Stays `hydrated` (boot is over).
   */
  resetProject: () => void
  /** Set the cover title. */
  setTitle: (title: string) => void
  /**
   * Set the cover subtitle. Mints a FRESH project object so the config-autosave
   * subscription (which fires on project-identity change) persists it.
   */
  setSubtitle: (subtitle: string) => void
  /** Set the cover title's position (center anchor, page fraction). */
  setTitlePosition: (position: TextPosition) => void
  /** Set the cover subtitle's position (center anchor, page fraction). */
  setSubtitlePosition: (position: TextPosition) => void
  /** Set the start month/year and rebuild the 12 month pages. */
  setStart: (month: number, year: number) => void
  /** Select a page by index (clamped to the valid range). */
  selectPage: (index: number) => void
  /** Switch the project language. */
  setLanguage: (language: Language) => void
  /**
   * Patch the whole-calendar style (font/colors). Merges `partial` over the
   * current style and mints a FRESH project object so the config-autosave
   * subscription (which fires on project-identity change) persists it.
   */
  setStyle: (partial: Partial<CalendarStyle>) => void
  /**
   * Set the whole-calendar month-page layout. Mints a FRESH project object so
   * the config-autosave subscription (which fires on project-identity change)
   * persists it, exactly like `setStyle`.
   */
  setLayout: (layout: LayoutId) => void
  /**
   * Set (or replace) the photo for a slot: revokes any previous object-URL for
   * that slot, derives a fresh object-URL from the blob, and resets to the
   * default cover-fit transform.
   */
  setImage: (slot: number, blob: Blob) => void
  /** Update the transform (zoom/position) of an existing slot's photo. */
  setImageTransform: (slot: number, transform: ImageTransform) => void
  /** Remove a slot's photo, revoking its object-URL. */
  removeImage: (slot: number) => void
}

/** Revoke every object-URL held in an images map (leak-free teardown). */
function revokeAll(images: Readonly<Record<number, ImageEntry>>): void {
  for (const entry of Object.values(images)) URL.revokeObjectURL(entry.url)
}

export const useProjectStore = create<ProjectStore>((set) => ({
  project: createInitialProject(),
  activePageIndex: 0,
  images: {},
  hydrated: false,

  hydrate: (persisted) =>
    set((state) => {
      // Replacing the current images map — revoke old URLs first.
      revokeAll(state.images)
      const config = persisted.config
      const project: CalendarProject = config
        ? { ...config, pages: buildProjectPages(config.startMonth, config.startYear) }
        : createInitialProject()
      const images: Record<number, ImageEntry> = {}
      for (const img of persisted.images) {
        images[img.slot] = {
          blob: img.blob,
          url: URL.createObjectURL(img.blob),
          transform: img.transform,
        }
      }
      return {
        project,
        images,
        activePageIndex: clampIndex(state.activePageIndex, project.pages.length),
        hydrated: true,
      }
    }),

  resetProject: () =>
    set((state) => {
      revokeAll(state.images)
      return {
        project: createInitialProject(),
        images: {},
        activePageIndex: 0,
      }
    }),

  setTitle: (title) =>
    set((state) => ({ project: { ...state.project, title } })),

  setSubtitle: (subtitle) =>
    set((state) => ({ project: { ...state.project, subtitle } })),

  setTitlePosition: (position) =>
    set((state) => ({ project: { ...state.project, titlePosition: position } })),

  setSubtitlePosition: (position) =>
    set((state) => ({
      project: { ...state.project, subtitlePosition: position },
    })),

  setStart: (month, year) =>
    set((state) => {
      const pages = buildProjectPages(month, year)
      return {
        project: {
          ...state.project,
          startMonth: month,
          startYear: year,
          pages,
        },
        activePageIndex: clampIndex(state.activePageIndex, pages.length),
      }
    }),

  selectPage: (index) =>
    set((state) => ({
      activePageIndex: clampIndex(index, state.project.pages.length),
    })),

  setLanguage: (language) =>
    set((state) => ({ project: { ...state.project, language } })),

  setStyle: (partial) =>
    set((state) => ({
      project: {
        ...state.project,
        style: { ...state.project.style, ...partial },
      },
    })),

  setLayout: (layout) =>
    set((state) => ({ project: { ...state.project, layout } })),

  setImage: (slot, blob) =>
    set((state) => {
      const previous = state.images[slot]
      if (previous) URL.revokeObjectURL(previous.url)
      const url = URL.createObjectURL(blob)
      return {
        images: {
          ...state.images,
          [slot]: { blob, url, transform: DEFAULT_IMAGE_TRANSFORM },
        },
      }
    }),

  setImageTransform: (slot, transform) =>
    set((state) => {
      const entry = state.images[slot]
      if (!entry) return {}
      return {
        images: { ...state.images, [slot]: { ...entry, transform } },
      }
    }),

  removeImage: (slot) =>
    set((state) => {
      const entry = state.images[slot]
      if (!entry) return {}
      URL.revokeObjectURL(entry.url)
      const next = { ...state.images }
      delete next[slot]
      return { images: next }
    }),
}))
