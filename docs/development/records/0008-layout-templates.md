# 0008 — Layout templates (choose a month-page layout)
Date: 2026-10-14

## Assignment
Offer multiple month-page layout templates (not just the one), picked via a visual thumbnail picker, applied to
all 12 month pages — live in the editor, in the navigator thumbnails, and in the exported PDF. Seven templates
from the `mockups/` folder: Classic Top, Full-bleed Ribbon (Helmáč style), Bottom Photo, Framed, Minimal
Overlay, Agenda (two-column), Vertical Ribbon. (Full spec: `.claude/assignments.local/0008-layout-templates.md`.)

## Scope decisions
- Whole-calendar template (one `layout` for all 12 month pages); month pages only (cover unchanged); visual
  thumbnail picker; templates honor the project style (font, text, background, Saturday/Sunday colors).
- Built in **two waves** (foundation + ribbon, then the other five).

## Approach
- **Model:** `layout: LayoutId` on CalendarProject (default `'classic-top'`), Zod `enum().default().catch()` so
  old saves and any bad/null value coerce to classic-top (never rejected — data-safe). `setLayout` store action;
  persisted via the existing config autosave.
- **Registry pattern:** `src/features/editor/layouts/` — each layout is a component (exporting only the
  component; the `{id,labelEn,labelCs,render}` entry is built in `registry.ts`, which keeps lint fast-refresh
  clean). `MonthPageCanvas` became a DISPATCHER that owns the `<Stage>`/`stageRef` and renders
  `getLayout(layout).render(props)`; unregistered ids fall back to the default.
- **Layouts:** each computes its photo-frame rect (reusing `ImageFrame` for the draggable, clipped photo) and
  draws its calendar from a PURE, unit-tested geometry helper (ribbonLayout, agendaLayout, verticalRibbonLayout,
  framedLayout, minimalOverlayLayout, calendarGrid, splitMonthPageBottomPhoto). Content colors/font come from
  the resolved style; **fixed "chrome"** (the ribbon/strip dark bands, the framed mat, the overlay card) uses a
  **fixed ink** for legibility, with only weekend accents following the style.
- **Picker:** `LayoutPicker` — registry-driven visual previews (each renders the active month via the dispatcher
  at a small size), accessible radiogroup, localized. Thumbnails (PageNavigator) + export (captureCalendarPage)
  thread `project.layout` through, so switching updates everything.

## Key decisions
- Fixed-background chrome is not style-driven (fixed ink on the ribbon's dark band / the framed mat / the
  overlay card) — avoids dark-on-dark and white-on-white; weekends still follow the Saturday/Sunday colors.
- Agenda & Vertical Ribbon list days in calendar order (ignore weekStart by design); Framed kept upright (no
  polaroid tilt) to keep the photo clip/drag and PDF simple.

## Outcome & deviations
- **Done, all green:** `npm run test:run` **189/189**, `npm run lint` **0 warnings**, `npm run build` succeeds
  (only the pre-existing >500 kB chunk advisory). No new dependency.
- Verified across both waves by independent reviewers (gate + fidelity; code review) and re-run by the manager.
  Two review-driven legibility fixes applied: **Wave 1** — the Full-bleed Ribbon's band text was dark-on-dark by
  default → switched to fixed light ink (+ shadowed big number), and the registry-export pattern was cleaned so
  lint has zero warnings; **Wave 2** — Framed & Minimal Overlay drew style text on their fixed white mat/card
  (white-on-white for a dark-paper project) → switched to a fixed dark ink. Also a picker-preview memo fix and
  robust ribbon year placement for long Czech month names.
- Deferred (noted): extract a shared `MonthGridOnPaper` to de-duplicate bottom-photo vs classic-top (Rule of
  Three not yet tripped); per-page layouts and cover-template variants.
- No commit made — changes staged for the user.
