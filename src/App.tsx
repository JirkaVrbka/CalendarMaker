import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import TranslateIcon from '@mui/icons-material/Translate'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import CssBaseline from '@mui/material/CssBaseline'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Toolbar from '@mui/material/Toolbar'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { ThemeProvider } from '@mui/material/styles'

import { createAppTheme } from './app/theme'
import type { ThemeMode } from './app/theme'
import { loadCalendarFonts } from './app/fonts'
import { useProjectStore } from './app/store'
import { PageNavigator } from './features/calendar/PageNavigator'
import { ImageControls } from './features/controls/ImageControls'
import { LayoutPicker } from './features/controls/LayoutPicker'
import { StyleControls } from './features/controls/StyleControls'
import { CoverPageCanvas } from './features/editor/CoverPageCanvas'
import { MonthPageCanvas } from './features/editor/MonthPageCanvas'
import { ExportButton } from './features/export/ExportButton'
import {
  clearAll,
  deleteImage,
  loadAll,
  putImage,
  putImageTransform,
  saveProjectConfig,
} from './features/storage/service'
import { assertNever } from './lib/assertNever'
import { getMonthName } from './lib/calendar'
import { A4_PORTRAIT, fitPageSize } from './lib/page'
import { getStrings } from './i18n/strings'
import { DEFAULT_IMAGE_TRANSFORM } from './types/calendar'
import type { ImageTransform, Language } from './types/calendar'

/** Tracks a DOM element's content-box size via ResizeObserver. */
function useElementSize() {
  const [size, setSize] = useState({ width: 0, height: 0 })
  const observerRef = useRef<ResizeObserver | null>(null)
  const ref = useCallback((el: HTMLDivElement | null) => {
    observerRef.current?.disconnect()
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect
      if (rect) setSize({ width: rect.width, height: rect.height })
    })
    ro.observe(el)
    observerRef.current = ro
  }, [])
  return { ref, size }
}

const MONTH_INDEXES = Array.from({ length: 12 }, (_, i) => i)

/** Autosave debounce (ms): collapses rapid edits (typing, drag/zoom) into one write. */
const SAVE_DEBOUNCE_MS = 400

/** Year choices for the start-year selector, always including the current one. */
function useStartYearOptions(startYear: number, baseYear: number): number[] {
  return useMemo(() => {
    const years = new Set<number>()
    for (let y = baseYear - 1; y <= baseYear + 6; y++) years.add(y)
    years.add(startYear)
    return [...years].sort((a, b) => a - b)
  }, [startYear, baseYear])
}

