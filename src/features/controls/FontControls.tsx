/**
 * Typography controls: the font-family pick list (a vertical list of selectable
 * buttons, each previewing its own family) plus a font-size slider that scales
 * ALL calendar text. Split out of the old `StyleControls` so the controls panel
 * can group typography into its own section. All state lives in the store; `App`
 * wires these to `setStyle`, so a change updates every page live and rides the
 * config autosave. The slider drives `CalendarStyle.fontScale` (1 = baseline).
 */
import Box from '@mui/material/Box'
import Slider from '@mui/material/Slider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { Field } from '../../components/Field'
import { FONT_OPTIONS } from '../../app/fonts'

/** Font-scale slider bounds, matching `CalendarStyle.fontScale` (1 = baseline). */
const FONT_SCALE_MIN = 0.6
const FONT_SCALE_MAX = 2
const FONT_SCALE_STEP = 0.05

export interface FontControlsLabels {
  readonly fontLabel: string
  readonly fontSizeLabel: string
}

export interface FontControlsProps {
  /** The current CSS font family (one of `FONT_OPTIONS`). */
  readonly fontFamily: string
  /** Pick a font family (already loaded by `App`; see fonts-ready handling). */
  readonly onFontChange: (fontFamily: string) => void
  /** The current font-size multiplier (1 = baseline). */
  readonly fontScale: number
  /** Set the font-size multiplier. */
  readonly onFontScaleChange: (scale: number) => void
  readonly labels: FontControlsLabels
}

export function FontControls({
  fontFamily,
  onFontChange,
  fontScale,
  onFontScaleChange,
  labels,
}: FontControlsProps) {
  return (
    <Stack spacing={2}>
      {/* Font family: a vertical pick list, each option in its own face. */}
      <Stack spacing={0.75}>
        <Typography
          variant="caption"
          component="span"
          sx={{ color: 'text.secondary', fontWeight: 600 }}
        >
          {labels.fontLabel}
        </Typography>
        <Stack
          role="group"
          aria-label={labels.fontLabel}
          spacing={0.75}
          sx={{ maxHeight: 232, overflowY: 'auto', pr: 0.5 }}
        >
          {FONT_OPTIONS.map((font) => {
            const active = fontFamily === font.cssFamily
            return (
              <Box
                key={font.cssFamily}
                component="button"
                type="button"
                aria-pressed={active}
                onClick={() => onFontChange(font.cssFamily)}
                sx={(theme) => ({
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  textAlign: 'left',
                  px: 1.5,
                  py: 1,
                  border: '1px solid',
                  borderColor: active ? 'primary.main' : 'divider',
                  borderRadius: `${theme.tokens.radius.md}px`,
                  bgcolor: active ? theme.tokens.accentTint : 'background.paper',
                  color: 'text.primary',
                  cursor: 'pointer',
                  fontFamily: `'${font.cssFamily}', sans-serif`,
                  fontSize: 17,
                  lineHeight: 1.2,
                  transition: 'border-color .15s ease, background .15s ease',
                  '&:hover': { borderColor: theme.tokens.accent300 },
                })}
              >
                {font.label}
              </Box>
            )
          })}
        </Stack>
      </Stack>

      {/* Font size: scales all calendar text; a live % readout sits by the label. */}
      <Field
        label={labels.fontSizeLabel}
        value={`${Math.round(fontScale * 100)}%`}
      >
        <Slider
          aria-label={labels.fontSizeLabel}
          value={fontScale}
          min={FONT_SCALE_MIN}
          max={FONT_SCALE_MAX}
          step={FONT_SCALE_STEP}
          onChange={(_, value) => onFontScaleChange(value as number)}
          color="primary"
        />
      </Field>
    </Stack>
  )
}
