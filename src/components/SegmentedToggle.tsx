/**
 * Generic segmented pill control for a small set of mutually exclusive
 * options (e.g. the top bar's EN/CZ language switch, mockups/app-professional.html).
 * Each option renders as a button; the selected one is filled with the accent
 * color, the rest sit transparent. Keyboard activation (Enter/Space) is
 * handled natively by the underlying `<button>` via MUI's `ButtonBase`.
 */
import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'

export interface SegmentedOption<T extends string> {
  readonly value: T
  readonly label: string
}

export interface SegmentedToggleProps<T extends string> {
  readonly options: readonly SegmentedOption<T>[]
  readonly value: T
  readonly onChange: (value: T) => void
  readonly ariaLabel: string
}

export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: SegmentedToggleProps<T>) {
  return (
    <Box
      role="group"
      aria-label={ariaLabel}
      sx={(theme) => ({
        display: 'inline-flex',
        gap: '2px',
        p: '3px',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 999,
        bgcolor: theme.tokens.surface,
      })}
    >
      {options.map((option) => {
        const pressed = option.value === value

        return (
          <ButtonBase
            key={option.value}
            aria-pressed={pressed}
            onClick={() => onChange(option.value)}
            sx={{
              px: 1.5,
              py: 0.625,
              borderRadius: 999,
              fontSize: '12.5px',
              fontWeight: 600,
              letterSpacing: '0.02em',
              color: pressed ? 'primary.contrastText' : 'text.secondary',
              bgcolor: pressed ? 'primary.main' : 'transparent',
              transition: 'color 0.18s ease, background-color 0.18s ease',
              '&:focus-visible': {
                outline: '2px solid',
                outlineColor: 'primary.main',
                outlineOffset: '2px',
              },
            }}
          >
            {option.label}
          </ButtonBase>
        )
      })}
    </Box>
  )
}
