import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ThemeProvider } from '@mui/material/styles'

import { createAppTheme } from '../../app/theme'
import { DEFAULT_STYLE } from '../../types/calendar'
import { StyleControls } from './StyleControls'
import type { StyleColorKey } from './StyleControls'

const labels = {
  fontLabel: 'Font',
  textColorLabel: 'Text color',
  saturdayColorLabel: 'Saturday color',
  sundayColorLabel: 'Sunday color',
  backgroundColorLabel: 'Background color',
}

function renderControls(
  handlers: Partial<{
    onFontChange: (f: string) => void
    onColorChange: (k: StyleColorKey, v: string) => void
  }> = {},
) {
  const onFontChange = handlers.onFontChange ?? vi.fn()
  const onColorChange = handlers.onColorChange ?? vi.fn()
  render(
    <ThemeProvider theme={createAppTheme('light')}>
      <StyleControls
        style={DEFAULT_STYLE}
        onFontChange={onFontChange}
        onColorChange={onColorChange}
        labels={labels}
      />
    </ThemeProvider>,
  )
  return { onFontChange, onColorChange }
}

describe('StyleControls', () => {
  it('renders the font select and the four color inputs', () => {
    renderControls()
    expect(screen.getByRole('combobox', { name: 'Font' })).toBeInTheDocument()
    expect(screen.getByLabelText('Text color')).toBeInTheDocument()
    expect(screen.getByLabelText('Saturday color')).toBeInTheDocument()
    expect(screen.getByLabelText('Sunday color')).toBeInTheDocument()
    expect(screen.getByLabelText('Background color')).toBeInTheDocument()
  })

  it('calls onColorChange when a native color input changes', () => {
    const onColorChange = vi.fn()
    renderControls({ onColorChange })
    fireEvent.change(screen.getByLabelText('Text color'), {
      target: { value: '#123456' },
    })
    expect(onColorChange).toHaveBeenCalledWith('textColor', '#123456')
  })

  it('wires the Saturday and Sunday inputs to their own keys', () => {
    const onColorChange = vi.fn()
    renderControls({ onColorChange })
    fireEvent.change(screen.getByLabelText('Saturday color'), {
      target: { value: '#0000ff' },
    })
    expect(onColorChange).toHaveBeenCalledWith('saturdayColor', '#0000ff')
    fireEvent.change(screen.getByLabelText('Sunday color'), {
      target: { value: '#ff0000' },
    })
    expect(onColorChange).toHaveBeenCalledWith('sundayColor', '#ff0000')
  })

  it('calls onColorChange from a preset swatch', async () => {
    const onColorChange = vi.fn()
    renderControls({ onColorChange })
    await userEvent.click(
      screen.getByRole('button', { name: 'Background color: #ffffff' }),
    )
    expect(onColorChange).toHaveBeenCalledWith('backgroundColor', '#ffffff')
  })

  it('calls onFontChange when a font is picked', async () => {
    const onFontChange = vi.fn()
    renderControls({ onFontChange })
    await userEvent.click(screen.getByRole('combobox', { name: 'Font' }))
    await userEvent.click(screen.getByRole('option', { name: 'Inter' }))
    expect(onFontChange).toHaveBeenCalledWith('Inter')
  })
})
