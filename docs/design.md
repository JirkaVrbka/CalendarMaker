# Design System

CalendarMaker's visual direction is "professional" — calm graphite neutrals, a deep ink-blue accent,
and a terracotta weekend highlight — taken from the `mockups/app-professional.html` mockup.

**Single source of truth:** `src/app/theme.ts` (the MUI theme factory) is where the design tokens are
defined — in the MUI palette/shape/typography and in a typed `theme.tokens` bag. This document is a
mirror/reference for humans and agents — it explains *what* the tokens mean and the rules for using
them, but it is not itself read by the app.

Not every token has a component reading it yet. The tables below are the full, intended token set; the
**Token status** section after them says exactly which tokens are wired into components today, which are
defined-and-available in `theme.tokens` for future use, and which are documented for direction but not
yet in `theme.ts`. Defined-but-unused tokens are intentional (a coherent design system kept in one
place), not dead code.

**Rule:** when a token changes, change it in `src/app/theme.ts` first, then update the matching value
in this doc in the same change. Treat a mismatch between the two as a bug.

## Tokens — Light

| Token | Value | Use |
| --- | --- | --- |
| `paper` | `#F4F2EC` | App background (MUI `background.default`) |
| `surface` | `#FBFAF7` | Chrome panels/rails (`theme.tokens.surface`) |
| `surface-2` | `#FFFFFF` | Raised surfaces inside a panel, incl. the calendar page (MUI `background.paper`) |
| `ink` | `#1C2024` | Primary text |
| `ink-soft` | `#565D67` | Secondary text, labels |
| `ink-faint` | `#8B919C` | Placeholder/disabled text, helper copy |
| `hairline` | `#E1DED5` | Primary dividers/borders between regions |
| `hairline-2` | `#EDEBE3` | Subtler dividers (within a region) |
| `accent` | `#1E3A5F` | Primary actions, selection ring, active state |
| `accent-700` | `#152C49` | Accent hover/pressed |
| `accent-300` | `#4C6B93` | Accent on dark/muted contexts, secondary accent text |
| `accent-tint` | `#E8EDF4` | Accent-tinted backgrounds (selected row, subtle highlight) |
| `weekend` | `#A8432A` | Weekend day numbers/markers on the calendar grid |
| `weekend-tint` | `#F6EDE8` | Weekend cell background |
| `radius-sm` | `6px` | Small controls (chips, inputs) |
| `radius-md` | `10px` | Buttons, cards |
| `radius-lg` | `14px` | Panels, the calendar page |
| `shadow-sm` | `0 1px 2px rgba(28,32,36,.05), 0 1px 1px rgba(28,32,36,.04)` | Resting elevation (buttons, chips) |
| `shadow-md` | `0 2px 6px rgba(28,32,36,.06), 0 8px 24px rgba(28,32,36,.07)` | Panels, popovers |
| `shadow-page` | `0 1px 1px rgba(28,32,36,.04), 0 10px 30px rgba(28,32,36,.10), 0 30px 60px rgba(28,32,36,.08)` | The calendar page/canvas (the hero element) |
| `rail-w` | `136px` | Page-navigator rail width |
| `panel-w` | `312px` | Right controls panel width |
| `bar-h` | `60px` | Top app bar height |

## Tokens — Dark

| Token | Value | Use |
| --- | --- | --- |
| `paper` | `#14161A` | App background |
| `surface` | `#1A1D22` | Panels, cards |
| `surface-2` | `#212429` | Raised surfaces inside a panel |
| `ink` | `#ECECE6` | Primary text |
| `ink-soft` | `#AAB0BA` | Secondary text, labels |
| `ink-faint` | `#747B86` | Placeholder/disabled text, helper copy |
| `hairline` | `#2C3036` | Primary dividers/borders |
| `hairline-2` | `#24282D` | Subtler dividers |
| `accent` | `#6E92C4` | Primary actions, selection ring, active state |
| `accent-700` | `#5B7FB2` | Accent hover/pressed |
| `accent-300` | `#8FADD6` | Accent on muted contexts, secondary accent text |
| `accent-tint` | `#233349` | Accent-tinted backgrounds |
| `weekend` | `#E09578` | Weekend day numbers/markers |
| `weekend-tint` | `#2E2521` | Weekend cell background |
| `shadow-sm` | `0 1px 2px rgba(0,0,0,.3)` | Resting elevation |
| `shadow-md` | `0 2px 6px rgba(0,0,0,.35), 0 10px 28px rgba(0,0,0,.4)` | Panels, popovers |
| `shadow-page` | `0 10px 30px rgba(0,0,0,.45), 0 30px 70px rgba(0,0,0,.35)` | The calendar page/canvas |

