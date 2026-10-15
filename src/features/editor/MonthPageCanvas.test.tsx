import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'

import { ThemeProvider } from '@mui/material/styles'

import { createAppTheme } from '../../app/theme'
import { MONDAY } from '../../types/calendar'
import { MonthPageCanvas } from './MonthPageCanvas'

// react-konva renders to a real <canvas>, which jsdom does not implement.
// Mock it to plain DOM so this stays a light smoke test (no `canvas` package):
// container nodes pass children through; <Text> renders its `text` prop.
vi.mock('react-konva', async () => {
  const { createElement } = await import('react')
  type NodeProps = { children?: ReactNode }
  type TextProps = { text?: string | number }
  const Container = ({ children }: NodeProps) =>
    createElement('div', null, children)
  const TextNode = ({ text }: TextProps) => createElement('span', null, text)
  return {
    Stage: Container,
    Layer: Container,
    Group: Container,
    Rect: () => null,
    Line: () => null,
    Text: TextNode,
    Image: () => null,
  }
})

function renderPage() {
  return render(
    <ThemeProvider theme={createAppTheme('light')}>
      <MonthPageCanvas
        year={2024}
        month={0}
        weekStart={MONDAY}
        language="en"
        size={{ width: 210, height: 297 }}
      />
    </ThemeProvider>,
  )
}

describe('MonthPageCanvas', () => {
  it('renders the month name, weekday headers and day numbers', () => {
    renderPage()
    expect(screen.getByText('January')).toBeInTheDocument()
    // The restyled Classic Top draws uppercased weekday headers.
    expect(screen.getByText('MON')).toBeInTheDocument()
    expect(screen.getByText('SUN')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText('31')).toBeInTheDocument()
  })

  it('renders the footer wordmark and week-start note', () => {
    renderPage()
    expect(screen.getByText('CalendarMaker')).toBeInTheDocument()
    expect(screen.getByText('MONDAY START')).toBeInTheDocument()
  })

  it('draws the editorial caption only when a title/subtitle are passed', () => {
    render(
      <ThemeProvider theme={createAppTheme('light')}>
        <MonthPageCanvas
          year={2024}
          month={0}
          weekStart={MONDAY}
          language="en"
          size={{ width: 480, height: 679 }}
          title="Our Mountain Year"
          subtitle="Adventures & little moments"
        />
      </ThemeProvider>,
    )
    expect(screen.getByText('Our Mountain Year')).toBeInTheDocument()
    // The subtitle is drawn uppercased.
    expect(screen.getByText('ADVENTURES & LITTLE MOMENTS')).toBeInTheDocument()
  })

  it('still renders the grid when a photo is present (photo region on top)', () => {
    render(
      <ThemeProvider theme={createAppTheme('light')}>
        <MonthPageCanvas
          year={2024}
          month={0}
          weekStart={MONDAY}
          language="en"
          size={{ width: 210, height: 297 }}
          imageUrl="blob:mock/1"
          imageTransform={{ offsetX: 0, offsetY: 0, scale: 1 }}
        />
      </ThemeProvider>,
    )
    // Grid content (title + a day) still present below the photo region.
    expect(screen.getByText('January')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
  })

  it('dispatches to the full-bleed ribbon layout, drawing the month name and day numbers', () => {
    render(
      <ThemeProvider theme={createAppTheme('light')}>
        <MonthPageCanvas
          year={2024}
          month={0}
          weekStart={MONDAY}
          language="en"
          size={{ width: 480, height: 679 }}
          layout="fullbleed-ribbon"
        />
      </ThemeProvider>,
    )
    // Ribbon draws the localized month name and a padded day-number row.
    expect(screen.getByText('January')).toBeInTheDocument()
    expect(screen.getByText('01')).toBeInTheDocument()
    expect(screen.getByText('31')).toBeInTheDocument()
  })

  it('dispatches to the bottom-photo layout (grid on top), drawing the month and days', () => {
    render(
      <ThemeProvider theme={createAppTheme('light')}>
        <MonthPageCanvas
          year={2024}
          month={0}
          weekStart={MONDAY}
          language="en"
          size={{ width: 480, height: 679 }}
          layout="bottom-photo"
        />
      </ThemeProvider>,
    )
    expect(screen.getByText('January')).toBeInTheDocument()
    expect(screen.getByText('Mon')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
  })

  it('dispatches to the agenda layout, drawing a two-column day list', () => {
    render(
      <ThemeProvider theme={createAppTheme('light')}>
        <MonthPageCanvas
          year={2024}
          month={0}
          weekStart={MONDAY}
          language="en"
          size={{ width: 480, height: 679 }}
          layout="agenda"
        />
      </ThemeProvider>,
    )
    expect(screen.getByText('January')).toBeInTheDocument()
    // Day list rows are zero-padded day numbers.
    expect(screen.getByText('01')).toBeInTheDocument()
    expect(screen.getByText('31')).toBeInTheDocument()
  })

  it('dispatches to the vertical-ribbon layout, drawing the big month number', () => {
    render(
      <ThemeProvider theme={createAppTheme('light')}>
        <MonthPageCanvas
          year={2024}
          month={2}
          weekStart={MONDAY}
          language="en"
          size={{ width: 480, height: 679 }}
          layout="vertical-ribbon"
        />
      </ThemeProvider>,
    )
    // March → uppercased month label + the year, both unique in the strip.
    expect(screen.getByText('MARCH')).toBeInTheDocument()
    expect(screen.getByText('2024')).toBeInTheDocument()
  })

  it('renders nothing until the container has been measured', () => {
    const { container } = render(
      <ThemeProvider theme={createAppTheme('light')}>
        <MonthPageCanvas
          year={2024}
          month={0}
          weekStart={MONDAY}
          language="en"
          size={{ width: 0, height: 0 }}
        />
      </ThemeProvider>,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
