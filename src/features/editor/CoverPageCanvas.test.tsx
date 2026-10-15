import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ComponentProps, ReactNode } from 'react'

import { ThemeProvider } from '@mui/material/styles'

import { createAppTheme } from '../../app/theme'
import { CoverPageCanvas } from './CoverPageCanvas'

// react-konva renders to a real <canvas>, which jsdom does not implement.
// Mock it to plain DOM (same approach as MonthPageCanvas): containers pass
// children through; <Text> renders its `text` prop.
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

function renderCover(title: string, size = { width: 210, height: 297 }) {
  return render(
    <ThemeProvider theme={createAppTheme('light')}>
      <CoverPageCanvas title={title} size={size} />
    </ThemeProvider>,
  )
}

function renderCoverWith(
  props: Partial<ComponentProps<typeof CoverPageCanvas>>,
) {
  return render(
    <ThemeProvider theme={createAppTheme('light')}>
      <CoverPageCanvas
        title="Our 2026 Calendar"
        size={{ width: 210, height: 297 }}
        {...props}
      />
    </ThemeProvider>,
  )
}

describe('CoverPageCanvas', () => {
  it('renders the project title', () => {
    renderCover('Our 2026 Calendar')
    expect(screen.getByText('Our 2026 Calendar')).toBeInTheDocument()
  })

  it('still renders the title when a photo fills the page', () => {
    render(
      <ThemeProvider theme={createAppTheme('light')}>
        <CoverPageCanvas
          title="Our 2026 Calendar"
          size={{ width: 210, height: 297 }}
          imageUrl="blob:mock/1"
          imageTransform={{ offsetX: 0, offsetY: 0, scale: 1 }}
        />
      </ThemeProvider>,
    )
    expect(screen.getByText('Our 2026 Calendar')).toBeInTheDocument()
  })

  it('renders nothing until the container has been measured', () => {
    const { container } = renderCover('Untitled', { width: 0, height: 0 })
    expect(container).toBeEmptyDOMElement()
  })

  it('renders a non-empty subtitle alongside the title', () => {
    renderCoverWith({ subtitle: 'A memorable year' })
    expect(screen.getByText('Our 2026 Calendar')).toBeInTheDocument()
    expect(screen.getByText('A memorable year')).toBeInTheDocument()
  })

  it('renders nothing for an empty or whitespace-only subtitle', () => {
    renderCoverWith({ subtitle: '   ' })
    expect(screen.getByText('Our 2026 Calendar')).toBeInTheDocument()
    expect(screen.queryByText('   ')).not.toBeInTheDocument()
  })
})
