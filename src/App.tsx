import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined'
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined'
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import TextFormatOutlinedIcon from '@mui/icons-material/TextFormatOutlined'
import TitleOutlinedIcon from '@mui/icons-material/TitleOutlined'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import CssBaseline from '@mui/material/CssBaseline'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Toolbar from '@mui/material/Toolbar'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { ThemeProvider } from '@mui/material/styles'

import { createAppTheme } from './app/theme'
import type { ThemeMode } from './app/theme'
import { loadCalendarFonts } from './app/fonts'
import { useProjectStore } from './app/store'
import { BrandMark } from './components/BrandMark'
import { Field } from './components/Field'
import { SegmentedToggle } from './components/SegmentedToggle'
import { SelectField } from './components/SelectField'
import { TextInput } from './components/TextInput'
import { PageNavigator } from './features/calendar/PageNavigator'
import { ControlsPanel } from './features/controls/ControlsPanel'
import type { ControlsSection } from './features/controls/ControlsPanel'
import { ColorControls } from './features/controls/ColorControls'
import { FontControls } from './features/controls/FontControls'
import { ImageControls } from './features/controls/ImageControls'
import { LayoutPicker } from './features/controls/LayoutPicker'
import { CoverPageCanvas } from './features/editor/CoverPageCanvas'
import { MonthPageCanvas } from './features/editor/MonthPageCanvas'
import { useFileDrop } from './features/editor/useFileDrop'
import { ExportButton } from './features/export/ExportButton'
import {
  DEFAULT_EXPORT_QUALITY,
  type ExportQuality,
} from './features/export/exportGeometry'
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

  // Export quality is a transient UI choice (not persisted with the project):
  // it only affects the next PDF export's DPI + JPEG quality.
  const [exportQuality, setExportQuality] = useState<ExportQuality>(
    DEFAULT_EXPORT_QUALITY,
  )

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

  // Label for the stage toolbar's page indicator: "Cover" on the cover page,
  // otherwise the active month's localized name.
  const pageLabel =
    activePage.kind === 'cover'
      ? strings.coverLabel
      : getMonthName(activePage.year, activePage.month, language)

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

  // Drag-and-drop an image file from the OS onto the page preview → set the
  // active page's photo via the same upload path as the Upload button.
  const { isDragging, dropHandlers } = useFileDrop(handleUpload)

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

  // The controls, grouped into collapsible sections for the right-hand panel.
  // Content reuses the exact same field/control JSX and store wiring as before;
  // only the layout (vertical stack inside a panel) changed.
  const sections: ControlsSection[] = [
    {
      id: 'layout',
      title: strings.sectionLayout,
      icon: <GridViewOutlinedIcon fontSize="small" />,
      defaultOpen: false,
      content: (
        <LayoutPicker
          activeLayout={project.layout}
          onSelect={setLayout}
          language={language}
          groupLabel={strings.layoutLabel}
          year={previewMonth.year}
          month={previewMonth.month}
          weekStart={project.weekStart}
          title={project.title}
          subtitle={project.subtitle}
          style={project.style}
          imageUrl={previewEntry?.url}
          imageTransform={previewEntry?.transform}
        />
      ),
    },
    {
      id: 'page-text',
      title: strings.sectionPageText,
      icon: <TitleOutlinedIcon fontSize="small" />,
      defaultOpen: false,
      content: (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Field label={strings.titleLabel} htmlFor="field-title">
            <TextInput
              id="field-title"
              value={project.title}
              onChange={setTitle}
            />
          </Field>
          <Field label={strings.subtitleLabel} htmlFor="field-subtitle">
            <TextInput
              id="field-subtitle"
              value={project.subtitle}
              onChange={setSubtitle}
            />
          </Field>
        </Box>
      ),
    },
    {
      id: 'colors',
      title: strings.sectionColors,
      icon: <PaletteOutlinedIcon fontSize="small" />,
      defaultOpen: false,
      content: (
        <ColorControls
          textColor={project.style.textColor}
          saturdayColor={project.style.saturdayColor}
          sundayColor={project.style.sundayColor}
          backgroundColor={project.style.backgroundColor}
          onColorChange={handleColorChange}
          labels={{
            textColorLabel: strings.textColorLabel,
            saturdayColorLabel: strings.saturdayColorLabel,
            sundayColorLabel: strings.sundayColorLabel,
            backgroundColorLabel: strings.backgroundColorLabel,
          }}
        />
      ),
    },
    {
      id: 'typography',
      title: strings.sectionTypography,
      icon: <TextFormatOutlinedIcon fontSize="small" />,
      defaultOpen: false,
      content: (
        <FontControls
          fontFamily={project.style.fontFamily}
          onFontChange={handleFontChange}
          fontScale={project.style.fontScale}
          onFontScaleChange={(scale) => setStyle({ fontScale: scale })}
          labels={{
            fontLabel: strings.fontLabel,
            fontSizeLabel: strings.fontSizeLabel,
          }}
        />
      ),
    },
    {
      id: 'photo',
      title: strings.sectionPhoto,
      icon: <PhotoCameraOutlinedIcon fontSize="small" />,
      defaultOpen: false,
      content: (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
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
            dragHint={strings.imageDragHint}
          />
        </Box>
      ),
    },
    {
      id: 'calendar',
      title: strings.sectionCalendar,
      icon: <CalendarMonthOutlinedIcon fontSize="small" />,
      defaultOpen: false,
      content: (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Field label={strings.startMonthLabel} htmlFor="field-start-month">
            <SelectField
              id="field-start-month"
              value={project.startMonth}
              onChange={(v) => setStart(Number(v), project.startYear)}
            >
              {MONTH_INDEXES.map((m) => (
                <option key={m} value={m}>
                  {getMonthName(project.startYear, m, language)}
                </option>
              ))}
            </SelectField>
          </Field>
          <Field label={strings.startYearLabel} htmlFor="field-start-year">
            <SelectField
              id="field-start-year"
              value={project.startYear}
              onChange={(v) => setStart(project.startMonth, Number(v))}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </SelectField>
          </Field>
          <Field label={strings.languageLabel} htmlFor="field-language">
            <SelectField
              id="field-language"
              value={language}
              onChange={(v) => setLanguage(v as Language)}
            >
              <option value="en">{getStrings('en').languageName}</option>
              <option value="cs">{getStrings('cs').languageName}</option>
            </SelectField>
          </Field>
          <Field label={strings.exportQualityLabel} htmlFor="field-export-quality">
            <SelectField
              id="field-export-quality"
              value={exportQuality}
              onChange={(v) => setExportQuality(v as ExportQuality)}
            >
              <option value="small">{strings.exportQualitySmall}</option>
              <option value="balanced">{strings.exportQualityBalanced}</option>
              <option value="max">{strings.exportQualityMax}</option>
            </SelectField>
          </Field>
          {/* Muted info hint: the fixed calendar conventions + export format. */}
          <Stack
            direction="row"
            spacing={0.75}
            sx={{ alignItems: 'flex-start', color: 'text.secondary' }}
          >
            <InfoOutlinedIcon fontSize="small" aria-hidden="true" sx={{ mt: '2px' }} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {strings.calendarInfo}
            </Typography>
          </Stack>
        </Box>
      ),
    },
  ]

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
      <Box
        sx={(theme) => ({
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          // Warm paper canvas with a faint accent radial tint bleeding in from
          // the top-right, matching the mockup's body background.
          backgroundColor: theme.palette.background.default,
          backgroundImage:
            'radial-gradient(1200px 600px at 70% -10%, rgba(30,58,95,0.05), transparent 60%)',
        })}
      >
        <AppBar
          position="static"
          sx={(theme) => ({
            // Translucent chrome surface with a slight saturation/blur so the
            // paper tint shows through, matching the mockup's .topbar. The
            // hairline bottom border still comes from the theme's MuiAppBar.
            backgroundColor: `color-mix(in srgb, ${theme.tokens.surface} 86%, transparent)`,
            backdropFilter: 'saturate(1.2) blur(8px)',
          })}
        >
          <Toolbar sx={{ gap: 1.5 }}>
            {/* LEFT: brand cluster — mark + two-tone wordmark + subtitle. */}
            <Box
              component="h1"
              sx={{ display: 'flex', alignItems: 'center', gap: 1.25, m: 0 }}
            >
              <BrandMark />
              <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <Typography
                  component="span"
                  variant="h6"
                  sx={{ lineHeight: 1.1, color: 'text.primary' }}
                >
                  Calendar
                  <Box
                    component="span"
                    sx={{ fontWeight: 400, color: 'text.secondary' }}
                  >
                    Maker
                  </Box>
                </Typography>
                <Typography
                  component="span"
                  variant="caption"
                  sx={{ color: 'text.secondary', lineHeight: 1.1 }}
                >
                  {strings.appSubtitle}
                </Typography>
              </Box>
            </Box>

            {/* CENTER: autosave doc-crumb, centered via flexible spacers. */}
            <Box sx={{ flexGrow: 1 }} />
            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center',
                gap: 1,
                color: 'text.secondary',
                minWidth: 0,
              }}
            >
              <Box
                aria-hidden="true"
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: 'success.main',
                  flex: 'none',
                }}
              />
              <Typography
                component="span"
                variant="body2"
                noWrap
                sx={{ color: 'text.secondary' }}
              >
                {project.title && (
                  <Box
                    component="b"
                    sx={{ color: 'text.primary', fontWeight: 600 }}
                  >
                    {project.title}{' '}
                  </Box>
                )}
                · {strings.savedLocally}
              </Typography>
            </Box>
            <Box sx={{ flexGrow: 1 }} />

            {/* RIGHT: language toggle, theme, reset, export. */}
            <SegmentedToggle
              ariaLabel={strings.toggleLanguage}
              options={[
                { value: 'en', label: 'EN' },
                { value: 'cs', label: 'CZ' },
              ]}
              value={language}
              onChange={(v) => setLanguage(v as Language)}
            />
            <Tooltip title={strings.toggleTheme}>
              <IconButton
                color="inherit"
                aria-label={strings.toggleTheme}
                onClick={() =>
                  setMode(activeMode === 'dark' ? 'light' : 'dark')
                }
              >
                {activeMode === 'dark' ? (
                  <LightModeOutlinedIcon />
                ) : (
                  <DarkModeOutlinedIcon />
                )}
              </IconButton>
            </Tooltip>
            <Tooltip title={strings.newReset}>
              <IconButton
                color="inherit"
                aria-label={strings.newReset}
                onClick={handleReset}
              >
                <RestartAltIcon />
              </IconButton>
            </Tooltip>
            <ExportButton
              project={project}
              images={images}
              quality={exportQuality}
              labels={{
                exportPdf: strings.exportPdf,
                exportError: strings.exportError,
                progress: strings.exportProgress,
              }}
            />
          </Toolbar>
        </AppBar>

        <Box
          component="main"
          sx={{ flexGrow: 1, minHeight: 0, display: 'flex' }}
        >
          {/* Thumbnail navigator rail */}
          <Box
            sx={(theme) => ({
              width: theme.tokens.layout.railWidth,
              flexShrink: 0,
              borderRight: '1px solid',
              borderColor: 'divider',
              bgcolor: theme.tokens.surface,
              minHeight: 0,
              overflowY: 'auto',
            })}
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
              railTitle={strings.pagesLabel}
            />
          </Box>

          <Divider orientation="vertical" flexItem />

          {/* Active page, fitted to the available space, floating on the paper
              canvas with a soft accent glow and a faint grid texture behind it. */}
          <Box
            sx={(theme) => ({
              position: 'relative',
              flexGrow: 1,
              minWidth: 0,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              // Accent radial glow spilling down from the top of the stage. The
              // column is otherwise transparent so the paper canvas (set on the
              // app root) shows through, matching the mockup's .stage.
              backgroundImage: `radial-gradient(900px 500px at 50% 0%, color-mix(in srgb, ${theme.palette.primary.main} 5%, transparent), transparent 70%)`,
            })}
          >
            {/* Decorative 28px grid texture behind the page: a line grid masked
                to a soft central ellipse, dimmed and non-interactive. Purely
                presentational (aria-hidden), positioned below the page content. */}
            <Box
              aria-hidden="true"
              sx={(theme) => ({
                position: 'absolute',
                inset: 0,
                zIndex: 0,
                pointerEvents: 'none',
                opacity: 0.5,
                backgroundImage: `linear-gradient(${theme.tokens.hairline2} 1px, transparent 1px), linear-gradient(90deg, ${theme.tokens.hairline2} 1px, transparent 1px)`,
                backgroundSize: '28px 28px',
                maskImage:
                  'radial-gradient(ellipse 70% 70% at 50% 42%, #000 35%, transparent 78%)',
                WebkitMaskImage:
                  'radial-gradient(ellipse 70% 70% at 50% 42%, #000 35%, transparent 78%)',
              })}
            />
            {/* Stage toolbar: page indicator above the canvas. */}
            <Box
              sx={{
                position: 'relative',
                zIndex: 1,
                flexShrink: 0,
                px: { xs: 2, md: 3 },
                py: 1.5,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {strings.pageIndicator(
                  activePageIndex + 1,
                  project.pages.length,
                  pageLabel,
                )}
              </Typography>
            </Box>

            {/* Measured canvas area. The ResizeObserver tracks this box's size
                (see `ref`) so the A4 sheet fits the remaining space. */}
            <Box
              ref={ref}
              sx={{
                position: 'relative',
                zIndex: 1,
                flexGrow: 1,
                minHeight: 0,
                p: { xs: 2, md: 4 },
                pt: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Floating sheet wrapper: shrink-wraps the canvas and carries the
                  page drop shadow so the A4 sheet floats above the backdrop.
                  Also the drop target for dragging an image file in from the OS
                  (positioned so the drop overlay can cover exactly this sheet). */}
              <Box
                {...dropHandlers}
                sx={(theme) => ({
                  position: 'relative',
                  boxShadow: theme.tokens.shadow.page,
                  lineHeight: 0,
                })}
              >
                {/* Drop overlay: shown only while an image file is dragged over
                    the sheet. Non-interactive so it never swallows the drop. */}
                {isDragging && (
                  <Box
                    aria-hidden="true"
                    sx={(theme) => ({
                      position: 'absolute',
                      inset: 0,
                      zIndex: 2,
                      pointerEvents: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px dashed',
                      borderColor: 'primary.main',
                      borderRadius: `${theme.tokens.radius.md}px`,
                      backgroundColor: theme.tokens.accentTint,
                    })}
                  >
                    <Typography
                      variant="h6"
                      sx={{ color: 'primary.main', fontWeight: 600 }}
                    >
                      {strings.dropPhotoHere}
                    </Typography>
                  </Box>
                )}
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
                          title={project.title}
                          subtitle={project.subtitle}
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

          {/* Right-hand collapsible controls panel */}
          <Box
            sx={(theme) => ({
              width: theme.tokens.layout.panelWidth,
              flexShrink: 0,
              borderLeft: '1px solid',
              borderColor: 'divider',
              bgcolor: theme.tokens.surface,
            })}
          >
            <ControlsPanel
              ariaLabel={strings.controlsPanelLabel}
              sections={sections}
              head={
                <>
                  {/* Active page label in the display (Fraunces) voice. */}
                  <Typography
                    component="h2"
                    variant="h6"
                    sx={{
                      m: 0,
                      fontSize: '1rem',
                      fontWeight: 600,
                      letterSpacing: '-0.01em',
                      lineHeight: 1.2,
                      color: 'text.primary',
                    }}
                  >
                    {pageLabel}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}
                  >
                    {strings.panelEditingNote(
                      activePageIndex + 1,
                      project.pages.length,
                    )}
                  </Typography>
                </>
              }
            />
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  )
}

export default App
