/**
 * Right-hand editor panel container. Deliberately dumb: it just lays out a
 * list of sections, each wrapped in the reusable `CollapsiblePanelSection`
 * accordion. The App is the single place that decides what sections exist
 * and wires their content to the store — this component owns no state of
 * its own beyond what `CollapsiblePanelSection` already manages per section.
 */
import Box from '@mui/material/Box'

import { CollapsiblePanelSection } from '../../components/CollapsiblePanelSection'

export interface ControlsSection {
  /**
   * Stable, language-independent key for the section. Used as the React `key`
   * so switching language (which changes `title`) does not remount the section
   * and wipe the user's manual expand/collapse state.
   */
  readonly id: string
  /** Section heading (display only), passed through to `CollapsiblePanelSection`. */
  readonly title: string
  /** Whether the section starts expanded. Defaults to `true`. */
  readonly defaultOpen?: boolean
  /** Optional small icon rendered (muted) before the section title. */
  readonly icon?: React.ReactNode
  /** The controls rendered inside the section body. */
  readonly content: React.ReactNode
}

export interface ControlsPanelProps {
  /** Sections to render, in order, top to bottom. */
  readonly sections: readonly ControlsSection[]
  /** Accessible name for the panel region (e.g. "Controls"). */
  readonly ariaLabel?: string
  /**
   * Optional header rendered sticky at the top of the scrolling panel, above
   * the sections. Used for the "editing page N of 13" context head.
   */
  readonly head?: React.ReactNode
}

export function ControlsPanel({ sections, ariaLabel, head }: ControlsPanelProps) {
  return (
    <Box
      component="aside"
      role="region"
      aria-label={ariaLabel}
      sx={{ height: '100%', overflowY: 'auto' }}
    >
      {head != null && (
        <Box
          sx={(theme) => ({
            position: 'sticky',
            top: 0,
            zIndex: 4,
            px: 2.25,
            pt: 2,
            pb: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
            // Translucent surface + blur so content scrolls softly beneath it,
            // matching the mockup's .panel-head.
            backgroundColor: `color-mix(in srgb, ${theme.tokens.surface} 92%, transparent)`,
            backdropFilter: 'blur(6px)',
          })}
        >
          {head}
        </Box>
      )}
      {sections.map(({ id, title, defaultOpen, icon, content }) => (
        <CollapsiblePanelSection
          key={id}
          title={title}
          icon={icon}
          defaultOpen={defaultOpen ?? true}
        >
          {content}
        </CollapsiblePanelSection>
      ))}
    </Box>
  )
}
