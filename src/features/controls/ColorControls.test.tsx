import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ThemeProvider } from '@mui/material/styles'

import { createAppTheme } from '../../app/theme'
import { DEFAULT_STYLE } from '../../types/calendar'
import { ColorControls } from './ColorControls'
import type { StyleColorKey } from './ColorControls'

const labels = {
  textColorLabel: 'Text color',
  saturdayColorLabel: 'Saturday color',
  sundayColorLabel: 'Sunday color',
  backgroundColorLabel: 'Background color',
}

function renderControls(
  overrides: Partial<React.ComponentProps<typeof ColorControls>> = {},
  onColorChange: (k: StyleColorKey, v: string) => void = vi.fn(),
) {
  render(
    <ThemeProvider theme={createAppTheme('light')}>
      <ColorControls
        textColor={DEFAULT_STYLE.textColor}
        saturdayColor={DEFAULT_STYLE.saturdayColor}
        sundayColor={DEFAULT_STYLE.sundayColor}
        backgroundColor={DEFAULT_STYLE.backgroundColor}
        onColorChange={onColorChange}
        labels={labels}
        {...overrides}
      />
    </ThemeProvider>,
  )
  return { onColorChange }
}

describe('ColorControls', () => {
  it('renders a swatch group per color field with a custom color input', () => {
    renderControls()
    expect(screen.getByLabelText('Text color: custom')).toBeInTheDocument()
    expect(screen.getByLabelText('Saturday color: custom')).toBeInTheDocument()
    expect(screen.getByLabelText('Sunday color: custom')).toBeInTheDocument()
    expect(screen.getByLabelText('Background color: custom')).toBeInTheDocument()
  })

  it('calls onColorChange with the hex when a preset swatch is clicked', async () => {
    const onColorChange = vi.fn()
    renderControls({}, onColorChange)
    await userEvent.click(
      screen.getByRole('button', { name: 'Background color: #FBFAF7' }),
    )
    expect(onColorChange).toHaveBeenCalledWith('backgroundColor', '#FBFAF7')
  })

  it('wires the Saturday and Sunday swatches to their own keys', async () => {
    const onColorChange = vi.fn()
    renderControls({}, onColorChange)
    await userEvent.click(
      screen.getByRole('button', { name: 'Saturday color: #1E3A5F' }),
    )
    expect(onColorChange).toHaveBeenCalledWith('saturdayColor', '#1E3A5F')
    await userEvent.click(
      screen.getByRole('button', { name: 'Sunday color: #A8432A' }),
    )
    expect(onColorChange).toHaveBeenCalledWith('sundayColor', '#A8432A')
  })

  it('keeps arbitrary colors available via the custom color input', () => {
    const onColorChange = vi.fn()
    renderControls({}, onColorChange)
    const input = screen.getByLabelText('Text color: custom')
    expect(input).toHaveAttribute('type', 'color')
    fireEvent.change(input, { target: { value: '#abcdef' } })
    expect(onColorChange).toHaveBeenCalledWith('textColor', '#abcdef')
  })

  it('marks the preset swatch that equals the current value as pressed', () => {
    renderControls({ backgroundColor: '#1C2024' })
    expect(
      screen.getByRole('button', { name: 'Background color: #1C2024' }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(
      screen.getByRole('button', { name: 'Background color: #FBFAF7' }),
    ).toHaveAttribute('aria-pressed', 'false')
  })
})