function App() {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')
  const [mode, setMode] = useState<ThemeMode | null>(null)
  // Captured once at mount so render stays pure (no `new Date()` during render).
  const [baseYear] = useState(() => new Date().getFullYear())
  // Bumped ONCE after the initial font preload resolves. It feeds the canvas
  // `key`s to force a single remount + redraw at startup — Konva paints text
  // with the font the browser has ALREADY loaded and won't repaint when one
  // arrives late. It is deliberately NOT bumped on a later font switch: that
  // re-renders via the changed `fontFamily` prop (the family is already loaded),
  // so remounting would only cause flicker and interrupt an in-progress drag.
  const [fontEpoch, setFontEpoch] = useState(0)

  const project = useProjectStore((s) => s.project)
  const activePageIndex = useProjectStore((s) => s.activePageIndex)
  const setTitle = useProjectStore((s) => s.setTitle)
  const setSubtitle = useProjectStore((s) => s.setSubtitle)
  const setTitlePosition = useProjectStore((s) => s.setTitlePosition)
  const setSubtitlePosition = useProjectStore((s) => s.setSubtitlePosition)
  const setStart = useProjectStore((s) => s.setStart)
  const selectPage = useProjectStore((s) => s.selectPage)
  const setLanguage = useProjectStore((s) => s.setLanguage)
  const setStyle = useProjectStore((s) => s.setStyle)
  const setLayout = useProjectStore((s) => s.setLayout)
  const images = useProjectStore((s) => s.images)
  const setImage = useProjectStore((s) => s.setImage)
  const setImageTransform = useProjectStore((s) => s.setImageTransform)
  const removeImage = useProjectStore((s) => s.removeImage)
  const hydrated = useProjectStore((s) => s.hydrated)
  const hydrate = useProjectStore((s) => s.hydrate)
  const resetProject = useProjectStore((s) => s.resetProject)

  const language = project.language

  // Initial theme follows the OS preference until the user picks one.
  const activeMode: ThemeMode = mode ?? (prefersDark ? 'dark' : 'light')
  const theme = useMemo(() => createAppTheme(activeMode), [activeMode])

  const strings = getStrings(language)
  // The toggle switches to the *other* language, so label it with that target.
  const targetLanguage: Language = language === 'en' ? 'cs' : 'en'

  // Keep the document's lang attribute in sync for a11y and correct hyphenation.
  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  // Preload the curated calendar fonts once, then bump `fontEpoch` so the
  // canvases remount and redraw with the now-loaded fonts (the Konva font-load
  // trap). Guarded + never-throwing, so a missing Font Loading API (jsdom) or a
  // font failure is a no-op.
  useEffect(() => {
    let cancelled = false
    void loadCalendarFonts().then(() => {
      if (!cancelled) setFontEpoch((e) => e + 1)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Boot: load persisted data once, then hydrate the store (which flips
  // `hydrated` → true). On any load error, hydrate with empty data so we fall
  // back to a fresh default calendar rather than getting stuck on the loader.
  useEffect(() => {
    let cancelled = false
    loadAll()
      .then((data) => {
        if (!cancelled) hydrate(data)
      })
      .catch(() => {
        if (!cancelled) hydrate({ config: null, images: [] })
      })
    return () => {
      cancelled = true
    }
  }, [hydrate])

  // Set true for the next store change so the autosave subscription skips it
  // (and self-clears). Used by Reset, which wipes storage itself — re-saving the
  // default would be a pointless wipe-then-repopulate.
  const suppressSaveOnce = useRef(false)

  // Debounced autosave of the serializable project config. Gated behind
  // `hydrated` (and the hydrate transition is skipped) so the default starting
  // state can never overwrite stored data on boot. Images are NOT saved here —
  // they persist via the per-slot handlers below.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const unsubscribe = useProjectStore.subscribe((state, prev) => {
      if (!state.hydrated || !prev.hydrated) return
      if (state.project === prev.project) return
      if (suppressSaveOnce.current) {
        suppressSaveOnce.current = false
        return
      }
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        void saveProjectConfig(useProjectStore.getState().project)
      }, SAVE_DEBOUNCE_MS)
    })
    return () => {
      if (timer) clearTimeout(timer)
      unsubscribe()
    }
  }, [])

  // Per-slot debounce timers for transform ticks (drag/zoom fire rapidly). Keyed
  // by slot so editing slot A then switching to slot B within the debounce
  // window never drops A's pending save — each slot's save is independent. The
  // Blob is never rewritten here, only the small transform row.
  const transformTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(
    new Map(),
  )

  // Clear ALL pending per-slot transform saves on unmount (mirrors the config
  // timer cleanup above).
  useEffect(() => {
    const timers = transformTimers.current
    return () => {
      for (const id of timers.values()) clearTimeout(id)
      timers.clear()
    }
  }, [])

  const { ref, size } = useElementSize()
  const pageSize = fitPageSize(A4_PORTRAIT, {
    maxWidth: size.width,
    maxHeight: size.height,
  })

  const yearOptions = useStartYearOptions(project.startYear, baseYear)
  const activePage = project.pages[activePageIndex] ?? project.pages[0]

  // Photos are keyed by page slot index (0 = cover, 1..12 = months).
  const activeSlot = activePageIndex
  const activeEntry = images[activeSlot]

  // Picker previews always show a MONTH page: the active one when a month is
  // selected, otherwise the first month page (slot 1) so the cover never blanks
  // the previews.
  const previewSlot = activePage.kind === 'month' ? activePageIndex : 1
  const previewPage = project.pages[previewSlot]
  const previewMonth =
    previewPage.kind === 'month'
      ? previewPage
      : { year: project.startYear, month: project.startMonth }
  const previewEntry = images[previewSlot]

  // Cancel any pending transform save for a slot (so a stale
  // `putImageTransform(oldTransform)` can't land after a new Blob/delete).
  const cancelTransformSave = (slot: number) => {
    const id = transformTimers.current.get(slot)
    if (id !== undefined) {
      clearTimeout(id)
      transformTimers.current.delete(slot)
    }
  }

  // Set/replace the active slot's photo and persist its Blob immediately. Cancel
  // any pending transform save first: otherwise a debounced
  // `putImageTransform(oldTransform)` could land after the new Blob and leave the
  // DB row as newBlob + oldTransform.
  const handleUpload = (file: File) => {
    cancelTransformSave(activeSlot)
    setImage(activeSlot, file)
    void putImage(activeSlot, file, DEFAULT_IMAGE_TRANSFORM)
  }

  // Remove the active slot's photo and delete it from storage immediately. Cancel
  // any pending transform save so it can't resurrect a row after the delete.
  const handleRemove = () => {
    cancelTransformSave(activeSlot)
    removeImage(activeSlot)
    void deleteImage(activeSlot)
  }

  // Update the transform in the store now; persist it (Blob untouched) debounced
  // on this slot's own timer.
  const applyTransform = (transform: ImageTransform) => {
    setImageTransform(activeSlot, transform)
    const slot = activeSlot
    const existing = transformTimers.current.get(slot)
    if (existing !== undefined) clearTimeout(existing)
    transformTimers.current.set(
      slot,
      setTimeout(() => {
        transformTimers.current.delete(slot)
        void putImageTransform(slot, transform)
      }, SAVE_DEBOUNCE_MS),
    )
  }

  // Switch the calendar font: update the style now. The changed `fontFamily`
  // prop re-renders the Konva `<Text>` nodes with the new family WITHOUT a
  // remount (no `fontEpoch` bump), so the switch is flicker-free and never
  // interrupts an in-progress drag. The whole set (both 400 and 700 weights) is
  // preloaded at mount; we still (defensively) request both weights here in case
  // the mount preload had not finished — it normally resolves instantly.
  const handleFontChange = (fontFamily: string) => {
    setStyle({ fontFamily })
    if (typeof document !== 'undefined' && document.fonts?.load) {
      document.fonts.load(`400 1em "${fontFamily}"`).catch(() => {})
      document.fonts.load(`700 1em "${fontFamily}"`).catch(() => {})
    }
  }

  // Patch one calendar color (text / Saturday / Sunday / background).
  const handleColorChange = (
    key: 'textColor' | 'saturdayColor' | 'sundayColor' | 'backgroundColor',
    value: string,
  ) => {
    setStyle({ [key]: value } as Partial<typeof project.style>)
  }

  // New/Reset: confirm, reset the store to a default calendar, wipe storage. The
  // reset's config change must NOT re-save (clearAll already empties the row), so
  // suppress the next autosave tick.
  const handleReset = () => {
    if (!window.confirm(strings.newResetConfirm)) return
    suppressSaveOnce.current = true
    resetProject()
    void clearAll()
  }

  // Brief loading state while the initial load/hydration is in flight.
  if (!hydrated) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <CircularProgress />
          <Typography color="text.secondary">{strings.loading}</Typography>
        </Box>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <AppBar position="static">
          <Toolbar sx={{ gap: 1 }}>
            <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
              {strings.appTitle}
            </Typography>
            <ExportButton
              project={project}
              images={images}
              labels={{
                exportPdf: strings.exportPdf,
                exportError: strings.exportError,
                progress: strings.exportProgress,
              }}
            />
            <Tooltip title={strings.newReset}>
              <Button
                color="inherit"
                size="small"
                startIcon={<RestartAltIcon />}
                onClick={handleReset}
              >
                {strings.newReset}
              </Button>
            </Tooltip>
            <Tooltip title={strings.toggleLanguage}>
              <Button
                color="inherit"
                size="small"
                startIcon={<TranslateIcon />}
                onClick={() => setLanguage(targetLanguage)}
              >
                {getStrings(targetLanguage).languageName}
              </Button>
            </Tooltip>
            <Tooltip title={strings.toggleTheme}>
              <IconButton
                color="inherit"
                aria-label={strings.toggleTheme}
                onClick={() =>
                  setMode(activeMode === 'dark' ? 'light' : 'dark')
                }
              >
                {activeMode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>

        {/* Project controls */}
        <Stack
          direction="row"
          spacing={2}
          sx={{
            px: { xs: 2, md: 3 },
            py: 1.5,
            alignItems: 'center',
            flexWrap: 'wrap',
            bgcolor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <TextField
            label={strings.titleLabel}
            value={project.title}
            onChange={(e) => setTitle(e.target.value)}
            size="small"
            sx={{ minWidth: 220 }}
          />
          <TextField
            label={strings.subtitleLabel}
            value={project.subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            size="small"
            sx={{ minWidth: 220 }}
          />
          <TextField
            select
            label={strings.startMonthLabel}
            value={project.startMonth}
            onChange={(e) => setStart(Number(e.target.value), project.startYear)}
            size="small"
            sx={{ minWidth: 150 }}
          >
            {MONTH_INDEXES.map((m) => (
              <MenuItem key={m} value={m}>
                {getMonthName(project.startYear, m, language)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label={strings.startYearLabel}
            value={project.startYear}
            onChange={(e) => setStart(project.startMonth, Number(e.target.value))}
            size="small"
            sx={{ minWidth: 110 }}
          >
            {yearOptions.map((y) => (
              <MenuItem key={y} value={y}>
                {y}
              </MenuItem>
            ))}
          </TextField>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          <ImageControls
            entry={activeEntry}
            onUpload={handleUpload}
            onRemove={handleRemove}
            onZoom={(scale) =>
              applyTransform({
                ...(activeEntry?.transform ?? DEFAULT_IMAGE_TRANSFORM),
                scale,
              })
            }
            uploadLabel={strings.uploadImage}
            replaceLabel={strings.replaceImage}
            removeLabel={strings.removeImage}
            zoomLabel={strings.zoomLabel}
          />

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          <StyleControls
            style={project.style}
            onFontChange={handleFontChange}
            onColorChange={handleColorChange}
            labels={{
              fontLabel: strings.fontLabel,
              textColorLabel: strings.textColorLabel,
              saturdayColorLabel: strings.saturdayColorLabel,
              sundayColorLabel: strings.sundayColorLabel,
              backgroundColorLabel: strings.backgroundColorLabel,
            }}
          />

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          <LayoutPicker
            activeLayout={project.layout}
            onSelect={setLayout}
            language={language}
            groupLabel={strings.layoutLabel}
            year={previewMonth.year}
            month={previewMonth.month}
            weekStart={project.weekStart}
            style={project.style}
            imageUrl={previewEntry?.url}
            imageTransform={previewEntry?.transform}
          />
        </Stack>

        <Box
          component="main"
          sx={{ flexGrow: 1, minHeight: 0, display: 'flex' }}
        >
          {/* Thumbnail navigator rail */}
          <Box
            sx={{
              width: 128,
              flexShrink: 0,
              borderRight: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.default',
              minHeight: 0,
              overflowY: 'auto',
            }}
          >
            <PageNavigator
              key={`nav-${fontEpoch}`}
              pages={project.pages}
              activeIndex={activePageIndex}
              onSelect={selectPage}
              weekStart={project.weekStart}
              language={language}
              title={project.title}
              subtitle={project.subtitle}
              titlePosition={project.titlePosition}
              subtitlePosition={project.subtitlePosition}
              layout={project.layout}
              style={project.style}
              images={images}
              coverLabel={strings.coverLabel}
              navigatorLabel={strings.navigatorLabel}
            />
          </Box>

          <Divider orientation="vertical" flexItem />

          {/* Active page, fitted to the available space */}
          <Box
            sx={{
              flexGrow: 1,
              minWidth: 0,
              minHeight: 0,
              p: { xs: 2, md: 4 },
              bgcolor: 'background.default',
            }}
          >
            <Box
              ref={ref}
              sx={{
                height: '100%',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {(() => {
                switch (activePage.kind) {
                  case 'cover':
                    return (
                      <CoverPageCanvas
                        key={`cover-${fontEpoch}`}
                        title={project.title}
                        subtitle={project.subtitle}
                        titlePosition={project.titlePosition}
                        subtitlePosition={project.subtitlePosition}
                        size={pageSize}
                        style={project.style}
                        imageUrl={activeEntry?.url}
                        imageTransform={activeEntry?.transform}
                        onTransformChange={applyTransform}
                        onTitleMove={setTitlePosition}
                        onSubtitleMove={setSubtitlePosition}
                      />
                    )
                  case 'month':
                    return (
                      <MonthPageCanvas
                        key={`month-${activePage.year}-${activePage.month}-${fontEpoch}`}
                        year={activePage.year}
                        month={activePage.month}
                        weekStart={project.weekStart}
                        language={language}
                        size={pageSize}
                        style={project.style}
                        layout={project.layout}
                        imageUrl={activeEntry?.url}
                        imageTransform={activeEntry?.transform}
                        onTransformChange={applyTransform}
                      />
                    )
                  default:
                    return assertNever(activePage)
                }
              })()}
            </Box>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  )
}

export default App
