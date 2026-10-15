/**
 * Panel field wrapper: a label row (label on the left, an optional readout value
 * on the right) sitting above the field's control. Matches the mockup's
 * `.field > label` / `.val` rules (mockups/app-professional.html) so every panel
 * input shares one label voice. Spacing between fields is left to the caller
 * (wrap several in a gapped container) so this stays layout-agnostic.
 */
import Box from '@mui/material/Box'

export interface FieldProps {
  /** Label text shown on the left of the label row. */
  label: string
  /**
   * Optional readout shown on the right of the label row (e.g. a "150%" value).
   * Styled as the mockup's `.val`: small, muted, tabular numerals.
   */
  value?: React.ReactNode
  /**
   * `id` of the control this field labels. When set, the label associates to it
   * so clicking the label focuses the control and screen readers name it.
   */
  htmlFor?: string
  /** The field's control (input, select, slider, swatch row, ...). */
  children: React.ReactNode
}

export function Field({ label, value, htmlFor, children }: FieldProps) {
  return (
    <Box>
      <Box
        component="label"
        htmlFor={htmlFor}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          fontWeight: 600,
          color: 'text.secondary',
          mb: '7px',
        }}
      >
        <Box component="span">{label}</Box>
        {value != null && (
          <Box
            component="span"
            // The mockup's `.val` readout: ink-faint (text.secondary at ~0.7),
            // tabular numerals so a changing value does not reflow.
            sx={{
              fontSize: '11.5px',
              fontWeight: 600,
              color: 'text.secondary',
              opacity: 0.7,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {value}
          </Box>
        )}
      </Box>
      {children}
    </Box>
  )
}
