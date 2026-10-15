/**
 * MUI theme factory. Professional, editorial chrome per the restyle mockup
 * (mockups/app-professional.html): a warm paper canvas, a deep-blue accent, and
 * a two-font system — Hanken Grotesk for UI text, Fraunces for display
 * headings (both loaded via a Google Fonts <link> in index.html, so there is no
 * runtime font dependency). Light and dark variants share the same structure so
 * the calendar's own colors read true against either chrome.
 *
 * This file is the SINGLE SOURCE OF TRUTH for the design system. Beyond the
 * standard MUI palette/shape/typography, it carries a typed `theme.tokens` bag
 * (see `AppTokens`) that holds the extra design tokens documented in
 * docs/design.md. Components read tokens from the theme via
 * `sx={(theme) => ({ ... })}` so a future token change here flows everywhere.
 */
import { createTheme } from '@mui/material/styles'
import type { Theme } from '@mui/material/styles'

import { DISPLAY_FONT, UI_FONT } from './fonts'

export type ThemeMode = 'light' | 'dark'

/**
 * Extra design tokens carried on the theme as `theme.tokens`. These complement
 * the MUI palette (which already owns primary/secondary/divider/background/text)
 * with the values the mockup needs that MUI has no first-class slot for.
 *
 * Some tokens have a live consumer today (see docs/design.md "wired" list);
 * the rest are defined-and-available for the design system's future use. That
 * is intentional — not dead code — so the whole token set lives in one place.
 */
export interface AppTokens {
  /** Chrome surface for panels/rails (distinct from MUI `background.paper`). */
  readonly surface: string
  /** Subtler divider, for rules within a region. */
  readonly hairline2: string
  /** Accent hover/pressed. */
  readonly accent700: string
  /** Accent on muted contexts / secondary accent text. */
  readonly accent300: string
  /** Accent-tinted background (selected row, subtle highlight). */
  readonly accentTint: string
  /** Weekend cell background. */
  readonly weekendTint: string
  /** Corner radii scale. */
  readonly radius: { readonly sm: number; readonly md: number; readonly lg: number }
  /** Elevation shadows. */
  readonly shadow: { readonly sm: string; readonly md: string; readonly page: string }
  /** Fixed chrome dimensions. */
  readonly layout: {
    readonly railWidth: number
    readonly panelWidth: number
    readonly barHeight: number
  }
}

// Make `theme.tokens` a first-class, typed part of the MUI theme.
declare module '@mui/material/styles' {
  interface Theme {
    tokens: AppTokens
  }
  interface ThemeOptions {
    tokens?: AppTokens
  }
}

/**
 * UI text stack. Hanken Grotesk is the body/label face; the rest are graceful
 * system fallbacks for the moment before the webfont lands. Built from
 * `UI_FONT` in ./fonts so the family name has a single source of truth.
 */
const UI_FONT_FAMILY = `'${UI_FONT}', ui-sans-serif, system-ui, sans-serif`

/**
 * Display stack for headings. Fraunces is a high-contrast serif that gives the
 * app its editorial voice; Georgia is the closest ubiquitous fallback. Built
 * from `DISPLAY_FONT` in ./fonts so the family name has a single source of truth.
 */
const DISPLAY_FONT_FAMILY = `'${DISPLAY_FONT}', Georgia, serif`

/** Corner radii scale from the mockup. Not theme-mode dependent. */
const RADIUS = { sm: 6, md: 10, lg: 14 } as const

/** Fixed chrome dimensions from the mockup. Not theme-mode dependent. */
const LAYOUT = { railWidth: 136, panelWidth: 312, barHeight: 60 } as const