Radii (`radius-sm/md/lg`) and the layout tokens (`rail-w`, `panel-w`, `bar-h`) are not theme-mode
dependent — they use the same values as light mode.

## Token status

Where each token lives and whether a component reads it today:

**Wired (defined in `theme.ts` and consumed by a component now):**

- MUI palette: `paper` → `background.default`; `surface-2` → `background.paper`; `accent` →
  `primary.main`; `weekend` → `secondary.main`; `hairline` → `divider`; `ink` → `text.primary`;
  `ink-soft` → `text.secondary`.
- `theme.tokens`: `surface` (navigator rail + controls panel background); `radius-md` →
  `shape.borderRadius`; `radius-sm` → `MuiButton` corner radius; `rail-w`, `panel-w` (rail/panel
  widths in `App.tsx`); `bar-h` → `MuiAppBar` `minHeight`.

**Defined and available (in `theme.tokens`, no consumer yet — reserved for the design system):**

- `hairline-2`, `accent-700`, `accent-300`, `accent-tint`, `weekend-tint`, `radius-lg`, and
  `shadow-sm` / `shadow-md` / `shadow-page`.

**Documented for direction, not yet in `theme.ts`:** `ink-faint` (placeholder/disabled/helper text).
Add it to the theme when a component needs it.

## Typography

Two font roles, both loaded as Google Fonts:

- **Fraunces** — display/titles: page headings, the calendar/project title, and other large editorial
  text where the "professional" tone should show through.
- **Hanken Grotesk** — UI body text: labels, buttons, inputs, helper text, navigation — everywhere else.

The **calendar's own font picker is unaffected**: it keeps every family a user can choose for their
calendar's on-page text — Nunito, Inter, Merriweather, Playfair Display, Pacifico — and gains
Fraunces and Hanken Grotesk as two more selectable options. This doc's font roles are about the
*app's chrome*, not a restriction on what a user can pick for their printed calendar.

Native form controls (`button`, `input`, `select`, `textarea`) do not inherit `font-family` by
default, so `theme.ts` adds a `MuiCssBaseline` override forcing `font-family: inherit` on them —
otherwise they fall back to the browser's UA default (Arial) instead of Hanken Grotesk.

## Spacing

Standard MUI 8px rhythm (`theme.spacing(n)` = `n × 8px`). Prefer multiples of the 8px unit for
padding, gaps and margins; avoid one-off pixel values.

## Backgrounds & texture

The chrome is layered so the calendar page reads as a sheet floating on a warm paper studio. All
recipes below are translated directly from `mockups/app-professional.html`; use the theme tokens (not
raw hex) when wiring them so a token change flows through. `color-mix(...)` is passed straight through
by MUI's `sx`, so it can be used verbatim in `sx` strings.

- **App body (paper + accent tint).** The app root (outer `Box` in `App.tsx`) fills with
  `background.default` (`paper`) and overlays a faint accent radial bleeding from the top-right:
  `radial-gradient(1200px 600px at 70% -10%, rgba(30,58,95,0.05), transparent 60%)`. The rgba is the
  light `accent` (`#1E3A5F`) at 5%; it is intentionally subtle and shared across both themes.
- **Stage glow.** The center stage column is transparent (so the paper shows through) with an accent
  radial glow spilling from the top: `radial-gradient(900px 500px at 50% 0%, color-mix(in srgb,
  <accent> 5%, transparent), transparent 70%)`, where `<accent>` is `theme.palette.primary.main` so it
  tracks the mode (light `#1E3A5F` / dark `#6E92C4`).
- **Grid texture.** A decorative, `aria-hidden`, `pointer-events: none` `Box` sits absolutely behind
  the page (`position: absolute; inset: 0`, below the page content via `z-index`). It is a 28px line
  grid in `hairline-2`:
  `background-image: linear-gradient(<hairline-2> 1px, transparent 1px), linear-gradient(90deg,
  <hairline-2> 1px, transparent 1px); background-size: 28px 28px;` masked to a soft central ellipse
  (`mask-image: radial-gradient(ellipse 70% 70% at 50% 42%, #000 35%, transparent 78%)`, plus the
  `-webkit-` prefix) at `opacity: .5`. The floating sheet (carrying `shadow-page`) stacks above it.

## Top bar

The top app bar is translucent chrome, not a solid fill: `background: color-mix(in srgb, <surface> 86%,
transparent)` with `backdrop-filter: saturate(1.2) blur(8px)`, over the theme's hairline bottom border
(`MuiAppBar` already supplies `border-bottom: 1px solid <hairline>`). The paper tint and stage glow
read faintly through it as content scrolls beneath.

