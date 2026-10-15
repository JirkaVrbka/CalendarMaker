import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'

// Force the mobile layout: App reads `useMediaQuery(theme.breakpoints.down('md'))`.
// A default-true mock flips it to the bottom-tabs shell (the other call, for
// prefers-color-scheme, just lands on the dark theme, which is irrelevant here).
vi.mock('@mui/material/useMediaQuery', () => ({ default: vi.fn(() => true) }))

// react-konva renders to a <canvas> jsdom lacks; mock to plain DOM.
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

vi.mock('./features/storage/service', () => ({
  loadAll: vi.fn(() => Promise.resolve({ config: null, images: [] })),
  clearAll: vi.fn(() => Promise.resolve()),
  saveProjectConfig: vi.fn(() => Promise.resolve()),
  putImage: vi.fn(() => Promise.resolve()),
  deleteImage: vi.fn(() => Promise.resolve()),
  putImageTransform: vi.fn(() => Promise.resolve()),
}))

import App from './App'
import { useProjectStore } from './app/store'

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver =
  ResizeObserverStub as unknown as typeof ResizeObserver

beforeEach(() => {
  useProjectStore.setState({ hydrated: false })
})

describe('App mobile layout', () => {
  it('renders the bottom-tabs shell with Pages/Preview/Edit and not the desktop columns', async () => {
    render(<App />)

    // Bottom tab bar renders all three view tabs.
    const pagesTab = await screen.findByRole('tab', { name: 'Pages' })
    expect(pagesTab).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Preview' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Edit' })).toBeInTheDocument()

    // Preview is the default view, so neither the desktop rail (page listbox)
    // nor the controls panel region is mounted — the 3-column layout is gone.
    expect(
      screen.queryByRole('listbox', { name: 'Calendar pages' }),
    ).toBeNull()
    expect(screen.queryByRole('region', { name: 'Controls' })).toBeNull()
  })
})
