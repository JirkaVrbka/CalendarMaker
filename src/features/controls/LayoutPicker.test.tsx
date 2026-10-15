import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'

import { ThemeProvider } from '@mui/material/styles'

import { createAppTheme } from '../../app/theme'
import { DEFAULT_STYLE, MONDAY } from '../../types/calendar'
import { LayoutPicker } from './LayoutPicker'

// react-konva renders to a real <canvas> jsdom lacks — mock it to plain DOM so
// the picker's preview canvases render without the `canvas` package.
vi.mock('react-konva', async () => {
  const { createElement } = await import('react')
  type NodeProps = { children?: ReactNode }
  const Container = ({ children }: NodeProps) => createElement('div', null, children)
  return {
    Stage: Container,
    Layer: Container,
    Group: Container,
    Rect: () => null,
    Line: () => null,
    Text: () => null,
    Image: () => null,
  }
})

function renderPicker(
  overrides: Partial<React.ComponentProps<typeof LayoutPicker>> = {},
) {
  const onSelect = vi.fn()
  render(
    <ThemeProvider theme={createAppTheme('light')}>
      <LayoutPicker
        activeLayout="classic-top"
        onSelect={onSelect}
        language="en"
        groupLabel="Layout"
        year={2026}
        month={2}
        weekStart={MONDAY}
        style={DEFAULT_STYLE}
        {...overrides}
      />
    </ThemeProvider>,
  )
  return { onSelect }
}

describe('LayoutPicker', () => {
  it('renders one radio per registered layout (seven after Wave 2)', () => {
    renderPicker()
    const options = screen.getAllByRole('radio')
    expect(options).toHaveLength(7)
    for (const name of [
      'Classic Top',
      'Full-bleed Ribbon',
      'Bottom Photo',
      'Framed',
      'Minimal Overlay',
      'Agenda',
      'Vertical Ribbon',
    ]) {
      expect(screen.getByRole('radio', { name })).toBeInTheDocument()
    }
  })

  it('marks the active layout as checked', () => {
    renderPicker({ activeLayout: 'fullbleed-ribbon' })
    expect(screen.getByRole('radio', { name: 'Full-bleed Ribbon' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(screen.getByRole('radio', { name: 'Classic Top' })).toHaveAttribute(
      'aria-checked',
      'false',
    )
  })

  it('calls onSelect with the clicked layout id', async () => {
    const { onSelect } = renderPicker()
    await userEvent.click(screen.getByRole('radio', { name: 'Full-bleed Ribbon' }))
    expect(onSelect).toHaveBeenCalledWith('fullbleed-ribbon')
  })

  it('uses the localized (Czech) labels', () => {
    renderPicker({ language: 'cs' })
    expect(screen.getByRole('radio', { name: 'Klasický nahoře' })).toBeInTheDocument()
    expect(
      screen.getByRole('radio', { name: 'Fotka na celou stranu' }),
    ).toBeInTheDocument()
  })
})
