/**
 * Offscreen page capture for the PDF export. Renders ONE calendar page (cover or
 * month) using the SAME react-konva components the editor uses — so the PDF is
 * truly WYSIWYG with no second layout engine — but at the full export pixel size
 * rather than the on-screen size. It mounts a throwaway React root in a hidden,
 * detached container, waits for the page's photo to be decoded and drawn, then
 * snapshots the Konva `Stage` to a PNG data-URL and tears the root down.
 *
 * This runs only in a real browser (it needs a live canvas), so it is never
 * unit-tested directly: the orchestration (`exportCalendarPdf`) accepts it as an
 * injectable dependency and tests pass a mock in its place.
 */
import { createElement, createRef } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from '@mui/material/styles'
import type { Theme } from '@mui/material/styles'
import type Konva from 'konva'

import { assertNever } from '../../lib/assertNever'
import type { PixelSize } from '../../lib/page'
import type { CalendarProject, ImageEntry } from '../../types/calendar'
import { CoverPageCanvas } from '../editor/CoverPageCanvas'
import { MonthPageCanvas } from '../editor/MonthPageCanvas'

export interface CapturePageInput {
  /** The whole project (title, language, week start, pages). */
  readonly project: CalendarProject
  /** Index of the page to render: 0 = cover, 1..12 = month pages. */
  readonly pageIndex: number
  /** The photo for this page slot, if any. */
  readonly entry?: ImageEntry
  /** Target pixel size of the render (the export size, e.g. 2480 × 3508). */
  readonly size: PixelSize
  /** MUI theme to render with, so exported colors match the screen. */
  readonly theme: Theme
}

/** Renders a page and returns its PNG snapshot as a data-URL. */
export type CapturePageFn = (input: CapturePageInput) => Promise<string>

/** Hard cap so a stuck image load can never hang the whole export. */
const CAPTURE_TIMEOUT_MS = 15_000

/** Resolve on the next animation frame (falls back to a timer). */
function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => resolve())
    } else {
      setTimeout(resolve, 16)
    }
  })
}

/**
 * Fully decode an image from its object-URL so the component's own loader
 * resolves promptly and the photo is present at snapshot time (the #1 cause of
 * blank pages is snapshotting before the image is ready).
 */
async function decodeImage(url: string): Promise<void> {
  const img = new Image()
  img.src = url
  if (typeof img.decode === 'function') {
    await img.decode()
    return
  }
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('export: image failed to load'))
  })
}

/** Build the page element (static — no drag handler) for the given input. */
function pageElement(
  input: CapturePageInput,
  stageRef: React.Ref<Konva.Stage>,
) {
  const { project, pageIndex, entry, size } = input
  const page = project.pages[pageIndex]
  switch (page.kind) {
    case 'cover':
      return createElement(CoverPageCanvas, {
        title: project.title,
        subtitle: project.subtitle,
        titlePosition: project.titlePosition,
        subtitlePosition: project.subtitlePosition,
        size,
        style: project.style,
        imageUrl: entry?.url,
        imageTransform: entry?.transform,
        stageRef,
      })
    case 'month':
      return createElement(MonthPageCanvas, {
        year: page.year,
        month: page.month,
        weekStart: project.weekStart,
        language: project.language,
        size,
        title: project.title,
        subtitle: project.subtitle,
        style: project.style,
        layout: project.layout,
        imageUrl: entry?.url,
        imageTransform: entry?.transform,
        stageRef,
      })
    default:
      return assertNever(page)
  }
}

/**
 * Wait until the Stage is mounted and — when a photo is expected — its image
 * node has appeared.
 *
 * INVARIANT: `stage.find('Image').length > 0` is a valid "the photo has been
 * painted" signal ONLY because `ImageFrame` mounts its Konva `Image` node
 * solely after the bitmap has finished loading (via `useImageElement`). While
 * the bitmap is loading no `Image` node exists, so its presence means the photo
 * is ready to draw. If `ImageFrame`/`useImageElement` ever changes to mount the
 * node earlier (e.g. before the bitmap resolves), this readiness check must
 * change too, or pages could be snapshotted blank.
 */
async function waitForStage(
  stageRef: React.RefObject<Konva.Stage | null>,
  expectImage: boolean,
): Promise<Konva.Stage> {
  const start = Date.now()
  for (;;) {
    const stage = stageRef.current
    if (stage && (!expectImage || stage.find('Image').length > 0)) {
      return stage
    }
    if (Date.now() - start > CAPTURE_TIMEOUT_MS) {
      throw new Error('export: timed out waiting for a page to render')
    }
    await nextFrame()
  }
}

export const captureCalendarPage: CapturePageFn = async (input) => {
  // Pre-decode the photo so its bitmap is warm and the component's own loader
  // resolves promptly. If the decode fails, we do NOT fail the whole export
  // over one bad image: the url is still passed to the page, so `ImageFrame`
  // mounts and tries to load it like normal (it may end up broken). We simply
  // set `expectImage = false` so `waitForStage` doesn't block on an `Image`
  // node that may never appear — the page is snapshotted whenever the Stage is
  // ready instead.
  let expectImage = false
  if (input.entry) {
    try {
      await decodeImage(input.entry.url)
      expectImage = true
    } catch {
      expectImage = false
    }
  }

  const container = document.createElement('div')
  container.style.cssText =
    'position:fixed;left:-100000px;top:0;width:0;height:0;overflow:hidden;pointer-events:none;'
  document.body.appendChild(container)

  const root = createRoot(container)
  const stageRef = createRef<Konva.Stage>()

  try {
    root.render(
      createElement(
        ThemeProvider,
        { theme: input.theme },
        pageElement(input, stageRef),
      ),
    )
    const stage = await waitForStage(stageRef, expectImage)
    // Force a synchronous redraw so the very latest scene is on the canvas
    // before we serialize it.
    stage.draw()
    return stage.toDataURL({ mimeType: 'image/png', pixelRatio: 1 })
  } finally {
    // Dispose this page's root + container before the next page so 13 huge
    // canvases never live at once.
    root.unmount()
    container.remove()
  }
}
