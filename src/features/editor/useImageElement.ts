/**
 * Load an `HTMLImageElement` from an object-URL for drawing on a Konva canvas.
 * A tiny custom hook (deliberately no `use-image` dependency): it creates a new
 * `Image`, resolves it on load, and returns `null` until then or when no URL is
 * given. Object-URL *lifecycle* (create/revoke) is owned by the store, not this
 * hook — here we only clear the load handler on cleanup so a stale load can't
 * set state after unmount or a URL change.
 */
import { useEffect, useState } from 'react'

/** The loaded element tagged with the URL it was loaded from. */
interface Loaded {
  readonly url: string
  readonly element: HTMLImageElement
}

export function useImageElement(
  url: string | undefined,
): HTMLImageElement | null {
  const [loaded, setLoaded] = useState<Loaded | null>(null)

  useEffect(() => {
    if (!url) return
    const element = new Image()
    let cancelled = false
    element.onload = () => {
      if (!cancelled) setLoaded({ url, element })
    }
    element.src = url
    return () => {
      cancelled = true
      element.onload = null
    }
  }, [url])

  // Derive readiness during render: return the element only while it still
  // matches the current URL, so a URL change yields `null` (no stale image)
  // until the new one loads — no synchronous setState in the effect.
  return url && loaded?.url === url ? loaded.element : null
}
