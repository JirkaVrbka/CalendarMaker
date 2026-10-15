/**
 * Calendar color controls, restyled to match the professional mockup
 * (mockups/app-professional.html): each color field is a SWATCH ROW — a few
 * circular preset buttons plus a trailing "custom" tile that wraps a native
 * `<input type="color">`, so arbitrary colors still work. Split out of the old
 * `StyleControls` so the controls panel can group colors into their own
 * section. All state lives in the store; `App` wires these to `setStyle`, so a
 * change updates every page live and rides the config autosave.
 */
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'

import { Field } from '../../components/Field'

/**
 * Preset palettes per color field, taken from the mockup's swatch rows. The
 * trailing "custom" tile keeps arbitrary colors available, so these are quick
 * picks rather than the full range.
 */
const BACKGROUND_PRESETS: readonly string[] = ['#FBFAF7', '#EEEAE0', '#1C2024', '#1E3A5F']
const WEEKEND_PRESETS: readonly string[] = ['#A8432A', '#C2410C', '#1E3A5F', '#4D7C5A']
const TEXT_PRESETS: readonly string[] = ['#1C2024', '#565D67', '#1E3A5F', '#FBFAF7']

/** The style color fields the controls can patch. */
export type StyleColorKey =
  | 'textColor'
  | 'saturdayColor'
  | 'sundayColor'
  | 'backgroundColor'

export interface ColorControlsLabels {
  readonly textColorLabel: string
  readonly saturdayColorLabel: string
  readonly sundayColorLabel: string
  readonly backgroundColorLabel: string
}

export interface ColorControlsProps {
  readonly textColor: string
  readonly saturdayColor: string
  readonly sundayColor: string
  readonly backgroundColor: string
  /** Patch one color field. */
  readonly onColorChange: (key: StyleColorKey, value: string) => void
  readonly labels: ColorControlsLabels
}

interface ColorFieldProps {
  readonly label: string
  readonly value: string
  readonly presets: readonly string[]
  readonly onChange: (value: string) => void
}

/** True when two CSS hex colors are the same, case-insensitively. */
function sameColor(a: string, b: string) {
  return a.toLowerCase() === b.toLowerCase()
}

/**
 * A labeled swatch row: preset buttons (pressed + accent ring when the preset is
 * the current value) plus a trailing custom tile wrapping a native color input.
 */
function ColorField({ label, value, presets, onChange }: ColorFieldProps) {
  const customIsActive = !presets.some((preset) => sameColor(preset, value))

  return (
    <Field label={label}>
      <Box
        role="group"
        aria-label={label}
        sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}
      >
        {presets.map((preset) => {
          const active = sameColor(preset, value)
          return (
            <Box
              key={preset}
              component="button"
              type="button"
              aria-label={`${label}: ${preset}`}
              aria-pressed={active}
              onClick={() => onChange(preset)}
              sx={(theme) => ({
                width: 28,
                height: 28,
                p: 0,
                bgcolor: preset,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '50%',
                cursor: 'pointer',
                transition: 'box-shadow .15s ease, transform .15s ease',
                boxShadow: active
                  ? `0 0 0 2px ${theme.tokens.surface}, 0 0 0 4px ${theme.palette.primary.main}`
                  : 'none',
                '&:hover': { transform: 'translateY(-1px)' },
              })}
            />
          )
        })}

        {/* Custom tile: wraps the native color input so any color still works. */}
        <Box
          component="label"
          sx={(theme) => ({
            position: 'relative',
            width: 28,
            height: 28,
            display: 'grid',
            placeItems: 'center',
            borderRadius: '50%',
            border: '1px solid',
            borderColor: customIsActive ? 'primary.main' : 'divider',
            cursor: 'pointer',
            overflow: 'hidden',
            color: 'text.secondary',
            bgcolor: customIsActive ? value : theme.tokens.accentTint,
            boxShadow: customIsActive
              ? `0 0 0 2px ${theme.tokens.surface}, 0 0 0 4px ${theme.palette.primary.main}`
              : 'none',
          })}
        >
          {!customIsActive && (
            <Box
              component="span"
              aria-hidden="true"
              sx={{ fontSize: 16, lineHeight: 1, pointerEvents: 'none' }}
            >
              +
            </Box>
          )}
          <Box
            component="input"
            type="color"
            aria-label={`${label}: custom`}
            value={value}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange(e.target.value)
            }
            sx={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              p: 0,
              border: 0,
              cursor: 'pointer',
            }}
          />
        </Box>
      </Box>
    </Field>
  )
}

export function ColorControls({
  textColor,
  saturdayColor,
  sundayColor,
  backgroundColor,
  onColorChange,
  labels,
}: ColorControlsProps) {
  return (
    <Stack spacing={2}>
      <ColorField
        label={labels.backgroundColorLabel}
        value={backgroundColor}
        presets={BACKGROUND_PRESETS}
        onChange={(v) => onColorChange('backgroundColor', v)}
      />
      <ColorField
        label={labels.saturdayColorLabel}
        value={saturdayColor}
        presets={WEEKEND_PRESETS}
        onChange={(v) => onColorChange('saturdayColor', v)}
      />
      <ColorField
        label={labels.sundayColorLabel}
        value={sundayColor}
        presets={WEEKEND_PRESETS}
        onChange={(v) => onColorChange('sundayColor', v)}
      />
      <ColorField
        label={labels.textColorLabel}
        value={textColor}
        presets={TEXT_PRESETS}
        onChange={(v) => onColorChange('textColor', v)}
      />
    </Stack>
  )
}
