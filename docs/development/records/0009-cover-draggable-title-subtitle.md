# 0009 — Cover: draggable title + a subtitle
Date: 2026-10-14

## Assignment
On the cover page, let the user drag the title text by hand and add a subtitle that can be edited and dragged
independently. Positions must match across the editor, the cover thumbnail, and the exported PDF. (Full spec:
`.claude/assignments.local/0009-cover-draggable-title-subtitle.md`.)

## Approach
- **Model:** added `subtitle` (default '') + `titlePosition` {0.5,0.14} + `subtitlePosition` {0.5,0.22} to
  `CalendarProject`, each a **page fraction** (center anchor) — resolution-independent, same pattern as the
  photo-pan fix, so storage holds no pixels. Zod per-field `.default().catch()` + null→undefined preprocess so
  pre-feature saves and bad/null values coerce to defaults and are never rejected. Store actions `setSubtitle`
  / `setTitlePosition` / `setSubtitlePosition` (mint a fresh project → autosave).
- **Pure helper** `coverTextLayout` (fraction↔pixel + clamp-on-page), unit-tested incl. resolution independence.
- **CoverPageCanvas:** title + (non-empty) subtitle render as Konva `Text` on a top layer; draggable + clamped
  in the editor (move callbacks present), static in the cover thumbnail and PDF (no callbacks). Font/color from
  the resolved style; subtitle smaller; empty subtitle hidden; photo stays pannable where there's no text.
- **Wiring:** a Subtitle `TextField` in the controls (EN/CZ); App passes positions + move callbacks to the
  editor cover; PageNavigator's cover thumbnail and `captureCalendarPage` pass subtitle + positions statically.

## Key decisions
- Subtitle independently draggable (user-chosen); positions as page fractions for editor↔export parity; title
  single-line (`wrap="none"`) for a tight drag hit-box (see deviations).

## Outcome & deviations
- **Done, all green:** `npm run test:run` **214/214**, `npm run lint` **0 warnings**, `npm run build` succeeds
  (pre-existing >500 kB chunk advisory only). No new dependency.
- Verified by two reviewers (gate+fidelity; code review) — PASS WITH COMMENTS, no blockers; the two
  load-bearing properties (migration can't wipe on the new fields; editor↔export resolution independence with
  no pixel leak) both hold and are test-pinned. **Manager also verified in a real browser** (Playwright): typed
  a subtitle (renders under the title + in the thumbnail), dragged the title (moved + persisted + thumbnail
  updated at the same relative position).
- Deviations/notes (minor, not fixed): the title is single-line, so a very long title can visually overflow the
  cover (consistent in editor + export); `estimateTextWidth` makes the drag hit-box approximate; two
  `as z.ZodType<…>` casts (needed because `z.preprocess` erases the output type). Pre-existing, out-of-scope
  note from review: several required project fields (title/language/startMonth/weekStart/pageSize) still lack
  `.catch()`, so a corrupted value there could reject a stored config — a candidate hardening slice.
- No commit made — changes staged for the user.
