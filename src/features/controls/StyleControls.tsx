/**
 * Whole-calendar style controls: a MUI font Select over the curated set (each
 * option previewed in its own font) plus four color pickers (text, Saturday,
 * Sunday, background), each a native `<input type="color">` with a few presets.
 * No new dependency — the font list is `FONT_OPTIONS`, colors are the native
 * input. All state lives in the store; `App` wires these to `setStyle`, so a
 * change updates every page live and rides the existing config autosave.
 */
import Box from '@mui/material/Box'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import { FONT_OPTIONS } from '../../app/fonts'
import type { CalendarStyle } from '../../types/calendar'

/** A small shared palette offered as quick-pick swatches on every color field. */
const PRESET_SWATCHES: readonly string[] = [
  '#1f2933', // ink
  '#ffffff', // white
  '#4c6ef5', // blue
  '#e03131', // red
  '#2f9e44', // green
  '#f08c00', // amber
]

export interface StyleControlsLabels {
  readonly fontLabel: string
  readonly textColorLabel: string
  readonly saturdayColorLabel: string
  readonly sundayColorLabel: string
  readonly backgroundColorLabel: string
}

/** The style color fields the controls can patch. */
export type StyleColorKey =
  | 'textColor'
  | 'saturdayColor'
  | 'sundayColor'
  | 'backgroundColor'

export interface StyleControlsProps {
  readonly style: CalendarStyle
  /** Pick a font family (already loaded by `App`; see fonts-ready handling). */
  readonly onFontChange: (fontFamily: string) => void
  /** Patch one color field. */
  readonly onColorChange: (key: StyleColorKey, value: string) => void
  readonly labels: StyleControlsLabels
}

interface ColorFieldProps {
  readonly label: string
  readonly value: string
  readonly onChange: (value: string) => void
}

/** A labeled native color input with preset-swatch quick picks. */
function ColorField({ label, value, onChange }: ColorFieldProps) {
  return (
    <Stack spacing={0.5} sx={{ minWidth: 132 }}>
      <Typography
        variant="caption"
        component="label"
        sx={{ color: 'text.secondary' }}
      >
        {label}
      </Typography>
      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
        <Box
          component="input"
          type="color"
          aria-label={label}
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onChange(e.target.value)
          }
          sx={{
            width: 36,
            height: 32,
            p: 0,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            background: 'none',
            cursor: 'pointer',
          }}
        />
        <Stack direction="row" spacing={0.5}>
          {PRESET_SWATCHES.map((preset) => (
            <Tooltip key={preset} title={preset}>
              <Box
                component="button"
                type="button"
                aria-label={`${label}: ${preset}`}
                onClick={() => onChange(preset)}
                sx={{
                  width: 18,
                  height: 18,
                  p: 0,
                  bgcolor: preset,
                  border: '1px solid',
                  borderColor:
                    preset.toLowerCase() === value.toLowerCase()
                      ? 'primary.main'
                      : 'divider',
                  borderRadius: '50%',
                  cursor: 'pointer',
                }}
              />
            </Tooltip>
          ))}
        </Stack>
      </Stack>
    </Stack>
  )
}

export function StyleControls({
  style,
  onFontChange,
  onColorChange,
  labels,
}: StyleControlsProps) {
  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{ alignItems: 'flex-end', flexWrap: 'wrap', gap: 1.5 }}
    >
      <TextField
        select
        label={labels.fontLabel}
        value={style.fontFamily}
        onChange={(e) => onFontChange(e.target.value)}
        size="small"
        sx={{ minWidth: 170 }}
      >
        {FONT_OPTIONS.map((font) => (
          <MenuItem
            key={font.cssFamily}
            value={font.cssFamily}
            sx={{ fontFamily: `'${font.cssFamily}', sans-serif` }}
          >
            {font.label}
          </MenuItem>
        ))}
      </TextField>

      <ColorField
        label={labels.textColorLabel}
        value={style.textColor}
        onChange={(v) => onColorChange('textColor', v)}
      />
      <ColorField
        label={labels.saturdayColorLabel}
        value={style.saturdayColor}
        onChange={(v) => onColorChange('saturdayColor', v)}
      />
      <ColorField
        label={labels.sundayColorLabel}
        value={style.sundayColor}
        onChange={(v) => onColorChange('sundayColor', v)}
      />
      <ColorField
        label={labels.backgroundColorLabel}
        value={style.backgroundColor}
        onChange={(v) => onColorChange('backgroundColor', v)}
      />
    </Stack>
  )
}
