/**
 * Pure helpers for the PDF export. Kept free of jsPDF, React and the DOM so they
 * are fully unit-testable: the export pixel size for a given print resolution,
 * and a safe download filename derived from the calendar title.
 */
import { A4_PORTRAIT, type PixelSize } from '../../lib/page'

/** Print resolution for the exported pages. 300 DPI is print-quality. */
export const EXPORT_DPI = 300

/** Millimetres per inch (ISO/imperial constant). */
const MM_PER_INCH = 25.4

/** Fallback download name when the title yields nothing usable. */
export const DEFAULT_PDF_FILENAME = 'calendar.pdf'

/**
 * Pixel dimensions of an A4 portrait page at the given print resolution.
 * At 300 DPI this is ≈ 2480 × 3508 px. Computed from the physical A4 size (not
 * hardcoded) so a different DPI scales correctly; rounded to whole pixels.
 */
export function computeExportPixelSize(dpi: number): PixelSize {
  const pxPerMm = dpi / MM_PER_INCH
  return {
    width: Math.round(A4_PORTRAIT.widthMm * pxPerMm),
    height: Math.round(A4_PORTRAIT.heightMm * pxPerMm),
  }
}

/**
 * Turn a calendar title into a safe `*.pdf` download filename: replaces path
 * separators, Windows-reserved punctuation and ASCII control chars with spaces,
 * collapses whitespace, strips leading dots (so e.g. ".env" can't become a
 * hidden dotfile) and any trailing dots/spaces, and falls back to
 * `calendar.pdf` when nothing printable remains. Hyphens are a legal filename
 * char and are intentionally kept.
 */
export function pdfFilename(title: string | null | undefined): string {
  const cleaned = (title ?? '')
    // Replace characters that are illegal/unsafe in file names with a space:
    // path separators, Windows-reserved punctuation, and ASCII control chars
    // (0x00-0x1f). The hyphen is NOT in this set, so "Mom-2026" keeps its
    // hyphen.
    // eslint-disable-next-line no-control-regex -- control chars are exactly what we strip
    .replace(/[\\/:*?"<>|\x00-\x1f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    // Strip leading dots so a title like ".env" becomes "env" rather than a
    // hidden dotfile; an all-dots title ("..", "...") collapses to empty and
    // hits the fallback below.
    .replace(/^\.+/, '')
    // No trailing dot/space (invalid on Windows).
    .replace(/[.\s]+$/, '')

  return cleaned ? `${cleaned}.pdf` : DEFAULT_PDF_FILENAME
}
