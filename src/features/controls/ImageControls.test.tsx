import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ThemeProvider } from '@mui/material/styles'

import { createAppTheme } from '../../app/theme'
import { DEFAULT_IMAGE_TRANSFORM } from '../../types/calendar'
import type { ImageEntry } from '../../types/calendar'
import { ImageControls } from './ImageControls'

const LABELS = {
  uploadLabel: 'Upload photo',
  replaceLabel: 'Replace photo',
  removeLabel: 'Remove photo',
  zoomLabel: 'Zoom',
}

function renderControls(
  entry: ImageEntry | undefined,
  handlers: Partial<{
    onUpload: (f: File) => void
    onRemove: () => void
    onZoom: (s: number) => void
  }> = {},
) {
  render(
    <ThemeProvider theme={createAppTheme('light')}>
      <ImageControls
        entry={entry}
        onUpload={handlers.onUpload ?? vi.fn()}
        onRemove={handlers.onRemove ?? vi.fn()}
        onZoom={handlers.onZoom ?? vi.fn()}
        {...LABELS}
      />
    </ThemeProvider>,
  )
}

const makeEntry = (scale = 1): ImageEntry => ({
  blob: new Blob(['x'], { type: 'image/png' }),
  url: 'blob:mock/1',
  transform: { ...DEFAULT_IMAGE_TRANSFORM, scale },
})

describe('ImageControls', () => {
  it('shows Upload + a disabled Remove and Zoom when there is no photo', () => {
    renderControls(undefined)
    expect(screen.getByRole('button', { name: 'Upload photo' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove photo' })).toBeDisabled()
    expect(screen.getByRole('slider', { name: 'Zoom' })).toBeDisabled()
  })

  it('shows Replace + an enabled Remove when a photo is present', () => {
    renderControls(makeEntry())
    expect(screen.getByRole('button', { name: 'Replace photo' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove photo' })).toBeEnabled()
  })

  it('calls onUpload with the chosen file', async () => {
    const onUpload = vi.fn()
    renderControls(undefined, { onUpload })
    const file = new File(['x'], 'photo.png', { type: 'image/png' })
    const input = screen.getByLabelText('Upload photo', {
      selector: 'input[type="file"]',
    })
    await userEvent.upload(input, file)
    expect(onUpload).toHaveBeenCalledTimes(1)
    expect(onUpload.mock.calls[0][0]).toBe(file)
  })

  it('calls onRemove when Remove is clicked', async () => {
    const onRemove = vi.fn()
    renderControls(makeEntry(), { onRemove })
    await userEvent.click(screen.getByRole('button', { name: 'Remove photo' }))
    expect(onRemove).toHaveBeenCalledTimes(1)
  })
})
