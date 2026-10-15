# 0006 — Color & font customization
Date: 2026-10-13

## Assignment
Let the user style the whole calendar: pick a font and set the text color, weekend-highlight color, and page
background color. Applies to all 13 pages, updates live, persists, and shows in the exported PDF. (Full spec:
`.claude/assignments.local/0006-color-font-customization.md`.)

## Approach
- **Model:** a serializable `style: CalendarStyle = {fontFamily, textColor, weekendColor, backgroundColor}` on
  `CalendarProject` with `DEFAULT_STYLE`; a `setStyle(partial)` store action (mints a fresh project so the
  existing config autosave persists it — no new storage code).
- **Backward compat:** `calendarStyleSchema` has per-field + whole-object Zod defaults (and coerces `null`→
  default), so projects saved by earlier slices (no `style`) hydrate with defaults instead of being rejected.
- **Rendering:** a pure `resolveStyle(style, fallback)` resolves font/colors (explicit value wins; blank
  treated as unset); `MonthPageCanvas`/`CoverPageCanvas` apply background, all text fills, weekend highlight,
  and fontFamily. Thumbnails and the PDF export reuse the same canvases, so both reflect the style.
- **Fonts:** a curated set (Nunito, Inter, Merriweather, Playfair Display, Pacifico) via the Google-Fonts link;
  `loadCalendarFonts()` preloads 400+700 weights; a one-time `fontEpoch` bump forces Konva to repaint once
  fonts are ready (the font-load-redraw trap).
- **Controls:** `StyleControls` — MUI font Select (each option shown in its own font) + native color inputs
  with preset swatches; localized EN/CZ.

## Key decisions
- Whole-calendar (global) styling; the four properties above (font/text/weekend/background) — all user-chosen.
- No color-picker library (native `<input type=color>`); no accent/grid color, font-size, or per-page styling (out of scope).
- Export honors user colors; forced-light paper only affects unset fallbacks.

## Outcome & deviations
- **Done, all green:** `npm run test:run` **127/127**, `npm run lint` clean, `npm run build` succeeds (only the
  pre-existing >500 kB chunk advisory).
- Verified by two reviewers (gate+fidelity PASS; code review PASS WITH COMMENTS — the data-loss-risk backward
  compat verified solid, with tests) and re-run by the manager.
- Post-review fixes: preload the bold (700) weight so titles don't flash a fallback; removed the redundant
  canvas remount on font switch (no more flicker / drag interruption); hardened the schema so a `style: null`
  record can't wipe the calendar; treat a blank color string as unset; corrected stale dark-mode comments.
- Product note: `DEFAULT_STYLE` now colors titles/month names with the single "text color" (dark ink) instead
  of the previous blue; the weekend accent stays blue. A dedicated title/accent color is a possible future
  slice (accent was out of scope here).
- No commit made — changes staged for the user.
