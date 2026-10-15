# 0007 — Separate Saturday & Sunday colors
Date: 2026-10-13

## Assignment
Let the user set different colors for Saturday and Sunday (replacing the single weekend color). Each colors
that day's column highlight and day numbers across all month pages; persists and shows in the PDF. (Full spec:
`.claude/assignments.local/0007-saturday-sunday-colors.md`.)

## Approach
- Replaced `CalendarStyle.weekendColor` with `saturdayColor` + `sundayColor`; `DEFAULT_STYLE` now Saturday
  `#4c6ef5` (blue) / Sunday `#e03131` (red).
- **Migration** (`migrateLegacyStyle`, a Zod `preprocess`): a stored style with the legacy `weekendColor` and no
  per-day colors maps it onto BOTH days; `null`/absent → DEFAULT_STYLE; explicit per-day colors pass through.
  It TRANSFORMS rather than rejects, so old calendars are never wiped (the slice-0006 null guard is preserved).
- `resolveStyle` returns `saturday` + `sunday`; `MonthPageCanvas` colors the Saturday column/numbers from
  `saturdayColor` and Sunday from `sundayColor` (column→weekday `(weekStart+col)%7`, day numbers by the day's
  own `getDay()`). `StyleControls` now has two color inputs; EN/CZ labels added. Export reuses the canvas → PDF
  honors both.

## Key decisions
- New-calendar defaults Saturday blue / Sunday red (user-chosen — the classic convention).
- Migrate the legacy single weekend color onto both days for existing saves (preserve their look).

## Outcome & deviations
- **Done, all green:** `npm run test:run` **137/137**, `npm run lint` clean, `npm run build` succeeds (only the
  pre-existing >500 kB chunk advisory).
- Verified by one combined reviewer (gate re-run + fidelity + code review) and re-run by the manager:
  **PASS, no findings** — migration data-safety confirmed solid (legacy→both, null→default, explicit kept,
  never rejected), Sat/Sun column+number coloring correct, no stray `weekendColor` usage, no new dependency.
  No polish iteration was needed.
- No commit made — changes staged for the user.
