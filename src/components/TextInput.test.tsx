import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ThemeProvider } from '@mui/material/styles'

import { createAppTheme } from '../app/theme'
import { TextInput } from './TextInput'

function renderInput(ui: React.ReactElement) {
  render(<ThemeProvider theme={createAppTheme('light')}>{ui}</ThemeProvider>)
}

describe('TextInput', () => {
  it('fires onChange with the typed value', () => {
    const onChange = vi.fn()
    renderInput(<TextInput value="" onChange={onChange} aria-label="Name" />)
    const input = screen.getByRole('textbox', { name: 'Name' })
    fireEvent.change(input, { target: { value: 'hello' } })
    expect(onChange).toHaveBeenCalledWith('hello')
  })

  it('renders the placeholder and forwards the id', () => {
    const onChange = vi.fn()
    renderInput(
      <TextInput value="" onChange={onChange} placeholder="Add a title…" id="t" />,
    )
    const input = screen.getByPlaceholderText('Add a title…')
    expect(input).toHaveAttribute('id', 't')
  })

  it('reflects the controlled value', () => {
    const onChange = vi.fn()
    renderInput(<TextInput value="hi there" onChange={onChange} aria-label="Name" />)
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('hi there')
  })
})
