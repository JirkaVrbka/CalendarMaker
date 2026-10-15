# Design Brief: CalendarMaker

## Problem

People want to turn their own photos into a personal, printable wall calendar — a cover plus a page per
month — but existing tools are either locked behind accounts/subscriptions, feel like heavy pro design
software, or don't give fine control over how each photo sits on the page. They just want to drop in
pictures, tweak colors and fonts, and get a print-ready file.

## Solution

A calm, in-browser calendar builder. The user works on a canvas that shows the actual page, uploads an
image per page, positions/zooms it, adjusts colors, fonts and font colors, highlights weekends, picks the
start month and language (English or Czech), and exports a print-ready multi-page PDF. Everything stays on
their device (IndexedDB) — no account, no upload to a server.

## Experience Principles

1. **Content over chrome** — the calendar page is the hero; the editor UI recedes (Apple/Google-Photos clean).
2. **Direct manipulation over dialogs** — zoom, drag and recolor happen on the canvas, with controls beside it.
3. **Confidence that it will print right** — the on-screen page reflects the exported PDF; no surprises.

## Aesthetic Direction

- **Philosophy**: Calm, content-forward minimalism — lots of whitespace, soft neutral chrome, gentle depth.
- **Tone**: Calm & creative; a quiet, friendly workspace.
- **Reference points**: Google Photos / Apple apps — minimal chrome, generous spacing, the user's images front and center.
- **Anti-references**: Dense pro tools (Figma/Affinity), busy/skeuomorphic or heavily branded UIs.

## Existing Patterns

Greenfield project; the vocabulary below is the starting point to extend.

- Typography: Friendly rounded sans (e.g. Nunito) for UI; neutral and legible.
- Colors: Light neutral chrome by default with a **light + dark toggle** (MUI theming). Chrome colors kept
  neutral so the calendar's own colors read true.
- Spacing: MUI 8px spacing scale.
- Components: Material UI (MUI) as the component kit (ColorPicker-style controls, Slider, inputs, Tabs, panels).

## Component Inventory

| Component | Status | Notes |
| --- | --- | --- |
| App shell (header + theme toggle + language toggle) | New | Light/dark, EN/CZ |
| Page thumbnails / navigator (13 pages) | New | Cover + 12 months |
| Canvas stage (react-konva) | New | Renders the active page; image + text layers |
| Image controls (upload, zoom, position) | New | Direct manipulation on canvas + sliders |
| Color controls (page colors, weekend highlight, font color) | New | MUI color inputs |
| Font controls (family, size, color) | New | |
| Settings (start month, language) | New | |
| Export button → PDF | New | jsPDF multi-page, print-ready |

## Key Interactions

- **Upload an image** → it appears on the current page; the user drags to reposition and uses a zoom slider; the canvas updates live.
- **Recolor** → changing a color (background, weekend highlight, font) updates the page immediately.
- **Switch page** → thumbnail selection swaps the active page; edits persist per page.
- **Change start month / language** → the month grids and labels regenerate (EN ↔ CZ).
- **Export** → produces a multi-page, print-ready PDF of all 13 pages.
- **Autosave** → project state persists to IndexedDB so a reload restores work.

## Responsive Behavior

**Desktop-first.** Primary layout: center canvas with a side controls panel and a page navigator. Narrower
widths are a later concern; the panel may collapse/stack, but mobile is not an MVP target.

## Accessibility Requirements

- Text/controls meet WCAG AA contrast (≥ 4.5:1) in both light and dark chrome.
- All controls keyboard-operable with visible focus; canvas actions have non-drag fallbacks (numeric inputs).
- Respect `prefers-color-scheme` for the initial theme; honor `prefers-reduced-motion`.

## Out of Scope

- Accounts, authentication, cloud sync or server storage (all data is local/IndexedDB).
- Mobile-optimized layout (desktop-first MVP).
- Image editing beyond position/zoom (no filters/crop tools) for the MVP.
- Languages other than English and Czech.
