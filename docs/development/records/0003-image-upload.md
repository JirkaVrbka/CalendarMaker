# 0003 — Image upload + zoom/position
Date: 2026-10-13

## Assignment
On any page the user uploads a photo, then positions (drag) and zooms (slider) it within its frame, and can
replace/remove it. The cover page's photo fills the page; each month page gains a photo region on top with the
day grid below. Photos stay with their page across navigation and survive a start-month change. EN/CZ labels;
light/dark intact; photo clipped to its frame. (Full spec: `.claude/assignments.local/0003-image-upload.md`.)

## Approach
- **State:** a separate `images: Record<slot, ImageEntry>` slice in the Zustand store (`ImageEntry = {blob,
  url, transform}`), keyed by page SLOT (0 = cover, 1..12 = months) so photos survive a start-month rebuild.
  Actions `setImage`/`setImageTransform`/`removeImage` manage object-URL create/revoke. Binary is kept OUT of
  the serializable `project` (sets up the IndexedDB persistence slice cleanly). No base64.
- **Transform model:** cover-relative — `computeCoverScale` gives the base cover-fit scale; the page stores a
  user transform (scale multiplier ≥1, pan offset); `composeImageTransform` (pure, tested) combines them and
  `clampCoverPosition` guarantees the frame is always fully covered.
- **Rendering:** `useImageElement` (custom hook, no `use-image` dep) loads the HTMLImageElement; `ImageFrame`
  draws it in a clipped, draggable Konva group. `MonthPageCanvas` reworked via `splitMonthPage` (photo top 55%
  / grid bottom 45%); `CoverPageCanvas` shows the full-page photo (placeholder when empty).
- **Controls:** `ImageControls` (MUI Upload/Replace + hidden file input, Remove, zoom Slider) wired to the
  active slot; drag commits a clamped pan.

## Key decisions
- Photo top / grid bottom on month pages; drag + zoom-slider interaction; Blob + object-URL (all user-chosen).
- Images keyed by slot (survive start-month rebuild) — intentional per spec.
- Custom image-loading hook instead of the `use-image` dependency (hard-rule: prefer built-ins).

## Outcome & deviations
- **Done, all green:** `npm run test:run` **72/72**, `npm run lint` clean, `npm run build` succeeds (only the
  pre-existing >500 kB chunk advisory).
- Verified by two independent reviewers (gate+fidelity PASS; code review PASS WITH COMMENTS — confirmed the
  cover/clamp math can't expose an uncovered frame, the object-URL lifecycle is leak-free, and the grid rework
  has no double-offset) and re-run by the manager.
- Post-review fixes applied: (1) **zoom-out jump** fixed — an effect re-normalizes (re-clamps) the stored pan
  when the scale changes; (2) **test gaps closed** — extracted `composeImageTransform` (pure) + tests and added
  a `useImageElement` load/cleanup test (63 → 72 tests); (3) **dead output cleaned** — `computeCoverTransform`
  became `computeCoverScale` (dropped unused offsets).
- Known/deferred: photos are in-memory only (lost on reload until the persistence slice); cover-title contrast
  over a bright photo is a later design-polish item; minor perf (slider re-renders, thumbnail double-decode)
  accepted for MVP. A harmless no-op `eslint-disable-line` comment remains (oxlint ignores it).
- No commit made — changes staged for the user.
