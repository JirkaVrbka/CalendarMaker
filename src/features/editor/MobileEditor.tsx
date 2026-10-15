/**
 * Mobile editor shell: a self-contained three-view layout for narrow screens.
 *
 * Deliberately dumb — the App composes every piece of content (brand, export
 * button, and the three views) and passes them in as nodes, so this component
 * owns nothing but the active-view state. It renders a compact sticky top bar,
 * a scrollable body showing ONLY the active view, and a fixed bottom tab bar
 * (Pages / Preview / Edit) modelled on mockups/mobile-03-bottom-tabs.html.
 */
import { useState } from 'react'

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined'
import AppBar from '@mui/material/AppBar'
import BottomNavigation from '@mui/material/BottomNavigation'
import BottomNavigationAction from '@mui/material/BottomNavigationAction'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Toolbar from '@mui/material/Toolbar'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

/** The three full-screen views, switched by the bottom tab bar. */
type MobileView = 'pages' | 'preview' | 'edit'

export interface MobileEditorProps {
  /** Brand cluster for the top bar (e.g. <BrandMark/> + wordmark). */
  readonly brand: React.ReactNode
  /** Localized label for the active page (e.g. "March" or the cover label). */
  readonly pageLabel: string
  /** 1-based active page index and total page count, for the page indicator. */
  readonly pageIndex: number
  readonly pageTotal: number
  /** Active theme mode and its toggle, mirrored from the desktop header. */
  readonly themeMode: 'light' | 'dark'
  readonly onToggleTheme: () => void
  /** New/Reset handler (already confirms via the caller). */
  readonly onReset: () => void
  /** Preview prev/next page navigation (shown only on the Preview view). */
  readonly onPrev: () => void
  readonly onNext: () => void
  readonly canPrev: boolean
  readonly canNext: boolean
  /** Export control node (<ExportButton/>), rendered in the top bar. */
  readonly exportNode: React.ReactNode
  /** The three view contents, composed by the caller. */
  readonly pagesView: React.ReactNode
  readonly previewView: React.ReactNode
  readonly editView: React.ReactNode
  /** Localized chrome labels. */
  readonly labels: {
    readonly appTitle: string
    readonly pages: string
    readonly preview: string
    readonly edit: string
    readonly toggleTheme: string
    readonly newReset: string
    readonly pageIndicator: (current: number, total: number, label: string) => string
    /** Muted hint under the page on the Preview view. */
    readonly previewHint: string
    /** Accessible names for the Preview prev/next page controls. */
    readonly previous: string
    readonly next: string
  }
}

