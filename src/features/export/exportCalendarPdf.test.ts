import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Theme } from '@mui/material/styles'

// Mock jsPDF so no real document/canvas is needed. `vi.hoisted` lets the mock
// factory (hoisted above imports) share these spies with the test body.
const { addImage, addPage, save, ops } = vi.hoisted(() => {
  const ops: string[] = []
  return {
    ops,
    addImage: vi.fn(() => {
      ops.push('addImage')
    }),
    addPage: vi.fn(() => {
      ops.push('addPage')
    }),
    save: vi.fn(() => {
      ops.push('save')
    }),
  }
})

vi.mock('jspdf', () => ({
  // A regular function (not an arrow) so `new jsPDF(...)` is constructable.
  jsPDF: vi.fn(function () {
    return { addImage, addPage, save }
  }),
}))

import { jsPDF } from 'jspdf'

import { A4_PORTRAIT } from '../../lib/page'
import { buildProjectPages } from '../../lib/projectPages'
import { DEFAULT_STYLE, MONDAY } from '../../types/calendar'
import type { CalendarProject } from '../../types/calendar'
import type { CapturePageInput } from './captureCalendarPage'
import { exportCalendarPdf } from './exportCalendarPdf'

// The orchestration never dereferences the theme (capture is mocked), so a bare
// stub is enough.
const fakeTheme = {} as Theme

function makeProject(title = 'My 2026 Trip'): CalendarProject {
  return {
    title,
    subtitle: '',
    titlePosition: { x: 0.5, y: 0.14 },
    subtitlePosition: { x: 0.5, y: 0.22 },
    startMonth: 0,
    startYear: 2026,
    language: 'en',
    weekStart: MONDAY,
    pageSize: A4_PORTRAIT,
    style: DEFAULT_STYLE,
    layout: 'classic-top',
    pages: buildProjectPages(0, 2026),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  ops.length = 0
})

describe('exportCalendarPdf', () => {
  it('builds a 13-page PDF: 13 images added, 12 page breaks, one save', async () => {
    const capture = vi.fn(() => Promise.resolve('data:png'))

    await exportCalendarPdf(makeProject(), {}, { theme: fakeTheme, capture })

    expect(capture).toHaveBeenCalledTimes(13)
    expect(addImage).toHaveBeenCalledTimes(13)
    expect(addPage).toHaveBeenCalledTimes(12)
    expect(save).toHaveBeenCalledTimes(1)
  })

  it('constructs a jsPDF A4 portrait document in millimetres', async () => {
    await exportCalendarPdf(
      makeProject(),
      {},
      { theme: fakeTheme, capture: () => Promise.resolve('d') },
    )
    expect(jsPDF).toHaveBeenCalledWith({
      format: 'a4',
      orientation: 'portrait',
      unit: 'mm',
    })
  })

  it('captures pages in order 0..12 and fills the full A4 area', async () => {
    const seen: number[] = []
    const capture = vi.fn((input: CapturePageInput) => {
      seen.push(input.pageIndex)
      return Promise.resolve('d')
    })

    await exportCalendarPdf(makeProject(), {}, { theme: fakeTheme, capture })

    expect(seen).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    // Each image fills 210 × 297 mm at the page origin.
    expect(addImage).toHaveBeenCalledWith('d', 'PNG', 0, 0, 210, 297)
  })

  it('places the first image before the first page break (correct ordering)', async () => {
    await exportCalendarPdf(
      makeProject(),
      {},
      { theme: fakeTheme, capture: () => Promise.resolve('d') },
    )
    // First op is an image (page 0 uses the initial page), then page/image pairs.
    expect(ops.slice(0, 3)).toEqual(['addImage', 'addPage', 'addImage'])
    expect(ops[ops.length - 1]).toBe('save')
  })

  it('reports progress for every page', async () => {
    const onProgress = vi.fn()

    await exportCalendarPdf(
      makeProject(),
      {},
      { theme: fakeTheme, capture: () => Promise.resolve('d'), onProgress },
    )

    expect(onProgress).toHaveBeenCalledTimes(13)
    expect(onProgress).toHaveBeenNthCalledWith(1, { current: 1, total: 13 })
    expect(onProgress).toHaveBeenNthCalledWith(13, { current: 13, total: 13 })
  })

  it('saves with a filename derived from the calendar title', async () => {
    await exportCalendarPdf(
      makeProject('Our Family 2026'),
      {},
      { theme: fakeTheme, capture: () => Promise.resolve('d') },
    )
    expect(save).toHaveBeenCalledWith('Our Family 2026.pdf')
  })

  it('passes each slot photo through to the capture', async () => {
    const coverEntry = {
      blob: new Blob(),
      url: 'blob:cover',
      transform: { offsetX: 0, offsetY: 0, scale: 1 },
    }
    const seen: Array<string | undefined> = []
    const capture = vi.fn((input: CapturePageInput) => {
      seen.push(input.entry?.url)
      return Promise.resolve('d')
    })

    await exportCalendarPdf(
      makeProject(),
      { 0: coverEntry },
      { theme: fakeTheme, capture },
    )

    expect(seen[0]).toBe('blob:cover')
    expect(seen[1]).toBeUndefined()
  })
})
