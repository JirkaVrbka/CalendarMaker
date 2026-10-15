import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ThemeProvider } from '@mui/material/styles'

import { createAppTheme } from '../app/theme'
import { CollapsiblePanelSection } from './CollapsiblePanelSection'

function renderSection(
  overrides: Partial<React.ComponentProps<typeof CollapsiblePanelSection>> = {},
) {
  render(
    <ThemeProvider theme={createAppTheme('light')}>
      <CollapsiblePanelSection title="Colors" {...overrides}>
        <div>BODY</div>
      </CollapsiblePanelSection>
    </ThemeProvider>,
  )
}

describe('CollapsiblePanelSection', () => {
  it('renders open by default with the body visible', () => {
    renderSection()
    const header = screen.getByRole('button', { name: /Colors/ })
    expect(header).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('BODY')).toBeInTheDocument()
  })

  it('collapses when the header button is clicked', () => {
    renderSection()
    const header = screen.getByRole('button', { name: /Colors/ })
    fireEvent.click(header)
    expect(header).toHaveAttribute('aria-expanded', 'false')
  })

  it('starts closed when defaultOpen is false', () => {
    renderSection({ defaultOpen: false })
    const header = screen.getByRole('button', { name: /Colors/ })
    expect(header).toHaveAttribute('aria-expanded', 'false')
  })

  it('links the header to the body via aria-controls / id', () => {
    renderSection()
    const header = screen.getByRole('button', { name: /Colors/ })
    const controlsId = header.getAttribute('aria-controls')
    expect(controlsId).toBeTruthy()
    expect(document.getElementById(controlsId as string)).toBeInTheDocument()
  })

  it('renders the icon in the header when one is passed', () => {
    renderSection({ icon: <span data-testid="section-icon">★</span> })
    const header = screen.getByRole('button', { name: /Colors/ })
    const icon = screen.getByTestId('section-icon')
    expect(icon).toBeInTheDocument()
    expect(header).toContainElement(icon)
  })
})