export function MobileEditor({
  brand,
  pageLabel,
  pageIndex,
  pageTotal,
  themeMode,
  onToggleTheme,
  onReset,
  onPrev,
  onNext,
  canPrev,
  canNext,
  exportNode,
  pagesView,
  previewView,
  editView,
  labels,
}: MobileEditorProps) {
  // Preview is the default landing view (the mockup's active tab).
  const [view, setView] = useState<MobileView>('preview')

  // Stable ids wiring each tab to its panel for the tablist/tabpanel a11y pair.
  const panelId = (v: MobileView) => `mobile-view-${v}`
  const tabId = (v: MobileView) => `mobile-tab-${v}`

  // Wrap a tab icon in a rounded pill that gets an accent-tint background and
  // accent-colored icon when its tab is active (mockup's `.ico-wrap`).
  const tabIcon = (v: MobileView, icon: React.ReactNode) => (
    <Box
      sx={(theme) => ({
        display: 'grid',
        placeItems: 'center',
        width: 44,
        height: 30,
        borderRadius: 999,
        color: view === v ? 'primary.main' : 'inherit',
        backgroundColor: view === v ? theme.tokens.accentTint : 'transparent',
        transition: 'background-color 180ms ease, color 180ms ease',
      })}
    >
      {icon}
    </Box>
  )

  return (
    <Box
      sx={(theme) => ({
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: theme.palette.background.default,
        backgroundImage:
          'radial-gradient(1200px 600px at 70% -10%, rgba(30,58,95,0.05), transparent 60%)',
      })}
    >
      {/* Compact sticky top bar: brand, then theme, reset and export controls. */}
      <AppBar
        position="sticky"
        sx={(theme) => ({
          backgroundColor: `color-mix(in srgb, ${theme.tokens.surface} 90%, transparent)`,
          backdropFilter: 'saturate(1.2) blur(8px)',
        })}
      >
        <Toolbar sx={{ gap: 1, minHeight: 56 }}>
          {/* LEFT: brand cluster. */}
          <Box
            component="h1"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              m: 0,
              minWidth: 0,
              flexGrow: 1,
            }}
          >
            {brand}
          </Box>

          {/* RIGHT: theme toggle, reset, export. */}
          <Tooltip title={labels.toggleTheme}>
            <IconButton
              color="inherit"
              size="small"
              aria-label={labels.toggleTheme}
              onClick={onToggleTheme}
            >
              {themeMode === 'dark' ? (
                <LightModeOutlinedIcon />
              ) : (
                <DarkModeOutlinedIcon />
              )}
            </IconButton>
          </Tooltip>
          <Tooltip title={labels.newReset}>
            <IconButton
              color="inherit"
              size="small"
              aria-label={labels.newReset}
              onClick={onReset}
            >
              <RestartAltIcon />
            </IconButton>
          </Tooltip>
          {exportNode}
        </Toolbar>
      </AppBar>

      {/* BODY: only the active view is mounted. It fills the space between the
          top bar and the bottom tab bar. Preview gets the full area with no
          scroll so its child stage can measure/fit; Pages and Edit scroll. */}
      <Box sx={{ flexGrow: 1, minHeight: 0, position: 'relative' }}>
        <Box
          role="tabpanel"
          id={panelId(view)}
          aria-labelledby={tabId(view)}
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflowY: view === 'preview' ? 'hidden' : 'auto',
          }}
        >
          {view === 'pages' && pagesView}
          {view === 'preview' && (
            <>
              {/* Preview header: page label on the left, a rounded prev/next
                  stepper pill on the right (mockup's .preview-strip). */}
              <Box
                sx={{
                  flexShrink: 0,
                  px: 2,
                  pt: 1.5,
                  pb: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1,
                }}
              >
                <Typography variant="body2" noWrap sx={{ color: 'text.secondary' }}>
                  {labels.pageIndicator(pageIndex, pageTotal, pageLabel)}
                </Typography>
                <Box
                  sx={(theme) => ({
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.25,
                    flexShrink: 0,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 999,
                    p: 0.25,
                    backgroundColor: theme.tokens.surface,
                    boxShadow: theme.tokens.shadow.sm,
                  })}
                >
                  <IconButton
                    size="small"
                    aria-label={labels.previous}
                    onClick={onPrev}
                    disabled={!canPrev}
                  >
                    <ChevronLeftIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    aria-label={labels.next}
                    onClick={onNext}
                    disabled={!canNext}
                  >
                    <ChevronRightIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
              {previewView}
              {/* Muted hint under the page (mockup's .preview-foot-hint). */}
              <Box
                sx={{
                  flexShrink: 0,
                  px: 2,
                  pt: 1,
                  pb: 1.5,
                  textAlign: 'center',
                }}
              >
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {labels.previewHint}
                </Typography>
              </Box>
            </>
          )}
          {view === 'edit' && editView}
        </Box>
      </Box>

      {/* BOTTOM TAB BAR: a tablist switching the three views. */}
      <BottomNavigation
        component="nav"
        role="tablist"
        aria-label={labels.appTitle}
        showLabels
        value={view}
        onChange={(_event, next: MobileView) => setView(next)}
        sx={(theme) => ({
          flexShrink: 0,
          borderTop: '1px solid',
          borderColor: 'divider',
          backgroundColor: `color-mix(in srgb, ${theme.tokens.surface} 94%, transparent)`,
          backdropFilter: 'saturate(1.2) blur(10px)',
        })}
      >
        <BottomNavigationAction
          value="pages"
          label={labels.pages}
          icon={tabIcon('pages', <GridViewOutlinedIcon />)}
          role="tab"
          id={tabId('pages')}
          aria-selected={view === 'pages'}
          aria-controls={panelId('pages')}
        />
        <BottomNavigationAction
          value="preview"
          label={labels.preview}
          icon={tabIcon('preview', <ImageOutlinedIcon />)}
          role="tab"
          id={tabId('preview')}
          aria-selected={view === 'preview'}
          aria-controls={panelId('preview')}
        />
        <BottomNavigationAction
          value="edit"
          label={labels.edit}
          icon={tabIcon('edit', <TuneOutlinedIcon />)}
          role="tab"
          id={tabId('edit')}
          aria-selected={view === 'edit'}
          aria-controls={panelId('edit')}
        />
      </BottomNavigation>
    </Box>
  )
}