## Panel head

The right controls panel opens with a sticky context head above the collapsible sections
(`ControlsPanel` renders an optional `head` node sticky at `top: 0`). It names the page being edited:

- `<h2>` — the active page's label (Cover, or the localized month name) in the **Fraunces** display
  voice (16px / 600).
- A muted sub-line (`ink-soft`/`ink-faint`) — "Editing page N of 13 — changes apply to this page"
  (localized via `panelEditingNote` in `src/i18n/strings.ts`).

Background matches the mockup's `.panel-head`: `color-mix(in srgb, <surface> 92%, transparent)` with
`backdrop-filter: blur(6px)` and a `hairline-2` bottom border.

## Gradients

Two chrome elements use accent gradients (the only gradients in the chrome besides the backgrounds
above — regions are otherwise separated with hairlines, not gradients):

- **Brand mark** (`src/components/BrandMark.tsx`) — the rounded square fills with
  `linear-gradient(145deg, <accent>, <accent-700>)` and carries `shadow-sm` plus an inner top highlight
  `inset 0 1px 0 rgba(255,255,255,.14)`. The white calendar glyph sits on top.
- **Export button** (`src/features/export/ExportButton.tsx`) — the contained button fills with the
  vertical accent gradient `linear-gradient(180deg, <accent-300> -40%, <accent> 45%, <accent-700>)`,
  with a `<accent-700>` border, white text, `shadow-sm` + an `inset 0 1px 0 rgba(255,255,255,.18)`
  highlight, and a `brightness(1.06)` hover. The disabled (busy) state drops the gradient for a flat,
  readable disabled fill.

## Icons

Chrome icons are **thin-line (outlined)** to match the mockup's stroked SVGs: use MUI's `*Outlined`
variants. In use today: theme toggle `DarkModeOutlined`/`LightModeOutlined`; export
`FileDownloadOutlined`; panel section labels `TitleOutlined` (Page text), `PhotoCameraOutlined`
(Photo), `PaletteOutlined` (Style), `GridViewOutlined` (Layout). `RestartAlt` (Reset) has no outlined
variant and is kept as-is. When adding a chrome icon, prefer its `*Outlined` form; if none exists, pick
the nearest outlined equivalent.

## Component Patterns

- **Separate regions with hairline borders, not heavy shadows.** Use `hairline`/`hairline-2` borders
  between the app bar, navigator rail, canvas area and controls panel. Reserve `shadow-md`/`shadow-page`
  for things that should visually float above the chrome (the calendar page itself, popovers/menus).
- **Editor controls live in a collapsible right panel.** The controls panel (`panel-w` wide) sits on
  the right of the canvas and is organized as an accordion of control groups (image, colors, fonts,
  start month, language, export) that the user can expand/collapse.
- **Selection state = accent ring.** The selected page thumbnail, active control group, or focused
  canvas element gets a ring/outline in `accent` (not a filled background) so it reads clearly in both
  themes.
- **Weekends use the terracotta `weekend` color**, with `weekend-tint` as the cell background — kept
  distinct from the `accent` blue used for app chrome so the two meanings never collide visually.
- **Respect `prefers-reduced-motion`.** Any transition/animation (accordion expand, panel collapse,
  hover states) must be skipped or reduced to an instant change when the user has reduced motion set.
- **Meet WCAG AA contrast (≥ 4.5:1)** for text/controls against their background, in both light and
  dark — this applies to all `ink*` tokens against `paper`/`surface*`, and to `accent`/`weekend` used
  as text color.

## How to Add or Change a Token / Add a Control Group

**Changing or adding a token:**
1. Edit the value in `src/app/theme.ts` — the MUI palette/shape/typography for the first-class tokens,
   or the `theme.tokens` bag (`AppTokens`) for the rest.
2. Update the matching row in the token tables above (add a new row for a new token) and, if its
   wired/available status changed, the **Token status** section.
3. Check both light and dark variants are still WCAG AA compliant and that `shadow-page` still reads
   as the most elevated surface.

**Adding a control group to the right panel:**
1. Add a new accordion section in the controls panel feature area (`src/features/controls/`),
   following the existing accordion pattern (one group per concern: image, colors, fonts, etc.).
2. Reuse existing MUI inputs (color picker, slider, select) before building a new control — check
   `docs/components.md` first (Rule of Three before abstracting).
3. Use theme tokens (via `theme.palette`/`theme.shape`/`theme.spacing`/`theme.tokens`) rather than
   hardcoded colors, radii or spacing, so the group stays in sync with future token changes.
