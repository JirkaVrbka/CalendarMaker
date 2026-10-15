import { useState } from 'react'

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ThemeProvider } from '@mui/material/styles'

import { createAppTheme } from '../app/theme'
import type { SegmentedOption } from './SegmentedToggle'
import { SegmentedToggle } from './SegmentedToggle'

const LANGUAGE_OPTIONS: readonly SegmentedOption<'en' | 'cz'>[] = [
  { value: 'en', label: 'EN' },
  { value: 'cz', label: 'CZ' },
]

function renderToggle(onChange: (value: 'en' | 'cz') => void) {
  render(
    <ThemeProvider theme={createAppTheme('light')}>
      <SegmentedToggle
        options={LANGUAGE_OPTIONS}
        value="en"
        onChange={onChange}
        ariaLabel="Language"
      />
    </ThemeProvider>,
  )
}

describe('SegmentedToggle', () => {
  it('renders one button per option with the active one pressed', () => {
    renderToggle(vi.fn())
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(2)

    const en = screen.getByRole('button', { name: 'EN' })
    const cz = screen.getByRole('button', { name: 'CZ' })
    expect(en).toHaveAttribute('aria-pressed', 'true')
    expect(cz).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onChange with the clicked option value', () => {
    const onChange = vi.fn()
    renderToggle(onChange)
    fireEvent.click(screen.getByRole('button', { name: 'CZ' }))
    expect(onChange).toHaveBeenCalledWith('cz')
  })

  it('reflects a controlled value change', () => {
    function Controlled() {
      const [value, setValue] = useState<'en' | 'cz'>('en')
      return (
        <SegmentedToggle
          options={LANGUAGE_OPTIONS}
          value={value}
          onChange={setValue}
          ariaLabel="Language"
        />
      )
    }
    render(
      <ThemeProvider theme={createAppTheme('light')}>
        <Controlled />
      </ThemeProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'CZ' }))
    expect(screen.getByRole('button', { name: 'CZ' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'false')
  })
})
