import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ThemeProvider } from '@mui/material/styles'

import { createAppTheme } from '../app/theme'
import { BrandMark } from './BrandMark'

describe('BrandMark', () => {
  it('renders without crashing and contains an svg', () => {
    const { container } = render(
      <ThemeProvider theme={createAppTheme('light')}>
        <BrandMark />
      </ThemeProvider>,
    )
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
