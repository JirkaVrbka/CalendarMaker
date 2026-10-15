import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { DragEvent } from 'react'

import { useFileDrop } from './useFileDrop'

/** A DataTransfer-like object carrying the given `types` and `files`. */
function makeTransfer(types: string[], files: File[]): DataTransfer {
  const list = {
    length: files.length,
    item: (i: number) => files[i] ?? null,
  } as unknown as FileList
  for (let i = 0; i < files.length; i++) {
    ;(list as unknown as Record<number, File>)[i] = files[i]
  }
  return {
    types,
    files: list,
    dropEffect: 'none',
  } as unknown as DataTransfer
}

/** A minimal synthetic drag event wrapping a DataTransfer, with preventDefault. */
function dragEvent(dataTransfer: DataTransfer): DragEvent {
  return {
    dataTransfer,
    preventDefault: vi.fn(),
  } as unknown as DragEvent
}

const imageFile = () => new File(['x'], 'a.png', { type: 'image/png' })
const textFile = () => new File(['x'], 'a.txt', { type: 'text/plain' })

describe('useFileDrop', () => {
  it('calls onDropFile with a dropped image', () => {
    const onDropFile = vi.fn()
    const { result } = renderHook(() => useFileDrop(onDropFile))

    const file = imageFile()
    act(() => {
      result.current.dropHandlers.onDrop(
        dragEvent(makeTransfer(['Files'], [file])),
      )
    })

    expect(onDropFile).toHaveBeenCalledTimes(1)
    expect(onDropFile).toHaveBeenCalledWith(file)
  })

  it('ignores a dropped non-image file', () => {
    const onDropFile = vi.fn()
    const { result } = renderHook(() => useFileDrop(onDropFile))

    act(() => {
      result.current.dropHandlers.onDrop(
        dragEvent(makeTransfer(['Files'], [textFile()])),
      )
    })

    expect(onDropFile).not.toHaveBeenCalled()
  })

  it('does not engage for a non-file drag (e.g. Konva reposition)', () => {
    const onDropFile = vi.fn()
    const { result } = renderHook(() => useFileDrop(onDropFile))

    act(() => {
      result.current.dropHandlers.onDragEnter(
        dragEvent(makeTransfer([], [])),
      )
    })

    expect(result.current.isDragging).toBe(false)
  })

  it('toggles isDragging true on file dragEnter and back to false on dragLeave', () => {
    const { result } = renderHook(() => useFileDrop(vi.fn()))

    act(() => {
      result.current.dropHandlers.onDragEnter(
        dragEvent(makeTransfer(['Files'], [])),
      )
    })
    expect(result.current.isDragging).toBe(true)

    act(() => {
      result.current.dropHandlers.onDragLeave(
        dragEvent(makeTransfer(['Files'], [])),
      )
    })
    expect(result.current.isDragging).toBe(false)
  })

  it('stays dragging across nested enter/leave (drag-counter, no flicker)', () => {
    const { result } = renderHook(() => useFileDrop(vi.fn()))

    act(() => {
      result.current.dropHandlers.onDragEnter(
        dragEvent(makeTransfer(['Files'], [])),
      )
      result.current.dropHandlers.onDragEnter(
        dragEvent(makeTransfer(['Files'], [])),
      )
    })
    expect(result.current.isDragging).toBe(true)

    // Leaving only the inner node keeps the overlay up.
    act(() => {
      result.current.dropHandlers.onDragLeave(
        dragEvent(makeTransfer(['Files'], [])),
      )
    })
    expect(result.current.isDragging).toBe(true)

    // Leaving the outer node finally clears it.
    act(() => {
      result.current.dropHandlers.onDragLeave(
        dragEvent(makeTransfer(['Files'], [])),
      )
    })
    expect(result.current.isDragging).toBe(false)
  })
})
