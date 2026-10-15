import {
  createEvent,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'

import type { PersistedData } from './features/storage/mapping'

// react-konva renders to a real <canvas>, which jsdom does not implement. Mock
// it to plain DOM — same pattern as the sibling canvas tests.
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

// Mock the storage service so `loadAll` is controllable and the write paths are
// inert spies (no real IndexedDB — jsdom has none, and we add no fake for it).
vi.mock('./features/storage/service', () => ({
  loadAll: vi.fn(),
  clearAll: vi.fn(() => Promise.resolve()),
  saveProjectConfig: vi.fn(() => Promise.resolve()),
  putImage: vi.fn(() => Promise.resolve()),
  deleteImage: vi.fn(() => Promise.resolve()),
  putImageTransform: vi.fn(() => Promise.resolve()),
}))

import App from './App'
import { useProjectStore } from './app/store'
import { clearAll, loadAll, putImage } from './features/storage/service'

const mockedLoadAll = vi.mocked(loadAll)
const mockedClearAll = vi.mocked(clearAll)
const mockedPutImage = vi.mocked(putImage)

/** A DataTransfer-like object for a file drag carrying the given files. */
function fileTransfer(files: File[]): DataTransfer {
  const list = {
    length: files.length,
    item: (i: number) => files[i] ?? null,
  } as unknown as FileList
  for (let i = 0; i < files.length; i++) {
    ;(list as unknown as Record<number, File>)[i] = files[i]
  }
  return {
    types: ['Files'],
    files: list,
    dropEffect: 'none',
  } as unknown as DataTransfer
}

/**
 * Fire a drag/drop event carrying a DataTransfer. jsdom's DragEvent drops the
 * `dataTransfer` init, so we attach it to the native event by hand.
 */
function fireDragEvent(
  kind: 'dragEnter' | 'drop',
  node: Element,
  dataTransfer: DataTransfer,
) {
  const event = createEvent[kind](node)
  Object.defineProperty(event, 'dataTransfer', { value: dataTransfer })
  fireEvent(node, event)
}

// jsdom has no ResizeObserver; the editor's size hook uses one. A no-op stub
// leaves the measured size at 0 (the canvas then renders nothing), which is
// fine — these tests assert the boot/reset flow, not canvas internals.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver =
  ResizeObserverStub as unknown as typeof ResizeObserver

beforeEach(() => {
  vi.clearAllMocks()
  // Auto-accept the New/Reset confirmation.
  vi.stubGlobal('confirm', vi.fn(() => true))
  // Force the un-hydrated boot state so the loading screen is observable.
  useProjectStore.setState({ hydrated: false })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('App boot + reset flow', () => {
  it('shows the loading state until hydrate resolves, then renders the editor', async () => {
    let resolveLoad!: (data: PersistedData) => void
    mockedLoadAll.mockReturnValue(
      new Promise<PersistedData>((resolve) => {
        resolveLoad = resolve
      }),
    )

    render(<App />)

    // Loading: spinner + text, editor not yet present.
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    expect(screen.getByText('Loading…')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'New / Reset' }),
    ).toBeNull()

    // Resolve the load → store hydrates → editor replaces the loader.
    resolveLoad({ config: null, images: [] })

    expect(
      await screen.findByRole('button', { name: 'New / Reset' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).toBeNull()
  })

  it('renders the three columns: rail, stage, and right controls panel', async () => {
    mockedLoadAll.mockResolvedValue({ config: null, images: [] })

    render(<App />)

    // Right controls panel region (the moved controls now live here).
    const panel = await screen.findByRole('region', { name: 'Controls' })
    expect(panel).toBeInTheDocument()

    // The sticky panel head shows the per-page editing note (cover = page 1/13).
    expect(
      screen.getByText(
        'Editing page 1 of 13 — changes apply to this page',
      ),
    ).toBeInTheDocument()

    // Left thumbnail rail (PageNavigator listbox) and the center stage (main).
    expect(
      screen.getByRole('listbox', { name: 'Calendar pages' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()

    // Rail header renders above the thumbnails.
    expect(screen.getByText('Pages')).toBeInTheDocument()

    // Brand wordmark renders in the header.
    expect(screen.getByText('Maker')).toBeInTheDocument()

    // Collapsible section headers render inside the panel, in the new order.
    // All sections start collapsed, so the headers exist but their content is
    // not yet in the accessibility tree.
    const layoutHeader = screen.getByRole('button', { name: /Layout/ })
    const colorsHeader = screen.getByRole('button', { name: /Colors/ })
    const typographyHeader = screen.getByRole('button', { name: /Typography/ })
    const calendarHeader = screen.getByRole('button', { name: /Calendar/ })
    expect(layoutHeader).toBeInTheDocument()
    expect(colorsHeader).toBeInTheDocument()
    expect(typographyHeader).toBeInTheDocument()
    expect(calendarHeader).toBeInTheDocument()
    expect(layoutHeader).toHaveAttribute('aria-expanded', 'false')
    expect(colorsHeader).toHaveAttribute('aria-expanded', 'false')
    expect(typographyHeader).toHaveAttribute('aria-expanded', 'false')
    expect(calendarHeader).toHaveAttribute('aria-expanded', 'false')

    // The Calendar section carries its own language select — expand it first.
    fireEvent.click(calendarHeader)
    expect(calendarHeader).toHaveAttribute('aria-expanded', 'true')
    expect(
      screen.getByRole('combobox', { name: 'Language' }),
    ).toBeInTheDocument()
  })

  it('language toggle: EN/CZ segmented buttons switch the UI language', async () => {
    mockedLoadAll.mockResolvedValue({ config: null, images: [] })

    render(<App />)

    const en = await screen.findByRole('button', { name: 'EN' })
    const cz = screen.getByRole('button', { name: 'CZ' })

    // Starts in English: EN pressed, CZ not; English field label present.
    expect(en).toHaveAttribute('aria-pressed', 'true')
    expect(cz).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByLabelText('Calendar title')).toBeInTheDocument()

    // Click CZ → language switches to Czech.
    fireEvent.click(cz)

    expect(cz).toHaveAttribute('aria-pressed', 'true')
    expect(en).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByLabelText('Název kalendáře')).toBeInTheDocument()
  })

  it('dropping an image file on the page preview sets the active page photo', async () => {
    mockedLoadAll.mockResolvedValue({ config: null, images: [] })

    // Report a real measured size so the cover canvas renders (it returns null
    // at size 0), giving the drop target a child node to anchor + bubble from.
    const originalRO = globalThis.ResizeObserver
    class SizedResizeObserver {
      private cb: ResizeObserverCallback
      constructor(cb: ResizeObserverCallback) {
        this.cb = cb
      }
      observe() {
        this.cb(
          [
            { contentRect: { width: 600, height: 800 } },
          ] as unknown as ResizeObserverEntry[],
          this as unknown as ResizeObserver,
        )
      }
      unobserve() {}
      disconnect() {}
    }
    globalThis.ResizeObserver =
      SizedResizeObserver as unknown as typeof ResizeObserver

    try {
      render(<App />)

      // The stage column; the sheet wrapper (drop target) lives inside it. The
      // drop bubbles up to its handler from any descendant — the cover title
      // text rendered inside the canvas serves as the anchor.
      const main = await screen.findByRole('main')
      // `main` also contains the thumbnail rail; pick the title node that is in
      // the stage canvas (inside the drop target), not a rail thumbnail.
      const rail = within(main).getByRole('listbox', { name: 'Calendar pages' })
      const anchor = within(main)
        .getAllByText('My Calendar')
        .find((el) => !rail.contains(el))
      expect(anchor).toBeDefined()

      // Dragging a file in shows the drop overlay.
      fireDragEvent('dragEnter', anchor!, fileTransfer([]))
      expect(screen.getByText('Drop photo here')).toBeInTheDocument()

      // Dropping an image routes through the upload path (slot 0 = cover).
      const file = new File(['x'], 'photo.png', { type: 'image/png' })
      fireDragEvent('drop', anchor!, fileTransfer([file]))

      await waitFor(() => expect(mockedPutImage).toHaveBeenCalledTimes(1))
      expect(mockedPutImage).toHaveBeenCalledWith(0, file, expect.anything())
      // Overlay clears after the drop.
      expect(screen.queryByText('Drop photo here')).toBeNull()
    } finally {
      globalThis.ResizeObserver = originalRO
    }
  })

  it('New/Reset confirms, resets the project, and clears storage', async () => {
    mockedLoadAll.mockResolvedValue({ config: null, images: [] })

    render(<App />)

    const titleField = (await screen.findByLabelText(
      'Calendar title',
    )) as HTMLInputElement
    expect(titleField.value).toBe('My Calendar')

    // Edit the title away from the default so the reset is observable.
    fireEvent.change(titleField, { target: { value: 'Changed Title' } })
    expect(titleField.value).toBe('Changed Title')

    fireEvent.click(screen.getByRole('button', { name: 'New / Reset' }))

    // Confirm was consulted and storage was wiped.
    expect(window.confirm).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(mockedClearAll).toHaveBeenCalledTimes(1))
    // resetProject ran → the title reverted to the fresh default.
    expect(titleField.value).toBe('My Calendar')
  })
})
