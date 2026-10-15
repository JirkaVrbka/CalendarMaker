import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ThemeProvider } from '@mui/material/styles'

import { createAppTheme } from '../app/theme'
import { Field } from './Field'

function renderField(ui: React.ReactElement) {
  render(<ThemeProvider theme={createAppTheme('light')}>{ui}</ThemeProvider>)
}

describe('Field', () => {
  it('associates its label with the control via htmlFor', () => {
    renderField(
      <Field label="Calendar title" htmlFor="x">
        <input id="x" defaultValue="hi" />
      </Field>,
    )
    const input = screen.getByLabelText('Calendar title')
    expect(input).toBe(document.getElementById('x'))
  })

  it('renders the readout value when one is passed', () => {
    renderField(
      <Field label="Font size" value="150%">
        <div>CONTROL</div>
      </Field>,
    )
    expect(screen.getByText('150%')).toBeInTheDocument()
    expect(screen.getByText('Font size')).toBeInTheDocument()
    expect(screen.getByText('CONTROL')).toBeInTheDocument()
  })

  it('omits the readout when no value is passed', () => {
    renderField(
      <Field label="Subtitle">
        <div>CONTROL</div>
      </Field>,
    )
    expect(screen.getByText('Subtitle')).toBeInTheDocument()
    expect(screen.getByText('CONTROL')).toBeInTheDocument()
  })
})
