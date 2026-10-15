/**
 * The curated font set for the calendar. Deliberately small (7) with variety —
 * a rounded sans, a neutral sans, a serif, an elegant display serif, a
 * handwritten display, plus Fraunces and Hanken Grotesk — so the picker is a
 * quick, opinionated choice rather than an open font browser (no arbitrary
 * upload this slice). Fraunces and Hanken Grotesk pull double duty: they are the
 * app's UI-chrome fonts (see `DISPLAY_FONT`/`UI_FONT` below, consumed by the
 * theme) AND are offered here as two selectable calendar fonts.
 *
 * These families MUST stay in sync with the Google-Fonts `<link>` in
 * `index.html`: the link loads the CSS @font-faces; `loadCalendarFonts` then
 * forces the actual font files to download. `cssFamily` is the exact CSS family
 * name used both as the Konva `fontFamily` and in `document.fonts.load`.
 */
export interface FontOption {
  /** Human label for the picker (shown in its own font). */
  readonly label: string
  /** Exact CSS family name (Konva fontFamily + `document.fonts.load`). */
  readonly cssFamily: string
}

export const FONT_OPTIONS: readonly FontOption[] = [
  { label: 'Nunito', cssFamily: 'Nunito' }, // rounded sans (the default)
  { label: 'Inter', cssFamily: 'Inter' }, // neutral sans
  { label: 'Merriweather', cssFamily: 'Merriweather' }, // serif
  { label: 'Playfair Display', cssFamily: 'Playfair Display' }, // elegant display serif
  { label: 'Pacifico', cssFamily: 'Pacifico' }, // handwritten display
  { label: 'Fraunces', cssFamily: 'Fraunces' }, // display serif (professional restyle)
  { label: 'Hanken Grotesk', cssFamily: 'Hanken Grotesk' }, // neutral sans (professional restyle)
]

/** UI chrome font for the professional restyle (app shell, controls, not calendar text). */
export const UI_FONT = 'Hanken Grotesk'

/** Display/heading font for the professional restyle (titles, not calendar text). */
export const DISPLAY_FONT = 'Fraunces'

/**
 * Force the curated font files to download and resolve once they are ready
 * (or immediately if the Font Loading API is unavailable, e.g. jsdom in tests).
 *
 * WHY THIS EXISTS: Konva paints `<Text>` with whatever font the browser has
 * ALREADY loaded and will not repaint when a web font arrives later. Preloading
 * the whole set up front means that by the time the user picks a font it is
 * already resolved, so a normal re-render draws it correctly. Callers also use
 * the returned promise to force one redraw after the initial load (see `App`).
 * Never throws — a font failure must not break the editor.
 *
 * Both the regular (400) and bold (700) weights are requested: titles, weekday
 * headers and weekend day numbers paint at `fontStyle="700"`, so preloading 400
 * alone would leave bold text unresolved (a faux-bold flash) until it loads.
 */
export async function loadCalendarFonts(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts?.load) return
  try {
    await Promise.all(
      FONT_OPTIONS.flatMap((font) => [
        document.fonts.load(`400 1em "${font.cssFamily}"`),
        document.fonts.load(`700 1em "${font.cssFamily}"`),
      ]),
    )
  } catch {
    /* Font Loading API unavailable or a family failed — ignore and move on. */
  }
}
