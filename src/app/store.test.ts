import { beforeEach, describe, expect, it, vi } from 'vitest'

import { A4_PORTRAIT } from '../lib/page'
import { buildProjectPages } from '../lib/projectPages'
import { DEFAULT_IMAGE_TRANSFORM, DEFAULT_STYLE, MONDAY } from '../types/calendar'
import type { CalendarProject, MonthPage } from '../types/calendar'
import { useProjectStore } from './store'

/** Reset to a deterministic baseline (Jan 2026) before each test. */
beforeEach(() => {
  useProjectStore.setState((state) => ({
    project: {
      ...state.project,
      title: 'My Calendar',
      subtitle: '',
      titlePosition: { x: 0.5, y: 0.14 },
      subtitlePosition: { x: 0.5, y: 0.22 },
      language: 'en',
      startMonth: 0,
      startYear: 2026,
      pages: buildProjectPages(0, 2026),
    },
    activePageIndex: 0,
    images: {},
    hydrated: false,
  }))
  vi.restoreAllMocks()
})

const blob = () => new Blob(['x'], { type: 'image/png' })

describe('useProjectStore', () => {
  it('setTitle updates only the title', () => {
    useProjectStore.getState().setTitle('Family 2026')
    expect(useProjectStore.getState().project.title).toBe('Family 2026')
  })

  it('a fresh project starts with an empty subtitle and default text positions', () => {
    const { project } = useProjectStore.getState()
    expect(project.subtitle).toBe('')
    expect(project.titlePosition).toEqual({ x: 0.5, y: 0.14 })
    expect(project.subtitlePosition).toEqual({ x: 0.5, y: 0.22 })
  })

  it('setSubtitle updates the subtitle and mints a new project', () => {
    const before = useProjectStore.getState().project
    useProjectStore.getState().setSubtitle('A memorable year')
    const after = useProjectStore.getState().project
    expect(after.subtitle).toBe('A memorable year')
    expect(after.title).toBe(before.title)
    expect(after).not.toBe(before)
  })

  it('setTitlePosition / setSubtitlePosition store the new fractional centers', () => {
    useProjectStore.getState().setTitlePosition({ x: 0.2, y: 0.8 })
    useProjectStore.getState().setSubtitlePosition({ x: 0.9, y: 0.1 })
    const { project } = useProjectStore.getState()
    expect(project.titlePosition).toEqual({ x: 0.2, y: 0.8 })
    expect(project.subtitlePosition).toEqual({ x: 0.9, y: 0.1 })
  })

  it('setLanguage switches the project language', () => {
    useProjectStore.getState().setLanguage('cs')
    expect(useProjectStore.getState().project.language).toBe('cs')
  })

  it('setStyle patches the style, preserves other fields, and mints a new project', () => {
    const before = useProjectStore.getState().project
    useProjectStore.getState().setStyle({ textColor: '#123456' })
    const after = useProjectStore.getState().project
    expect(after.style.textColor).toBe('#123456')
    // Untouched style fields keep their previous (default) values.
    expect(after.style.fontFamily).toBe(before.style.fontFamily)
    expect(after.style.backgroundColor).toBe(before.style.backgroundColor)
    // Other project fields are untouched.
    expect(after.title).toBe(before.title)
    // Fresh project + style identity so the config-autosave subscription fires.
    expect(after).not.toBe(before)
    expect(after.style).not.toBe(before.style)
  })

  it('setStyle merges successive partial updates', () => {
    useProjectStore.getState().setStyle({ fontFamily: 'Inter' })
    useProjectStore.getState().setStyle({ saturdayColor: '#ff0000' })
    useProjectStore.getState().setStyle({ sundayColor: '#00ff00' })
    const { style } = useProjectStore.getState().project
    expect(style.fontFamily).toBe('Inter')
    expect(style.saturdayColor).toBe('#ff0000')
    expect(style.sundayColor).toBe('#00ff00')
  })

  it('setLayout sets the layout, preserves other fields, and mints a new project', () => {
    const before = useProjectStore.getState().project
    expect(before.layout).toBe('classic-top')
    useProjectStore.getState().setLayout('fullbleed-ribbon')
    const after = useProjectStore.getState().project
    expect(after.layout).toBe('fullbleed-ribbon')
    // Other project fields untouched.
    expect(after.title).toBe(before.title)
    expect(after.style).toBe(before.style)
    // Fresh project identity so the config-autosave subscription fires.
    expect(after).not.toBe(before)
  })

  it('setStart rebuilds the 12 month pages, crossing the year boundary', () => {
    useProjectStore.getState().setStart(6, 2026)
    const { project } = useProjectStore.getState()
    expect(project.startMonth).toBe(6)
    expect(project.startYear).toBe(2026)
    expect(project.pages).toHaveLength(13)
    const last = project.pages[12] as MonthPage
    expect(last).toEqual({ kind: 'month', year: 2027, month: 5 })
  })

  it('setStart clamps activePageIndex to the valid range', () => {
    useProjectStore.setState({ activePageIndex: 12 })
    useProjectStore.getState().setStart(3, 2027)
    // Still 13 pages, so index 12 remains valid.
    expect(useProjectStore.getState().activePageIndex).toBe(12)
  })

  it('selectPage sets a valid index and clamps out-of-range input', () => {
    useProjectStore.getState().selectPage(5)
    expect(useProjectStore.getState().activePageIndex).toBe(5)

    useProjectStore.getState().selectPage(99)
    expect(useProjectStore.getState().activePageIndex).toBe(12)

    useProjectStore.getState().selectPage(-3)
    expect(useProjectStore.getState().activePageIndex).toBe(0)
  })

  it('setImage stores an entry with a url and the default cover-fit transform', () => {
    const b = blob()
    useProjectStore.getState().setImage(1, b)
    const entry = useProjectStore.getState().images[1]
    expect(entry).toBeDefined()
    expect(entry.blob).toBe(b)
    expect(entry.url).toMatch(/^blob:/)
    expect(entry.transform).toEqual(DEFAULT_IMAGE_TRANSFORM)
  })

  it('setImage replacing a slot revokes the previous object-URL', () => {
    useProjectStore.getState().setImage(1, blob())
    const firstUrl = useProjectStore.getState().images[1].url
    const revoke = vi.spyOn(URL, 'revokeObjectURL')

    useProjectStore.getState().setImage(1, blob())
    const secondUrl = useProjectStore.getState().images[1].url

    expect(revoke).toHaveBeenCalledWith(firstUrl)
    expect(secondUrl).not.toBe(firstUrl)
  })

  it('setImageTransform updates only the targeted slot and no-ops when empty', () => {
    useProjectStore.getState().setImage(2, blob())
    const next = { offsetX: -5, offsetY: -3, scale: 1.5 }
    useProjectStore.getState().setImageTransform(2, next)
    expect(useProjectStore.getState().images[2].transform).toEqual(next)

    // No entry at slot 5 — must not create one.
    useProjectStore.getState().setImageTransform(5, next)
    expect(useProjectStore.getState().images[5]).toBeUndefined()
  })

  it('removeImage revokes the url and deletes the entry', () => {
    useProjectStore.getState().setImage(3, blob())
    const url = useProjectStore.getState().images[3].url
    const revoke = vi.spyOn(URL, 'revokeObjectURL')

    useProjectStore.getState().removeImage(3)

    expect(revoke).toHaveBeenCalledWith(url)
    expect(useProjectStore.getState().images[3]).toBeUndefined()
  })

  it('setStart leaves the images map untouched (photos survive a rebuild)', () => {
    useProjectStore.getState().setImage(0, blob())
    useProjectStore.getState().setImage(1, blob())
    const before = useProjectStore.getState().images

    useProjectStore.getState().setStart(6, 2027)

    const after = useProjectStore.getState().images
    expect(after).toBe(before)
    expect(after[0]).toBeDefined()
    expect(after[1]).toBeDefined()
  })
})

