/**
 * Controls for the active page's photo: upload / replace (a MUI button wrapping
 * a hidden `accept="image/*"` file input), remove, and a zoom slider. All state
 * lives in the store; this component is wired via props by `App` for the active
 * slot. The zoom slider scales the photo (1 = cover-fit, up to `MAX_ZOOM`).
 */
import DeleteOutlineIcon from '@mui/icons-material/Delete'
import OpenWithIcon from '@mui/icons-material/OpenWith'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import ZoomInIcon from '@mui/icons-material/ZoomIn'
import Button from '@mui/material/Button'
import Slider from '@mui/material/Slider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { DEFAULT_IMAGE_TRANSFORM } from '../../types/calendar'
import type { ImageEntry } from '../../types/calendar'

/** Maximum zoom multiplier on top of cover-fit. */
export const MAX_ZOOM = 3

export interface ImageControlsProps {
  /** The active slot's photo, or `undefined` when none is set. */
  readonly entry: ImageEntry | undefined
  /** Upload (or replace) the photo from a chosen file. */
  readonly onUpload: (file: File) => void
  /** Remove the current photo. */
  readonly onRemove: () => void
  /** Set the photo's zoom multiplier (cover-fit = 1). */
  readonly onZoom: (scale: number) => void
  readonly uploadLabel: string
  readonly replaceLabel: string
  readonly removeLabel: string
  readonly zoomLabel: string
  /** Caption shown beneath the zoom slider telling the user they can drag the photo on the canvas. */
  readonly dragHint: string
}

export function ImageControls({
  entry,
  onUpload,
  onRemove,
  onZoom,
  uploadLabel,
  replaceLabel,
  removeLabel,
  zoomLabel,
  dragHint,
}: ImageControlsProps) {
  const hasImage = Boolean(entry)
  const scale = entry?.transform.scale ?? DEFAULT_IMAGE_TRANSFORM.scale

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) onUpload(file)
    // Reset so selecting the same file again still fires `change`.
    event.target.value = ''
  }

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Button
          component="label"
          variant="outlined"
          size="small"
          startIcon={<PhotoCameraIcon />}
        >
          {hasImage ? replaceLabel : uploadLabel}
          <input
            type="file"
            accept="image/*"
            hidden
            aria-label={hasImage ? replaceLabel : uploadLabel}
            onChange={handleFileChange}
          />
        </Button>

        <Button
          variant="text"
          size="small"
          color="inherit"
          startIcon={<DeleteOutlineIcon />}
          disabled={!hasImage}
          onClick={onRemove}
        >
          {removeLabel}
        </Button>
      </Stack>

      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: 'center', minWidth: 160 }}
      >
        <ZoomInIcon fontSize="small" color={hasImage ? 'inherit' : 'disabled'} />
        <Slider
          aria-label={zoomLabel}
          value={scale}
          min={1}
          max={MAX_ZOOM}
          step={0.01}
          disabled={!hasImage}
          onChange={(_, value) => onZoom(value as number)}
          color="primary"
          sx={{ flexGrow: 1 }}
        />
      </Stack>

      {/* Tells the user the photo itself can be dragged on the canvas to reposition. */}
      <Stack
        direction="row"
        spacing={0.75}
        sx={{ alignItems: 'center', color: 'text.secondary' }}
      >
        <OpenWithIcon fontSize="small" aria-hidden="true" />
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {dragHint}
        </Typography>
      </Stack>
    </Stack>
  )
}
