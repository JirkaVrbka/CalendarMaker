# Components Registry
> Advisory index of reusable components — NOT the source of truth. Before reusing anything listed here, open
> the linked source file and confirm it still matches (name, signature, behavior). If this file is missing,
> thin, or stale, discover components directly (grep/glob the codebase) and update this file.
> List only genuinely shared/reused components — used, or clearly meant to be used, in ≥2 places. Links are
> relative to this file.

## State
| Component | When to use | Signature | Source |
|---|---|---|---|
| `useProjectStore` | The single source of truth for the calendar project (Zustand); read project (incl. global `style` + `layout`) + activePageIndex + images + hydrated, dispatch actions | `useProjectStore(selector)` — state: `{project, activePageIndex, images, hydrated, hydrate(persisted), resetProject(), setTitle, setStart(month,year), selectPage(i), setLanguage, setStyle(partial), setLayout(id), setImage(slot,blob), setImageTransform(slot,t), removeImage(slot)}` | [../src/app/store.ts](../src/app/store.ts) |

## Persistence (IndexedDB via Dexie — client-side only)
| Component | When to use | Signature | Source |
|---|---|---|---|
| storage `service` | Load/save the single current calendar + per-slot photos; drives autosave + boot hydrate + reset in `App` | `loadAll()`, `saveProjectConfig(config)`, `putImage(slot,blob,transform)`, `putImageTransform(slot,transform)` (Blob untouched), `deleteImage(slot)`, `clearAll()` | [../src/features/storage/service.ts](../src/features/storage/service.ts) |
| storage `mapping` | PURE serialize/validate between store ↔ records (no IndexedDB); Zod-validates + version-checks loaded data → config or `null` | `toProjectRecord`, `fromProjectRecord`, `toImageRecord`, `fromImageRecords`, `STORAGE_VERSION`, `PROJECT_KEY` | [../src/features/storage/mapping.ts](../src/features/storage/mapping.ts) |
| storage `db` | The Dexie DB (`project` single-row + `images` by slot); import `db` for tables | `db.project` / `db.images` (`EntityTable`s) | [../src/features/storage/db.ts](../src/features/storage/db.ts) |

## Export (PDF)
| Component | When to use | Signature | Source |
|---|---|---|---|
| `exportCalendarPdf` | Generate + download the 13-page A4 PDF (sequential, read-only, forced light paper) | `(project, images, {theme, onProgress, capture?, dpi?}) => Promise<void>` | [../src/features/export/exportCalendarPdf.ts](../src/features/export/exportCalendarPdf.ts) |
| `computeExportPixelSize` / `pdfFilename` | A4 export px dims from DPI; sanitized PDF filename (fallback `calendar.pdf`) | `computeExportPixelSize(dpi) => PixelSize` · `pdfFilename(title) => string` | [../src/features/export/exportGeometry.ts](../src/features/export/exportGeometry.ts) |
| `ExportButton` | MUI "Export PDF" control with progress/busy + error handling | `props: {project, images, labels}` (see source) | [../src/features/export/ExportButton.tsx](../src/features/export/ExportButton.tsx) |

