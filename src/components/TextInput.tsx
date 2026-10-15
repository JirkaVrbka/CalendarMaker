/**
 * Token-driven text input matching the mockup's `.textin` rule
 * (mockups/app-professional.html): surface-2 background, hairline border, soft
 * shadow, and an accent focus ring. MUI's Material `TextField` has a different
 * look, so this is a thin styled native `<input>` instead. Pair it with `Field`
 * for the label row and forward the same `id` as the label's `htmlFor`.
 */
import Box from '@mui/material/Box'

export interface TextInputProps {
  value: string
  /** Fires with the raw input value on every change. */
  onChange: (value: string) => void
  placeholder?: string
  /** Associates the input with a `Field`'s label via `htmlFor`. */
  id?: string
  type?: string
  'aria-label'?: string
}

export function TextInput({
  value,
  onChange,
  placeholder,
  id,
  type = 'text',
  'aria-label': ariaLabel,
}: TextInputProps) {
  return (
    <Box
      component="input"
      id={id}
      type={type}
      value={value}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      sx={(theme) => ({
        width: '100%',
        fontFamily: 'inherit',
        fontSize: '13px',
        color: 'text.primary',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '9px',
        px: '12px',
        py: '9px',
        boxShadow: theme.tokens.shadow.sm,
        transition: 'border-color .15s ease, box-shadow .15s ease',
        '&::placeholder': { color: 'text.secondary', opacity: 0.7 },
        '&:hover': { borderColor: theme.tokens.accent300 },
        '&:focus-visible': {
          borderColor: 'primary.main',
          outline: 'none',
          boxShadow: `0 0 0 3px ${theme.tokens.accentTint}`,
        },
      })}
    />
  )
}
