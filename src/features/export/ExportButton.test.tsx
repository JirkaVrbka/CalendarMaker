import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ThemeProvider } from '@mui/material/styles'

import { createAppTheme } from '../../app/theme'
import { A4_PORTRAIT } from '../../lib/page'
import { buildProjectPages } from '../../lib/projectPages'
import { DEFAULT_STYLE, MONDAY } from '../../types/calendar'
import type { CalendarProject } from '../../types/calendar'

// Mock the orchestration so the UI test never touches jsPDF or a real canvas.
vi.mock('./exportCalendarPdf', () => ({ exportCalendarPdf: vi.fn() }))

import { exportCalendarPdf } from './exportCalendarPdf'
import { ExportButton } from './ExportButton'

const mockedExport = vi.mocked(exportCalendarPdf)

const labels = {
  exportPdf: 'Export PDF',
  exportError: 'PDF export failed. Please try again.',
  progress: (current: number, total: number) => `Page ${current} / ${total}`,
}

function makeProject(): CalendarProject {
  return {
    title: 'My Calendar',
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

function renderButton() {
  const project = makeProject()
  const images = {}
  render(
    <ThemeProvider theme={createAppTheme('light')}>
      <ExportButton
        project={project}
        images={images}
        labels={labels}
        quality="balanced"
      />
    </ThemeProvider>,
  )
  return { project, images }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ExportButton', () => {
  it('runs the export with the current project and images on click', async () => {
    mockedExport.mockResolvedValue(undefined)
    const { project, images } = renderButton()

    await userEvent.click(screen.getByRole('button', { name: /export pdf/i }))

    expect(mockedExport).toHaveBeenCalledTimes(1)
    expect(mockedExport).toHaveBeenCalledWith(
      project,
      images,
      expect.objectContaining({
        // The export must be forced to light paper even in dark mode, so the
        // theme handed to the exporter is always a light-mode theme.
        theme: expect.objectContaining({
          palette: expect.objectContaining({ mode: 'light' }),
        }),
        // The chosen quality preset ("balanced") drives DPI + JPEG quality.
        dpi: 220,
        jpegQuality: 0.9,
      }),
    )
  })

  it('shows a per-page progress label and disables the button while busy', async () => {
    // Report progress, then never resolve so the busy state stays observable.
    mockedExport.mockImplementation((_project, _images, options) => {
      options.onProgress?.({ current: 4, total: 13 })
      return new Promise<void>(() => {})
    })
    renderButton()

    await userEvent.click(screen.getByRole('button', { name: /export pdf/i }))

    expect(await screen.findByText('Page 4 / 13')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /page 4 \/ 13/i })).toBeDisabled()
  })

  it('surfaces a friendly error when the export fails', async () => {
    mockedExport.mockRejectedValue(new Error('boom'))
    renderButton()

    await userEvent.click(screen.getByRole('button', { name: /export pdf/i }))

    expect(
      await screen.findByText('PDF export failed. Please try again.'),
    ).toBeInTheDocument()
    // The button returns to its idle, enabled state afterwards.
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /export pdf/i })).toBeEnabled(),
    )
  })
})