## Utilities
| Component | When to use | Signature | Source |
|---|---|---|---|
| `getMonthMatrix` | Build a month's day grid (rows of 7 cells, blanks padded) | `(year, month /*0-idx*/, weekStart) => MonthMatrix` | [../src/lib/calendar.ts](../src/lib/calendar.ts) |
| `getMonthName` / `getWeekdayHeaders` | Localized (EN/CZ) month name + weekday header row, via Intl | `(…, lang) => string` / `(weekStart, lang) => string[]` | [../src/lib/calendar.ts](../src/lib/calendar.ts) |
| `isWeekend` / `getDaysInMonth` | Weekend check / days in a month | `(date) => boolean` / `(year, month) => number` | [../src/lib/calendar.ts](../src/lib/calendar.ts) |
| `A4_PORTRAIT` / `getAspectRatio` / `fitPageSize` | Page dims + aspect-locked letterbox fit into a pixel box | `fitPageSize(pageSize, {maxWidth,maxHeight}) => PixelSize` | [../src/lib/page.ts](../src/lib/page.ts) |
| `computeMonthPageLayout` / `cellRect` / `headerCellRect` | Pure layout rects for a month page (canvas-free, testable) | `(size: PixelSize, weekCount) => MonthPageLayout` | [../src/features/editor/monthPageLayout.ts](../src/features/editor/monthPageLayout.ts) |
| `buildProjectPages` | Build the 13 project pages (cover@0 + 12 consecutive months, year-crossing) | `(startMonth /*0-idx*/, startYear) => Page[]` | [../src/lib/projectPages.ts](../src/lib/projectPages.ts) |
| `assertNever` | Compile-time exhaustiveness guard in a `switch` default (e.g. over `Page.kind`) | `(x: never) => never` | [../src/lib/assertNever.ts](../src/lib/assertNever.ts) |
| `computeCoverScale` / `composeImageTransform` / `clampCoverPosition` | Cover-fit + user-transform math for a framed image (keeps the frame fully covered) | `composeImageTransform(coverScale, userTransform, frame, imageSize) => ComposedImagePlacement` | [../src/lib/imageTransform.ts](../src/lib/imageTransform.ts) |
| `splitMonthPage` / `splitMonthPageBottomPhoto` | Split an A4 month page into photo + grid rects — top-photo (classic) or bottom-photo (mirror) | `(size: PixelSize) => { photo: Rect; grid: Rect }` | [../src/features/editor/monthPageLayout.ts](../src/features/editor/monthPageLayout.ts) |
| `coverTextLayout` / `topLeftToCenterFraction` | Place a cover text block from a page-fraction center anchor, clamped on-page (+ inverse for drag commit); resolution-independent | `(pos, pageSize, textW, textH) => {x,y}` | [../src/features/editor/coverTextLayout.ts](../src/features/editor/coverTextLayout.ts) |
| `computeCalendarGrid` / `calendarCellRect` / `calendarHeaderRect` | Pure COMPACT 7-col grid geometry (header + body, no title band); shared by the framed + minimal-overlay layouts | `(size, weekCount, headerFraction?) => CalendarGrid` | [../src/features/editor/layouts/calendarGrid.ts](../src/features/editor/layouts/calendarGrid.ts) |
| `computeRibbonLayout` / `dayColumnX` / `dividerX` | PURE geometry for the Full-bleed Ribbon layout (full-bleed photo, bottom band, day-number row + week dividers + week numbers) | `(size: PixelSize, dayCount) => RibbonLayout` | [../src/features/editor/layouts/ribbonLayout.ts](../src/features/editor/layouts/ribbonLayout.ts) |
| `getIsoWeekNumber` | ISO-8601 week number (1–53, Monday-based) for a date; used by the ribbon week-number row | `(date: Date) => number` | [../src/lib/calendar.ts](../src/lib/calendar.ts) |
| `resolveStyle` | PURE: resolve a (partial/absent) `CalendarStyle` into canvas values (font/bg/text/saturday/sunday), field-by-field fallback (blank treated as unset) | `(style, fallback: CalendarStyle) => ResolvedStyle` | [../src/features/editor/resolveStyle.ts](../src/features/editor/resolveStyle.ts) |
| `FONT_OPTIONS` / `loadCalendarFonts` | Curated font set (label + cssFamily) driving the picker; preload helper that resolves once the fonts are ready (Konva font-load redraw trap) | `FONT_OPTIONS: FontOption[]` · `loadCalendarFonts() => Promise<void>` | [../src/app/fonts.ts](../src/app/fonts.ts) |

