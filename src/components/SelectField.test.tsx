import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ThemeProvider } from '@mui/material/styles'

import { createAppTheme } from '../app/theme'
import { SelectField } from './SelectField'

function renderSelect(ui: React.ReactElement) {
  render(<ThemeProvider theme={createAppTheme('light')}>{ui}</ThemeProvider>)
}

describe('SelectField', () => {
  it('renders its options', () => {
    renderSelect(
      <SelectField value="a" onChange={vi.fn()} aria-label="Pick">
        <option value="a">Apple</option>
        <option value="b">Banana</option>
      </SelectField>,
    )
    expect(screen.getByRole('option', { name: 'Apple' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Banana' })).toBeInTheDocument()
  })

  it('fires onChange with the selected value', () => {
    const onChange = vi.fn()
    renderSelect(
      <SelectField value="a" onChange={onChange} aria-label="Pick">
        <option value="a">Apple</option>
        <option value="b">Banana</option>
      </SelectField>,
    )
    const select = screen.getByRole('combobox', { name: 'Pick' })
    fireEvent.change(select, { target: { value: 'b' } })
    expect(onChange).toHaveBeenCalledWith('b')
  })

  it('forwards the id for label association', () => {
    renderSelect(
      <SelectField value="a" onChange={vi.fn()} id="s" aria-label="Pick">
        <option value="a">Apple</option>
      </SelectField>,
    )
    expect(screen.getByRole('combobox', { name: 'Pick' })).toHaveAttribute('id', 's')
  })
})
