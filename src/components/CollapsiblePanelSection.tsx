/**
 * Reusable accordion section for the controls panel: a full-width header
 * button (title + chevron) that toggles a `Collapse`d body. Used to group
 * related controls (colors, fonts, image, start month, language, ...) so the
 * panel stays scannable without scrolling through everything at once.
 */
import { useId, useState } from 'react'

import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import Collapse from '@mui/material/Collapse'
import Typography from '@mui/material/Typography'

export interface CollapsiblePanelSectionProps {
  /** Section heading shown in the header button. */
  title: string
  /**
   * Optional small icon rendered (muted) immediately before the title, matching
   * the mockup's group labels. Decorative — the title still names the section.
   */
  icon?: React.ReactNode
  /** Whether the section starts expanded. Defaults to `true`. */
  defaultOpen?: boolean
  children: React.ReactNode
}

/** Reads `prefers-reduced-motion` defensively (jsdom may not implement `matchMedia`). */
function prefersReducedMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function CollapsiblePanelSection({
  title,
  icon,
  defaultOpen = true,
  children,
}: CollapsiblePanelSectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const bodyId = useId()
  const collapseTimeout = prefersReducedMotion() ? 0 : undefined

  function handleToggle() {
    setOpen((current) => !current)
  }

  return (
    <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
      <ButtonBase
        onClick={handleToggle}
        aria-expanded={open}
        aria-controls={bodyId}
        sx={{
          width: '100%',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          textAlign: 'left',
        }}
      >
        <Box
          component="span"
          sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, minWidth: 0 }}
        >
          {icon != null && (
            <Box
              component="span"
              aria-hidden="true"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                // Accent-colored icon, matching the mockup's `.gtitle svg`.
                color: 'primary.main',
              }}
            >
              {icon}
            </Box>
          )}
          <Typography
            component="span"
            // Small uppercase UI-font label, matching the mockup's `.gtitle` —
            // deliberately NOT the Fraunces display voice (these are compact
            // section labels, not headings).
            sx={{
              fontSize: '10.5px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'text.secondary',
            }}
          >
            {title}
          </Typography>
        </Box>
        <ExpandMoreIcon
          fontSize="small"
          sx={{
            transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'transform 0.2s ease',
          }}
        />
      </ButtonBase>
      <Collapse in={open} timeout={collapseTimeout}>
        <Box id={bodyId} sx={{ px: 2, pb: 2 }}>
          {children}
        </Box>
      </Collapse>
    </Box>
  )
}