## Shared UI
| Component | When to use | Signature | Source |
|---|---|---|---|
| `MonthPageCanvas` | DISPATCHER: owns the react-konva `<Stage>`/`stageRef`, resolves the global `style` once, then renders the selected layout from the registry (defaults to Classic Top; pass `layout` to override — editor, thumbnails, picker previews, export all reuse it) | `props: {year, month /*0-idx*/, weekStart, language, size: PixelSize, style?, layout?: LayoutId, imageUrl?, imageTransform?, onTransformChange?, stageRef?}` | [../src/features/editor/MonthPageCanvas.tsx](../src/features/editor/MonthPageCanvas.tsx) |
| layout `registry` | The month-page layout templates: `REGISTERED_LAYOUTS` drives the picker; `getLayout(id)` resolves a `MonthLayout` ({id,labelEn,labelCs,render(MonthLayoutProps)}) with default fallback | `REGISTERED_LAYOUTS`, `getLayout(id)`, `isRegisteredLayout(id)` | [../src/features/editor/layouts/registry.ts](../src/features/editor/layouts/registry.ts) |
| `LayoutPicker` | MUI visual radiogroup to pick the whole-calendar month-page layout; each option is a live preview of the active month rendered via the dispatcher | `props: {activeLayout, onSelect(id), language, groupLabel, year, month, weekStart, style?, imageUrl?, imageTransform?}` | [../src/features/controls/LayoutPicker.tsx](../src/features/controls/LayoutPicker.tsx) |
| `CoverPageCanvas` | Render the cover page: draggable title + optional draggable subtitle (page-fraction positions) + photo/placeholder; applies the global `style`. Draggable in the editor (move callbacks), static for thumbnail/PDF | `props: {title, subtitle, titlePosition, subtitlePosition, size, style?, imageUrl?, imageTransform?, onTitleMove?, onSubtitleMove?, onTransformChange?, stageRef?}` | [../src/features/editor/CoverPageCanvas.tsx](../src/features/editor/CoverPageCanvas.tsx) |
| `PageNavigator` | Thumbnail rail to select the active page (reuses the page canvases incl. the selected `layout`; accessible listbox) | `props: {pages, activeIndex, onSelect, weekStart, language, title, layout?, style?, images?, coverLabel, navigatorLabel}` | [../src/features/calendar/PageNavigator.tsx](../src/features/calendar/PageNavigator.tsx) |
| `ImageFrame` | Draw a user photo in a clipped, draggable Konva group (cover-fit × user transform) | `props: {imageUrl, transform, frame, imageInteractive?, onTransformChange}` (see source) | [../src/features/editor/ImageFrame.tsx](../src/features/editor/ImageFrame.tsx) |
| `ImageControls` | MUI upload/replace + remove + zoom-slider panel for the active page's image | `props: {hasImage, onUpload(file), onRemove, zoom, onZoom, labels}` (see source) | [../src/features/controls/ImageControls.tsx](../src/features/controls/ImageControls.tsx) |
| `StyleControls` | MUI panel for the whole-calendar style: curated font `Select` + native color inputs (text / Saturday / Sunday / background) with preset swatches | `props: {style, onFontChange(family), onColorChange(key,value), labels}` | [../src/features/controls/StyleControls.tsx](../src/features/controls/StyleControls.tsx) |
| `createAppTheme` | Build the MUI light/dark theme (Nunito, calm neutral palette) | `(mode: 'light'\|'dark') => Theme` | [../src/app/theme.ts](../src/app/theme.ts) |

## Hooks
| Component | When to use | Signature | Source |
|---|---|---|---|
| `useImageElement` | Load an HTMLImageElement from a URL for Konva (no `use-image` dep); handles cleanup | `(url: string \| null) => HTMLImageElement \| null` | [../src/features/editor/useImageElement.ts](../src/features/editor/useImageElement.ts) |

## Middleware
| Component | When to use | Signature | Source |
|---|---|---|---|
| _(none yet)_ | | | |
