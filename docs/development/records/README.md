# Development Records
Point-in-time history of how **substantial** work was built on this project — one record per substantial
assignment (new feature/subsystem/non-trivial change). **Never edit a record after writing it**; a later
change gets its own record. Skip trivial work (typos, tiny tweaks, dep patch bumps); borderline → ask.
Records are written at the development workflow's finish step. Link to ADRs and the components registry
rather than restating them.

## Template
Copy this as `docs/development/records/NNNN-<slug>.md` (next number in sequence):

```markdown
# NNNN — <Title>
Date: YYYY-MM-DD
## Assignment
<the non-technical "what the user wanted", from this cycle's assignment>
## Approach
<how it was built, in brief>
## Key decisions
- <bullet; link ADRs, e.g. "see docs/guidelines/adr/0003-....md" — do not restate the rationale>
## Outcome & deviations
<result; tests/build status; anything that deviated from the original plan>
```

## Index
<!-- add one line per record, newest last -->
| Record | Date | Summary |
|---|---|---|
| [0001](0001-foundation-month-page.md) | 2026-10-12 | Foundation slice: app shell + MUI light/dark + Konva A4 month page (Monday-first, weekend highlight, EN/CZ via Intl) |
| [0002](0002-project-model-and-navigator.md) | 2026-10-13 | 13-page project model (cover + 12 months, start month/year) + Zustand store + thumbnail navigator + title/start controls |
| [0003](0003-image-upload.md) | 2026-10-13 | Per-page image upload (Blob+object-URL, slot-keyed) + clipped draggable Konva photo + zoom slider; month layout = photo top / grid bottom |
| [0004](0004-persistence.md) | 2026-10-13 | IndexedDB persistence via Dexie: autosave + boot-hydrate the single calendar (config + photo Blobs), Zod-validated with fallback, New/Reset |
| [0005](0005-pdf-export.md) | 2026-10-13 | Print-ready PDF export (jsPDF): offscreen 300-DPI WYSIWYG capture of all 13 pages, forced light paper, progress + title filename |
| [0006](0006-color-font-customization.md) | 2026-10-13 | Whole-calendar style (font + text/weekend/background colors): curated Google Fonts, live on all pages, persisted, honored in PDF, backward-compatible |
| [0007](0007-saturday-sunday-colors.md) | 2026-10-13 | Split weekend color into separate Saturday & Sunday colors (defaults blue/red) with legacy-value migration; two style controls |
| [0008](0008-layout-templates.md) | 2026-10-14 | Seven month-page layout templates + visual picker + layout registry/dispatcher; whole-calendar, style-honoring, in thumbnails & PDF; migration-safe |
| [0009](0009-cover-draggable-title-subtitle.md) | 2026-10-14 | Cover: draggable title + a draggable subtitle; positions as page fractions (editor↔export parity), subtitle field, migration-safe defaults |
