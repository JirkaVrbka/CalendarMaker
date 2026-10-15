import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ThemeProvider } from '@mui/material/styles'

import { createAppTheme } from '../../app/theme'
import { ControlsPanel } from './ControlsPanel'
import type { ControlsSection } from './ControlsPanel'

function renderPanel(sections: readonly ControlsSection[]) {
  return render(
    <ThemeProvider theme={createAppTheme('light')}>
      <ControlsPanel ariaLabel="Controls" sections={sections} />
    </ThemeProvider>,
  )
}

describe('ControlsPanel', () => {
  it('renders a named region containing every section as an expanded, labelled header with its content visible', () => {
    renderPanel([
      { id: 'page-text', title: 'Page text', content: <div>PT</div> },
      { id: 'style', title: 'Style', content: <div>ST</div> },
    ])

    expect(screen.getByRole('region', { name: /Controls/ })).toBeInTheDocument()

    const pageTextHeader = screen.getByRole('button', { name: /Page text/ })
    const styleHeader = screen.getByRole('button', { name: /Style/ })
    expect(pageTextHeader).toHaveAttribute('aria-expanded', 'true')
    expect(styleHeader).toHaveAttribute('aria-expanded', 'true')

    expect(screen.getByText('PT')).toBeInTheDocument()
    expect(screen.getByText('ST')).toBeInTheDocument()
  })

  it('toggles each section independently when its header is clicked', () => {
    renderPanel([
      { id: 'page-text', title: 'Page text', content: <div>PT</div> },
      { id: 'style', title: 'Style', content: <div>ST</div> },
    ])

    const pageTextHeader = screen.getByRole('button', { name: /Page text/ })
    const styleHeader = screen.getByRole('button', { name: /Style/ })

    fireEvent.click(pageTextHeader)

    expect(pageTextHeader).toHaveAttribute('aria-expanded', 'false')
    expect(styleHeader).toHaveAttribute('aria-expanded', 'true')
  })

  it('keeps a section mounted and its toggled state when only the title changes (stable id)', () => {
    // Model a language switch: the localized title changes but the section id
    // is constant. Keying on id (not title) must NOT remount the section, so the
    // user's manual collapse survives the language change.
    const { rerender } = renderPanel([
      { id: 'page-text', title: 'Page text', content: <div>PT</div> },
    ])

    // User collapses the section.
    const header = screen.getByRole('button', { name: /Page text/ })
    fireEvent.click(header)
    expect(header).toHaveAttribute('aria-expanded', 'false')

    // Re-render with a different (translated) title but the same id.
    rerender(
      <ThemeProvider theme={createAppTheme('light')}>
        <ControlsPanel
          ariaLabel="Controls"
          sections={[{ id: 'page-text', title: 'Text stránky', content: <div>PT</div> }]}
        />
      </ThemeProvider>,
    )

    // Same element, same collapsed state — no remount reset it back to expanded.
    const renamedHeader = screen.getByRole('button', { name: /Text stránky/ })
    expect(renamedHeader).toHaveAttribute('aria-expanded', 'false')
  })
})
