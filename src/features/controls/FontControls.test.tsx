import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ThemeProvider } from '@mui/material/styles'

import { createAppTheme } from '../../app/theme'
import { DEFAULT_STYLE } from '../../types/calendar'
import { FontControls } from './FontControls'

const labels = {
  fontLabel: 'Font',
  fontSizeLabel: 'Font size',
}

function renderControls(
  overrides: Partial<React.ComponentProps<typeof FontControls>> = {},
  handlers: Partial<{
    onFontChange: (f: string) => void
    onFontScaleChange: (s: number) => void
  }> = {},
) {
  const onFontChange = handlers.onFontChange ?? vi.fn()
  const onFontScaleChange = handlers.onFontScaleChange ?? vi.fn()
  render(
    <ThemeProvider theme={createAppTheme('light')}>
      <FontControls
        fontFamily={DEFAULT_STYLE.fontFamily}
        onFontChange={onFontChange}
        fontScale={DEFAULT_STYLE.fontScale}
        onFontScaleChange={onFontScaleChange}
        labels={labels}
        {...overrides}
      />
    </ThemeProvider>,
  )
  return { onFontChange, onFontScaleChange }
}

describe('FontControls', () => {
  it('renders a font pick list with one button per curated font', () => {
    renderControls()
    expect(screen.getByRole('button', { name: 'Nunito' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Inter' })).toBeInTheDocument()
  })

  it('marks the active font with aria-pressed (Nunito is the default)', () => {
    renderControls()
    expect(screen.getByRole('button', { name: 'Nunito' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Inter' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('calls onFontChange with the cssFamily when a font button is clicked', async () => {
    const onFontChange = vi.fn()
    renderControls({}, { onFontChange })
    await userEvent.click(screen.getByRole('button', { name: 'Inter' }))
    expect(onFontChange).toHaveBeenCalledWith('Inter')
  })

  it('shows a font-size slider with a live % readout', () => {
    renderControls({ fontScale: 1.5 })
    expect(screen.getByRole('slider', { name: 'Font size' })).toBeInTheDocument()
    expect(screen.getByText('150%')).toBeInTheDocument()
  })

  it('calls onFontScaleChange when the font-size slider changes', () => {
    const onFontScaleChange = vi.fn()
    renderControls({}, { onFontScaleChange })
    const slider = screen.getByRole('slider', { name: 'Font size' })
    fireEvent.change(slider, { target: { value: '1.5' } })
    expect(onFontScaleChange).toHaveBeenCalledWith(1.5)
  })
})