export function createAppTheme(mode: ThemeMode): Theme {
  const isDark = mode === 'dark'

  // Design tokens, resolved per mode. Names mirror the mockup's CSS variables.
  const palette = isDark
    ? {
        paper: '#14161A', // background.default (canvas)
        surface: '#1A1D22', // tokens.surface (chrome panels/rails)
        surface2: '#212429', // background.paper (raised surfaces)
        accent: '#6E92C4', // primary (deep blue, lightened for dark)
        accent700: '#5B7FB2', // tokens.accent700 (hover/pressed)
        accent300: '#8FADD6', // tokens.accent300 (muted/secondary accent)
        accentTint: '#233349', // tokens.accentTint (tinted background)
        weekend: '#E09578', // secondary (terracotta weekend highlight)
        weekendTint: '#2E2521', // tokens.weekendTint (weekend cell background)
        hairline: '#2C3036', // divider / borders
        hairline2: '#24282D', // tokens.hairline2 (subtler dividers)
        ink: '#ECECE6', // text.primary
        inkSoft: '#AAB0BA', // text.secondary
        shadow: {
          sm: '0 1px 2px rgba(0,0,0,.3)',
          md: '0 2px 6px rgba(0,0,0,.35), 0 10px 28px rgba(0,0,0,.4)',
          page: '0 10px 30px rgba(0,0,0,.45), 0 30px 70px rgba(0,0,0,.35)',
        },
      }
    : {
        paper: '#F4F2EC', // background.default (warm paper canvas)
        surface: '#FBFAF7', // tokens.surface (chrome panels/rails)
        surface2: '#FFFFFF', // background.paper (raised surfaces)
        accent: '#1E3A5F', // primary (deep editorial blue)
        accent700: '#152C49', // tokens.accent700 (hover/pressed)
        accent300: '#4C6B93', // tokens.accent300 (muted/secondary accent)
        accentTint: '#E8EDF4', // tokens.accentTint (tinted background)
        weekend: '#A8432A', // secondary (terracotta weekend highlight)
        weekendTint: '#F6EDE8', // tokens.weekendTint (weekend cell background)
        hairline: '#E1DED5', // divider / borders
        hairline2: '#EDEBE3', // tokens.hairline2 (subtler dividers)
        ink: '#1C2024', // text.primary
        inkSoft: '#565D67', // text.secondary
        shadow: {
          sm: '0 1px 2px rgba(28,32,36,.05), 0 1px 1px rgba(28,32,36,.04)',
          md: '0 2px 6px rgba(28,32,36,.06), 0 8px 24px rgba(28,32,36,.07)',
          page: '0 1px 1px rgba(28,32,36,.04), 0 10px 30px rgba(28,32,36,.10), 0 30px 60px rgba(28,32,36,.08)',
        },
      }

  const tokens: AppTokens = {
    surface: palette.surface,
    hairline2: palette.hairline2,
    accent700: palette.accent700,
    accent300: palette.accent300,
    accentTint: palette.accentTint,
    weekendTint: palette.weekendTint,
    radius: RADIUS,
    shadow: palette.shadow,
    layout: LAYOUT,
  }

  return createTheme({
    tokens,
    palette: {
      mode,
      background: {
        default: palette.paper,
        paper: palette.surface2,
      },
      primary: {
        main: palette.accent,
      },
      // Exposed as the secondary color so the weekend highlight stays themable
      // from the calendar controls rather than being hard-coded at the callsite.
      secondary: {
        main: palette.weekend,
      },
      divider: palette.hairline,
      text: {
        primary: palette.ink,
        secondary: palette.inkSoft,
      },
    },
    shape: { borderRadius: tokens.radius.md },
    typography: {
      fontFamily: UI_FONT_FAMILY,
      // Headings carry the Fraunces display voice. Weights step down as the
      // headings get smaller, matching the editorial hierarchy in the mockup.
      h1: { fontFamily: DISPLAY_FONT_FAMILY, fontWeight: 600 },
      h2: { fontFamily: DISPLAY_FONT_FAMILY, fontWeight: 600 },
      h3: { fontFamily: DISPLAY_FONT_FAMILY, fontWeight: 600 },
      h4: { fontFamily: DISPLAY_FONT_FAMILY, fontWeight: 600 },
      h5: { fontFamily: DISPLAY_FONT_FAMILY, fontWeight: 600 },
      h6: { fontFamily: DISPLAY_FONT_FAMILY, fontWeight: 700 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          // Native form controls do not inherit font-family by default, so
          // CssBaseline leaves them on the UA default (Arial) even though
          // typography.fontFamily above covers everything else. Force
          // inherit so buttons/inputs/selects/textareas use Hanken Grotesk.
          'button, input, optgroup, select, textarea': { fontFamily: 'inherit' },
        },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0, color: 'default' },
        styleOverrides: {
          root: {
            // Flat chrome: no gradient overlay, just a hairline rule below.
            backgroundImage: 'none',
            borderBottom: '1px solid',
            borderColor: palette.hairline,
            minHeight: tokens.layout.barHeight,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          // Kill MUI's elevation gradient so surfaces stay flat and token-true.
          root: { backgroundImage: 'none' },
        },
      },
      MuiButton: {
        styleOverrides: {
          // sm radius + no shouty uppercase, per the mockup's button style.
          root: { borderRadius: tokens.radius.sm, textTransform: 'none' },
        },
      },
    },
  })
}
