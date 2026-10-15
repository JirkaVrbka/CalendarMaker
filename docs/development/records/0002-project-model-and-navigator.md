# 0002 — 13-page model + thumbnail navigator
Date: 2026-10-13

## Assignment
Turn the single demo month page into a real calendar project: a cover page + 12 month pages, with a title, a
chosen start month + year (12 consecutive months, may cross a year boundary), and a rail of thumbnail
previews to move between the 13 pages (active highlighted; click + keyboard). Main area shows the active page
fitted. EN/CZ and light/dark keep working. No image upload, color/font customization, persistence, or PDF
yet. (Full spec: `.claude/assignments.local/0002-project-model-and-navigator.md`.)

## Approach
- Model: a `Page` discriminated union (`CoverPage | MonthPage`), `CalendarProject` gained `title`,
  `startMonth`, `startYear`, `pages`. Pure `buildProjectPages(startMonth, startYear)` (`src/lib/projectPages.ts`)
  builds cover@0 + 12 consecutive months via modular arithmetic (`((abs%12)+12)%12`, year `+floor(abs/12)`).
  Zod uses `z.discriminatedUnion('kind', …)` mirroring the TS union.
- State: a **Zustand** store (`src/app/store.ts`, `useProjectStore`) is the single source of truth — project +
  `activePageIndex` + actions (`setTitle`, `setStart` [rebuilds months + clamps index], `selectPage`,
  `setLanguage`). Immutable updates; App consumes individual atomic selectors (no re-render loop).
- UI: new `CoverPageCanvas` (title + image-placeholder frame) reusing the slice-1 canvas conventions; a
  `PageNavigator` thumbnail rail (listbox/option a11y, roving tabindex, arrow/Home/End/Enter/Space) reusing
  `MonthPageCanvas`/`CoverPageCanvas` at a small fixed size; controls (title field, start-month + start-year
  selectors) wired to the store.

## Key decisions
- Start month = 12 consecutive months from a chosen month + year (may cross a year boundary) — the point of the feature.
- Thumbnail navigator (user chose this over a simpler strip); kept lightweight (13 small non-interactive canvases).
- **Zustand** as the state store — user-approved new dependency (`zustand@5.0.15`); chosen over `useReducer`/plain
  `useState` for a single serializable source of truth that makes later persistence + undo easy. (No ADR; revisit as an ADR if the state layer is reworked.)

## Outcome & deviations
- **Done, all green:** `npm run test:run` 43/43, `npm run lint` clean, `npm run build` succeeds (only the
  pre-existing >500 kB chunk advisory from MUI+Konva; code-splitting remains a later concern).
- Verified by two independent reviewers (DoD-gate re-run + fidelity; code review confirming year-crossing
  math, store immutability, selector/re-render safety, and the Zod↔TS union) and re-run by the manager.
- Post-review polish applied: memoized the 13 thumbnails (`React.memo`) so navigation repaints only the
  selection border; added a `switch`+`assertNever` exhaustiveness guard (`src/lib/assertNever.ts`) in App +
  PageNavigator so a future `Page` kind becomes a compile error; navigator now moves DOM focus on click; fixed
  a stale header comment in `src/types/calendar.ts`.
- `dexie` and `jspdf` remain declared-but-unused (planned stack for the persistence/export slices) — confirms
  those out-of-scope features are genuinely absent.
- No commit made — changes staged for the user.
