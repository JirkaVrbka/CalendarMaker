/**
 * PDF export orchestration. Walks the 13 calendar pages in order, captures each
 * one as a high-resolution PNG (via the injectable page-capture), places it
 * full-bleed on an A4 page of a single jsPDF document, reports progress, then
 * saves the file. Generation is strictly sequential and each offscreen render is
 * disposed by the capture before the next starts, so memory stays bounded.
 *
 * The run is READ-ONLY: it only reads the project and image map and never
 * touches the store, so it cannot trigger autosave.
 *
 * The page capture is a dependency (default: the real offscreen capture) so the
 * orchestration can be unit-tested with jsPDF mocked and capture stubbed — no
 * real canvas needed.
 */
import { jsPDF } from 'jspdf'
import type { Theme } from '@mui/material/styles'

import type { CalendarProject, ImageEntry } from '../../types/calendar'
import { captureCalendarPage } from './captureCalendarPage'
import type { CapturePageFn } from './captureCalendarPage'
import {
  computeExportPixelSize,
  EXPORT_DPI,
  pdfFilename,
} from './exportGeometry'

/** Progress of a running export, `current` of `total` pages rendered. */
export interface ExportProgress {
  readonly current: number
  readonly total: number
}

export interface ExportOptions {
  /** MUI theme to render the pages with (WYSIWYG with the editor). */
  readonly theme: Theme
  /** Called after each page is placed, for a progress indicator. */
  readonly onProgress?: (progress: ExportProgress) => void
  /** Injectable page capture; defaults to the real offscreen renderer. */
  readonly capture?: CapturePageFn
  /** Print resolution; defaults to 300 DPI. */
  readonly dpi?: number
}

/**
 * Export the whole calendar to a single print-ready A4 PDF and download it.
 * Resolves once the file has been handed to the browser's save flow.
 */
export async function exportCalendarPdf(
  project: CalendarProject,
  images: Readonly<Record<number, ImageEntry>>,
  options: ExportOptions,
): Promise<void> {
  const {
    theme,
    onProgress,
    capture = captureCalendarPage,
    dpi = EXPORT_DPI,
  } = options

  const size = computeExportPixelSize(dpi)
  const { widthMm, heightMm } = project.pageSize

  // Wait for webfonts so exported text matches the screen (guarded: absent in
  // some environments, and a rejection must not abort the export).
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    try {
      await document.fonts.ready
    } catch {
      /* fonts API unavailable — fall through */
    }
  }

  const pdf = new jsPDF({ format: 'a4', orientation: 'portrait', unit: 'mm' })
  const total = project.pages.length

  for (let pageIndex = 0; pageIndex < total; pageIndex++) {
    const dataUrl = await capture({
      project,
      pageIndex,
      entry: images[pageIndex],
      size,
      theme,
    })
    // jsPDF starts with one page already; add a new one before every page
    // after the first.
    if (pageIndex > 0) pdf.addPage()
    pdf.addImage(dataUrl, 'PNG', 0, 0, widthMm, heightMm)
    onProgress?.({ current: pageIndex + 1, total })
  }

  pdf.save(pdfFilename(project.title))
}
