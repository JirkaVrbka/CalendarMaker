/**
 * "Export PDF" toolbar control. Runs the (sequential, read-only) PDF export for
 * the current project + photos, showing a per-page progress label and a busy
 * state while it works, and a dismissible error if it fails. All copy is passed
 * in already-localized via `labels`.
 */
import { useMemo, useState } from 'react'

import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
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
            variant="contained"
            color="primary"
            size="small"
            startIcon={
              busy ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <FileDownloadOutlinedIcon />
              )
            }
            onClick={handleExport}
            disabled={busy}
            aria-busy={busy}
            sx={(theme) => ({
              // Vertical accent gradient (accent300 → accent → accent700) with
              // an inner top highlight, matching the mockup's .btn-export. White
              // text stays readable over the dark-blue accent in both themes.
              backgroundImage: `linear-gradient(180deg, ${theme.tokens.accent300} -40%, ${theme.palette.primary.main} 45%, ${theme.tokens.accent700})`,
              border: '1px solid',
              borderColor: theme.tokens.accent700,
              color: '#fff',
              boxShadow: `${theme.tokens.shadow.sm}, inset 0 1px 0 rgba(255,255,255,0.18)`,
              '&:hover': { filter: 'brightness(1.06)' },
              // Keep the disabled (busy) state visually distinct and readable.
              '&.Mui-disabled': {
                backgroundImage: 'none',
                color: theme.palette.action.disabled,
              },
            })}
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
