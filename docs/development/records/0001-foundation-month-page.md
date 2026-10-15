# 0001 — Foundation: render one month page
Date: 2026-10-12

## Assignment
First vertical slice: opening the app shows a clean shell with a light/dark toggle and an English/Czech
toggle, and one calendar month page drawn on a canvas — A4-portrait shaped, Monday-first day grid for the
current month, with Saturdays/Sundays highlighted and month/weekday names localized in EN + CZ. No image
upload, persistence, PDF export, cover page, or all-13-pages yet. (Full spec: `.claude/assignments.local/0001-foundation-month-page.md`.)

## Approach
- Pure calendar logic (`src/lib/calendar.ts`) on **native `Intl` + `Date`** only (no date library): month
  matrix with leading/trailing blanks, localized month name + weekday headers (UTC-anchored to avoid tz/DST
  drift), weekend detection.
- A4-portrait geometry + aspect-locked letterbox fit (`src/lib/page.ts`); pure layout-rect math split out
  (`src/features/editor/monthPageLayout.ts`) so it is testable without a canvas.
- Rendering via **react-konva** (`MonthPageCanvas`), driven by the pure logic; MUI light/dark theme (Nunito)
  in `src/app/theme.ts`; `App.tsx` measures its container (ResizeObserver) → fits the A4 page → renders the
  current month, with working theme + language toggles.
- TS types in `src/types/calendar.ts` mirrored by Zod schemas in `src/schemas/calendar.ts`.

## Key decisions
- Native `Intl` + `Date`, no date library — fits the "prefer built-ins / 14-day dependency" Critical Guidelines.
- A4 portrait default page size and Monday week-start, both stored in the model so they are changeable later.
- react-konva for rendering (precise image/text control, high-res export path for the later PDF slice).
- (No ADR written — these were scoping choices confirmed with the user, not surprising/hard-to-reverse
  architecture. Promote to an ADR if revisited.)

## Outcome & deviations
- **Done, all green:** `npm run test:run` 26/26, `npm run lint` clean, `npm run build` succeeds
  (only a non-fatal >500 kB chunk-size advisory from MUI+Konva; code-splitting is a later concern).
- Verified by two independent reviewer subagents (DoD-gate re-run + fidelity; code review of the calendar
  math — no bug found) and re-run by the manager.
- Deviation: calendar logic placed in `src/lib/` (the assignment allowed `src/lib` and/or
  `src/features/calendar`); `src/features/calendar/` kept empty for now.
- Post-review cleanup applied: deleted dead `src/App.css` + Vite template SVGs; tightened two Zod schemas
  (removed an `as` cast, added `satisfies` guards); synced `<html lang>` to the language toggle and made the
  language button show its target; added a "1st-on-Sunday → 6 leading blanks" alignment test.
- react-konva component test is a light smoke test (react-konva mocked; no native `canvas` package) — real
  canvas pixels are left to a later browser/e2e check.
- No commit made — changes staged for the user to commit.
