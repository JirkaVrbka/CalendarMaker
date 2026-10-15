/**
 * "Export PDF" toolbar control. Runs the (sequential, read-only) PDF export for
 * the current project + photos, showing a per-page progress label and a busy
 * state while it works, and a dismissible error if it fails. All copy is passed
 * in already-localized via `labels`.
 */
import { useMemo, useState } from 'react'

import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Snackbar from '@mui/material/Snackbar'
import Tooltip from '@mui/material/Tooltip'

import { createAppTheme } from '../../app/theme'
import type { CalendarProject, ImageEntry } from '../../types/calendar'
import { exportCalendarPdf } from './exportCalendarPdf'
import type { ExportProgress } from './exportCalendarPdf'

export interface ExportButtonLabels {
  readonly exportPdf: string
  readonly exportError: string
  readonly progress: (current: number, total: number) => string
}

export interface ExportButtonProps {
  readonly project: CalendarProject
  readonly images: Readonly<Record<number, ImageEntry>>
  readonly labels: ExportButtonLabels
}

export function ExportButton({ project, images, labels }: ExportButtonProps) {
  // The PDF must always render on light/white paper, regardless of the app's
  // on-screen light/dark theme — so capture with a forced-light theme rather
  // than the active one (built once; the editor's own theme is unaffected).
  const exportTheme = useMemo(() => createAppTheme('light'), [])
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<ExportProgress | null>(null)
  const [errorOpen, setErrorOpen] = useState(false)

  const handleExport = async () => {
    if (busy) return
    setErrorOpen(false)
    setProgress(null)
    setBusy(true)
    try {
      await exportCalendarPdf(project, images, {
        theme: exportTheme,
        onProgress: setProgress,
      })
    } catch {
      setErrorOpen(true)
    } finally {
      setBusy(false)
      setProgress(null)
    }
  }

  const label =
    busy && progress
      ? labels.progress(progress.current, progress.total)
      : labels.exportPdf

  return (
    <>
      <Tooltip title={labels.exportPdf}>
        {/* span wrapper so the tooltip still works while the button is disabled */}
        <span>
          <Button
            color="inherit"
            size="small"
            startIcon={
              busy ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <PictureAsPdfIcon />
              )
            }
            onClick={handleExport}
            disabled={busy}
            aria-busy={busy}
          >
            {label}
          </Button>
        </span>
      </Tooltip>
      <Snackbar
        open={errorOpen}
        autoHideDuration={6000}
        onClose={() => setErrorOpen(false)}
      >
        <Alert
          severity="error"
          variant="filled"
          onClose={() => setErrorOpen(false)}
        >
          {labels.exportError}
        </Alert>
      </Snackbar>
    </>
  )
}
