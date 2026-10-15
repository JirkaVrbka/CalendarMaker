/**
 * Drag-and-drop-a-file hook for the page preview. Returns an `isDragging` flag
 * (for a drop overlay) and a set of handlers to spread onto the drop target.
 *
 * Only file drags engage it (`dataTransfer.types` includes `'Files'`), so it
 * never interferes with Konva's own in-canvas photo-reposition drag. A
 * drag-counter (incremented on enter, decremented on leave) keeps `isDragging`
 * steady while the pointer crosses child nodes instead of flickering off.
 */
import { useCallback, useRef, useState } from 'react'
import type { DragEvent } from 'react'

import { pickImageFile } from '../../lib/pickImageFile'

/** True when the drag carries OS files (not an internal element drag). */
function hasFiles(event: DragEvent): boolean {
  return event.dataTransfer?.types?.includes('Files') ?? false
}

export interface FileDropHandlers {
  readonly onDragEnter: (event: DragEvent) => void
  readonly onDragOver: (event: DragEvent) => void
  readonly onDragLeave: (event: DragEvent) => void
  readonly onDrop: (event: DragEvent) => void
}

export function useFileDrop(onDropFile: (file: File) => void): {
  isDragging: boolean
  dropHandlers: FileDropHandlers
} {
  const [isDragging, setIsDragging] = useState(false)
  // Counts active enter/leave pairs so crossing child nodes doesn't flicker.
  const dragDepth = useRef(0)

  const onDragEnter = useCallback((event: DragEvent) => {
    if (!hasFiles(event)) return
    event.preventDefault()
    dragDepth.current += 1
    setIsDragging(true)
  }, [])

  const onDragOver = useCallback((event: DragEvent) => {
    if (!hasFiles(event)) return
    // Allow the drop and stop the browser from navigating to the dropped file.
    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
  }, [])

  const onDragLeave = useCallback((event: DragEvent) => {
    if (!hasFiles(event)) return
    event.preventDefault()
    dragDepth.current = Math.max(0, dragDepth.current - 1)
    if (dragDepth.current === 0) setIsDragging(false)
  }, [])

  const onDrop = useCallback(
    (event: DragEvent) => {
      if (!hasFiles(event)) return
      event.preventDefault()
      dragDepth.current = 0
      setIsDragging(false)
      const file = pickImageFile(event.dataTransfer)
      if (file) onDropFile(file)
    },
    [onDropFile],
  )

  return {
    isDragging,
    dropHandlers: { onDragEnter, onDragOver, onDragLeave, onDrop },
  }
}
