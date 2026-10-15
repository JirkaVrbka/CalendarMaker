import { renderHook } from '@testing-library/react'
import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { useImageElement } from './useImageElement'

/**
 * A minimal `Image` stub (no dependency): records every instance so a test can
 * fire `onload` by hand, simulating an async image load on jsdom (which has no
 * real image decoding).
 */
class FakeImage {
  static instances: FakeImage[] = []
  onload: (() => void) | null = null
  width = 10
  height = 20
  private value = ''

  set src(next: string) {
    this.value = next
    FakeImage.instances.push(this)
  }

  get src() {
    return this.value
  }
}

const realImage = globalThis.Image

beforeEach(() => {
  FakeImage.instances = []
  globalThis.Image = FakeImage as unknown as typeof Image
})

afterEach(() => {
  globalThis.Image = realImage
})

describe('useImageElement', () => {
  it('returns null until the image loads, then the loaded element', () => {
    const { result } = renderHook(() => useImageElement('blob:a'))
    expect(result.current).toBeNull()

    const img = FakeImage.instances[0]
    expect(img.src).toBe('blob:a')

    act(() => {
      img.onload?.()
    })
    expect(result.current).toBe(img as unknown as HTMLImageElement)
    expect(result.current?.width).toBe(10)
  })

  it('returns null and loads nothing when no url is given', () => {
    const { result } = renderHook(() => useImageElement(undefined))
    expect(result.current).toBeNull()
    expect(FakeImage.instances).toHaveLength(0)
  })

  it('cancels a pending load on url change (handler nulled, no stale element)', () => {
    const { result, rerender } = renderHook(
      ({ url }) => useImageElement(url),
      { initialProps: { url: 'blob:a' } },
    )
    const first = FakeImage.instances[0]

    rerender({ url: 'blob:b' })
    // Cleanup nulled the stale handler so it can't set state after the change.
    expect(first.onload).toBeNull()

    // Firing the stale load (defensively) must not surface the old element.
    act(() => {
      first.onload?.()
    })
    expect(result.current).toBeNull()

    // The new url's image still loads normally.
    const second = FakeImage.instances[1]
    expect(second.src).toBe('blob:b')
    act(() => {
      second.onload?.()
    })
    expect(result.current).toBe(second as unknown as HTMLImageElement)
  })

  it('cancels a pending load on unmount (handler nulled)', () => {
    const { unmount } = renderHook(() => useImageElement('blob:a'))
    const img = FakeImage.instances[0]

    unmount()
    expect(img.onload).toBeNull()
    // Firing after unmount must not throw.
    expect(() => img.onload?.()).not.toThrow()
  })
})
