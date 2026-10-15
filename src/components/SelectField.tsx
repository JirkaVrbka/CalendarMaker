/**
 * Token-driven select matching the mockup's `.select-wrap` + `select` rule
 * (mockups/app-professional.html): a native `<select>` with its default chrome
 * stripped (`appearance: none`), styled like `TextInput`, plus a chevron SVG
 * pinned to the right. Kept native so keyboard and screen-reader behavior come
 * for free. `children` are the `<option>`s; pair it with `Field` for the label.
 */
import Box from '@mui/material/Box'

export interface SelectFieldProps {
  value: string | number
  /** Fires with the selected option's value (always a string). */
  onChange: (value: string) => void
  /** Associates the select with a `Field`'s label via `htmlFor`. */
  id?: string
  'aria-label'?: string
  children: React.ReactNode
}

export function SelectField({
  value,
  onChange,
  id,
  'aria-label': ariaLabel,
  children,
}: SelectFieldProps) {
  return (
    <Box sx={{ position: 'relative' }}>
      <Box
        component="select"
        id={id}
        value={value}
        aria-label={ariaLabel}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
        sx={(theme) => ({
          appearance: 'none',
          WebkitAppearance: 'none',
          width: '100%',
          fontFamily: 'inherit',
          fontSize: '13px',
          fontWeight: 500,
          color: 'text.primary',
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '9px',
          // Extra right padding leaves room for the chevron.
          pl: '12px',
          pr: '34px',
          py: '9px',
          cursor: 'pointer',
          boxShadow: theme.tokens.shadow.sm,
          transition: 'border-color .15s ease',
          '&:hover': { borderColor: theme.tokens.accent300 },
        })}
      >
        {children}
      </Box>
      {/* Chevron-down, absolutely positioned and non-interactive so clicks fall
          through to the native select. */}
      <Box
        component="svg"
        aria-hidden="true"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        sx={{
          position: 'absolute',
          right: '11px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'text.secondary',
          opacity: 0.7,
          pointerEvents: 'none',
        }}
      >
        <path d="m6 9 6 6 6-6" />
      </Box>
    </Box>
  )
}
