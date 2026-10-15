import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ThemeProvider } from '@mui/material/styles'

import { createAppTheme } from '../../app/theme'
import { MobileEditor } from './MobileEditor'

const labels = {
  appTitle: 'CalendarMaker',
  pages: 'Pages',
  preview: 'Preview',
  edit: 'Edit',
  toggleTheme: 'Toggle light / dark theme',
  newReset: 'New / Reset',
  pageIndicator: (current: number, total: number, label: string) =>
    `Page ${current} / ${total} · ${label}`,
  previewHint: 'Swipe or tap Edit to style this page',
  previous: 'Previous page',
  next: 'Next page',
}

function renderMobile(overrides: Partial<Parameters<typeof MobileEditor>[0]> = {}) {
  return render(
    <ThemeProvider theme={createAppTheme('light')}>
      <MobileEditor
        brand={<span>CalendarMaker brand</span>}
        pageLabel="March"
        pageIndex={4}
        pageTotal={13}
        themeMode="light"
        onToggleTheme={vi.fn()}
        onReset={vi.fn()}
        onPrev={vi.fn()}
        onNext={vi.fn()}
        canPrev
        canNext
        exportNode={<button type="button">Export PDF</button>}
        pagesView={<div>PAGES VIEW</div>}
        previewView={<div>PREVIEW VIEW</div>}
        editView={<div>EDIT VIEW</div>}
        labels={labels}
        {...overrides}
      />
    </ThemeProvider>,
  )
}

describe('MobileEditor', () => {
  it('renders the three bottom-nav tabs with Preview active and the preview view shown by default', () => {
    renderMobile()

    const pagesTab = screen.getByRole('tab', { name: 'Pages' })
    const previewTab = screen.getByRole('tab', { name: 'Preview' })
    const editTab = screen.getByRole('tab', { name: 'Edit' })
    expect(pagesTab).toBeInTheDocument()
    expect(previewTab).toBeInTheDocument()
    expect(editTab).toBeInTheDocument()

    // Preview is the default active view.
    expect(previewTab).toHaveAttribute('aria-selected', 'true')
    expect(pagesTab).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByText('PREVIEW VIEW')).toBeInTheDocument()
    // Only the active view is mounted.
    expect(screen.queryByText('EDIT VIEW')).toBeNull()
    expect(screen.queryByText('PAGES VIEW')).toBeNull()
  })

  it('switches to the Edit and Pages views when their tabs are clicked', () => {
    renderMobile()

    fireEvent.click(screen.getByRole('tab', { name: 'Edit' }))
    expect(screen.getByText('EDIT VIEW')).toBeInTheDocument()
    expect(screen.queryByText('PREVIEW VIEW')).toBeNull()

    fireEvent.click(screen.getByRole('tab', { name: 'Pages' }))
    expect(screen.getByText('PAGES VIEW')).toBeInTheDocument()
    expect(screen.queryByText('EDIT VIEW')).toBeNull()
  })

  it('shows the page indicator and wires the theme and reset controls', () => {
    const onToggleTheme = vi.fn()
    const onReset = vi.fn()
    renderMobile({ onToggleTheme, onReset })

    expect(screen.getByText('Page 4 / 13 · March')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Toggle light / dark theme' }))
    expect(onToggleTheme).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'New / Reset' }))
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it('renders the Preview header prev/next controls and hint, wired to onPrev/onNext', () => {
    const onPrev = vi.fn()
    const onNext = vi.fn()
    renderMobile({ onPrev, onNext })

    // Prev/next buttons present and enabled in the middle of the deck.
    const prev = screen.getByRole('button', { name: 'Previous page' })
    const next = screen.getByRole('button', { name: 'Next page' })
    expect(prev).toBeEnabled()
    expect(next).toBeEnabled()

    fireEvent.click(prev)
    expect(onPrev).toHaveBeenCalledTimes(1)
    fireEvent.click(next)
    expect(onNext).toHaveBeenCalledTimes(1)

    // The muted hint line under the page renders on the Preview view.
    expect(
      screen.getByText('Swipe or tap Edit to style this page'),
    ).toBeInTheDocument()
  })

  it('disables the prev/next controls at the ends of the deck', () => {
    renderMobile({ canPrev: false, canNext: false })
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled()
  })
})
