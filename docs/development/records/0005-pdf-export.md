# 0005 — PDF export (jsPDF, 300 DPI, WYSIWYG)
Date: 2026-10-13

## Assignment
An "Export PDF" button that turns the 13-page calendar (cover + 12 months, photos + grids exactly as shown)
into a single print-ready A4 PDF at 300 DPI and downloads it, with a progress indicator and a title-based
filename. (Full spec: `.claude/assignments.local/0005-pdf-export.md`.)

## Approach
- **Rasterize, WYSIWYG, no drift:** each page is rendered OFFSCREEN at the export pixel size (A4 @ 300 DPI ≈
  2480×3508, from `computeExportPixelSize`) by mounting the REAL editor components (`CoverPageCanvas` /
  `MonthPageCanvas`, via an added optional `stageRef`) in a throwaway React root, then snapshotting the Konva
  stage to PNG (`captureCalendarPage`).
- **Blank-photo guard:** pre-decode the slot image, wait (rAF poll, 15 s cap) until the Konva Image node is
  mounted (ImageFrame mounts it only after the bitmap loads), force a synchronous `stage.draw()`, then capture.
- **Assembly** (`exportCalendarPdf`): sequential (one big canvas at a time, disposed in `finally`), read-only
  (never touches the store/autosave), jsPDF `a4/portrait/mm`, 13 images + 12 `addPage` + `save(pdfFilename)`;
  progress reported per page. UI = a localized `ExportButton` with busy/disabled + error Snackbar.

## Key decisions
- Rasterize at 300 DPI (user-chosen) rather than vector-redraw — reuse the renderer, zero layout drift.
- **Export always on LIGHT paper** regardless of the app's light/dark theme (print-appropriate; set via
  `createAppTheme('light')` passed into the capture) — decided after review flagged dark-mode → dark PDF.
- No new dependency (jsPDF already present; its `html2canvas`/`dompurify` are lazy internals, not added deps).

## Outcome & deviations
- **Done, all green:** `npm run test:run` **113/113**, `npm run lint` clean, `npm run build` succeeds (only the
  pre-existing >500 kB chunk advisory).
- Verified by two reviewers (gate+fidelity PASS; code review PASS WITH COMMENTS — the untested capture path's
  decode→mount-after-load→synchronous-draw chain judged correct, no constructable blank-photo scenario) and
  re-run by the manager.
- Post-review fixes: forced light export paper (the Major); fixed the filename sanitizer (leading-dot dotfile;
  regex made legible — control-char stripping/hyphen-keeping were already correct via invisible bytes the
  tooling misrendered); documented the capture readiness invariant.
- **Unit-tested:** the pure helpers (`computeExportPixelSize`, `pdfFilename`) and the orchestration (jsPDF +
  capture mocked: 13 images / 12 addPage / 1 save / order). **NOT auto-tested** (jsdom has no real canvas): the
  actual rasterized visual output — **requires a manual smoke test** (`npm run dev` → add photos → Export →
  open the PDF: 13 pages, photos present/positioned, order, filename) or a future Playwright e2e.
- No commit made — changes staged for the user.
