/**
 * App logo mark: an accent-filled rounded square containing a white calendar
 * glyph. Purely presentational — no text, no interaction — used in the top
 * bar next to the "CalendarMaker" wordmark (mockups/app-professional.html).
 */
import Box from '@mui/material/Box'

export interface BrandMarkProps {
  /** Outer square's side length, in px. Defaults to 32. */
  size?: number
}

export function BrandMark({ size = 32 }: BrandMarkProps) {
  // The glyph itself is drawn at a smaller, fixed size and centered in the
  // square, matching the mockup's proportions (18px glyph in a 32px mark).
  const glyphSize = Math.round(size * 0.5625)

  return (
    <Box
      sx={(theme) => ({
        width: size,
        height: size,
        borderRadius: `${theme.tokens.radius.sm}px`,
        // Accent → accent700 diagonal fill with a soft resting shadow and an
        // inner top highlight, matching the mockup's .brand-mark.
        backgroundImage: `linear-gradient(145deg, ${theme.palette.primary.main}, ${theme.tokens.accent700})`,
        boxShadow: `${theme.tokens.shadow.sm}, inset 0 1px 0 rgba(255,255,255,0.14)`,
        display: 'grid',
        placeItems: 'center',
        flex: 'none',
      })}
    >
      <svg
        aria-hidden="true"
        width={glyphSize}
        height={glyphSize}
        viewBox="0 0 24 24"
        fill="none"
      >
        {/* Calendar body outline */}
        <rect x="3.5" y="5" width="17" height="15" rx="2.5" stroke="#fff" strokeWidth="1.6" />
        {/* Rule separating the header strip from the day grid */}
        <path d="M3.5 9.5H20.5" stroke="#fff" strokeWidth="1.6" />
        {/* Hanger ticks on top */}
        <path
          d="M8 3.2V6.4M16 3.2V6.4"
          stroke="#fff"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        {/* Single filled day cell */}
        <rect x="14.6" y="13" width="3.2" height="3.2" rx="0.7" fill="#fff" />
      </svg>
    </Box>
  )
}
