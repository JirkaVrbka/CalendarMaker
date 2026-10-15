import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'

import { ThemeProvider } from '@mui/material/styles'

import { createAppTheme } from '../../app/theme'
import { buildProjectPages } from '../../lib/projectPages'
import { MONDAY } from '../../types/calendar'
import { PageNavigator } from './PageNavigator'

// Mock react-konva to plain DOM so thumbnails render without a real canvas.
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

function renderNavigator(
  activeIndex = 0,
  onSelect = vi.fn(),
  railTitle?: string,
) {
  render(
    <ThemeProvider theme={createAppTheme('light')}>
      <PageNavigator
        pages={buildProjectPages(0, 2026)}
        activeIndex={activeIndex}
        onSelect={onSelect}
        weekStart={MONDAY}
        language="en"
        title="My Calendar"
        coverLabel="Cover"
        navigatorLabel="Calendar pages"
        railTitle={railTitle}
      />
    </ThemeProvider>,
  )
  return onSelect
}

describe('PageNavigator', () => {
  it('renders 13 options (cover + 12 months) with localized labels', () => {
    renderNavigator()
    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(13)
    expect(screen.getByRole('option', { name: 'Cover' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'January 2026' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'December 2026' })).toBeInTheDocument()
  })

  it('marks the active page as selected', () => {
    renderNavigator(3)
    const selected = screen.getByRole('option', { selected: true })
    expect(selected).toHaveAttribute('aria-label', 'March 2026')
  })

  it('selects a page on click', () => {
    const onSelect = renderNavigator(0)
    fireEvent.click(screen.getByRole('option', { name: 'May 2026' }))
    // Cover=0, Jan=1 … May=5.
    expect(onSelect).toHaveBeenCalledWith(5)
  })

  it('moves selection with the arrow keys', () => {
    const onSelect = renderNavigator(0)
    const listbox = screen.getByRole('listbox')
    fireEvent.keyDown(listbox, { key: 'ArrowDown' })
    expect(onSelect).toHaveBeenCalledWith(1)
  })

  it('jumps to the last page with End', () => {
    const onSelect = renderNavigator(0)
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'End' })
    expect(onSelect).toHaveBeenCalledWith(12)
  })

  it('exposes an accessible name for the rail', () => {
    renderNavigator()
    const listbox = screen.getByRole('listbox', { name: 'Calendar pages' })
    expect(within(listbox).getAllByRole('option')).toHaveLength(13)
  })

  it('renders the rail header with title and page count when railTitle is set', () => {
    renderNavigator(0, vi.fn(), 'Pages')
    expect(screen.getByText('Pages')).toBeInTheDocument()
    expect(screen.getByTestId('page-navigator-count')).toHaveTextContent('13')
  })

  it('shows a dash index badge on the cover and a number on month pages', () => {
    renderNavigator()
    const coverOption = screen.getByRole('option', { name: 'Cover' })
    expect(within(coverOption).getByTestId('page-navigator-index')).toHaveTextContent('—')
    const januaryOption = screen.getByRole('option', { name: 'January 2026' })
    expect(within(januaryOption).getByTestId('page-navigator-index')).toHaveTextContent('1')
  })
})