/** A persisted config whose stored `pages` are intentionally empty, to prove
 * `hydrate` always rebuilds the 12 month pages from start month/year. */
function persistedConfig(): CalendarProject {
  return {
    title: 'Restored',
    subtitle: 'A subtitle',
    titlePosition: { x: 0.3, y: 0.2 },
    subtitlePosition: { x: 0.7, y: 0.4 },
    startMonth: 6,
    startYear: 2026,
    language: 'cs',
    weekStart: MONDAY,
    pageSize: A4_PORTRAIT,
    style: DEFAULT_STYLE,
    layout: 'classic-top',
    pages: [],
  }
}

describe('useProjectStore — hydrate / reset', () => {
  it('starts not hydrated', () => {
    expect(useProjectStore.getState().hydrated).toBe(false)
  })

  it('hydrate applies config, rebuilds pages, and marks hydrated', () => {
    useProjectStore.getState().hydrate({ config: persistedConfig(), images: [] })
    const { project, hydrated } = useProjectStore.getState()
    expect(hydrated).toBe(true)
    expect(project.title).toBe('Restored')
    expect(project.subtitle).toBe('A subtitle')
    expect(project.titlePosition).toEqual({ x: 0.3, y: 0.2 })
    expect(project.subtitlePosition).toEqual({ x: 0.7, y: 0.4 })
    expect(project.language).toBe('cs')
    // Stored pages were empty; hydrate rebuilt all 13.
    expect(project.pages).toHaveLength(13)
    const last = project.pages[12] as MonthPage
    expect(last).toEqual({ kind: 'month', year: 2027, month: 5 })
  })

  it('hydrate mints fresh object-URLs from stored blobs', () => {
    const b = blob()
    useProjectStore.getState().hydrate({
      config: persistedConfig(),
      images: [{ slot: 3, blob: b, transform: { offsetX: 1, offsetY: 2, scale: 1.2 } }],
    })
    const entry = useProjectStore.getState().images[3]
    expect(entry).toBeDefined()
    expect(entry.blob).toBe(b)
    expect(entry.url).toMatch(/^blob:/)
    expect(entry.transform).toEqual({ offsetX: 1, offsetY: 2, scale: 1.2 })
  })

  it('hydrate with null config falls back to a default calendar', () => {
    useProjectStore.getState().hydrate({ config: null, images: [] })
    const { project, hydrated } = useProjectStore.getState()
    expect(hydrated).toBe(true)
    expect(project.title).toBe('My Calendar')
    expect(project.pages).toHaveLength(13)
  })

  it('hydrate revokes any object-URLs it is replacing (hydrate-replace)', () => {
    useProjectStore.getState().setImage(1, blob())
    const oldUrl = useProjectStore.getState().images[1].url
    const revoke = vi.spyOn(URL, 'revokeObjectURL')

    useProjectStore.getState().hydrate({ config: persistedConfig(), images: [] })

    expect(revoke).toHaveBeenCalledWith(oldUrl)
    expect(useProjectStore.getState().images[1]).toBeUndefined()
  })

  it('resetProject revokes URLs and returns to the default calendar', () => {
    useProjectStore.getState().hydrate({ config: persistedConfig(), images: [] })
    useProjectStore.getState().setImage(2, blob())
    const url = useProjectStore.getState().images[2].url
    const revoke = vi.spyOn(URL, 'revokeObjectURL')

    useProjectStore.getState().resetProject()

    const { project, images } = useProjectStore.getState()
    expect(revoke).toHaveBeenCalledWith(url)
    expect(images).toEqual({})
    expect(project.title).toBe('My Calendar')
    expect(project.pages).toHaveLength(13)
  })
})
