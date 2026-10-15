import { describe, expect, it } from 'vitest'

import {
  computeExportPixelSize,
  DEFAULT_EXPORT_QUALITY,
  DEFAULT_PDF_FILENAME,
  EXPORT_DPI,
  EXPORT_PRESETS,
  pdfFilename,
} from './exportGeometry'

describe('computeExportPixelSize', () => {
  it('A4 portrait at 300 DPI is ~2480 × 3508 px', () => {
    const size = computeExportPixelSize(EXPORT_DPI)
    expect(size.width).toBe(2480)
    expect(size.height).toBe(3508)
  })

  it('scales linearly with DPI (150 DPI is half of 300)', () => {
    const at150 = computeExportPixelSize(150)
    const at300 = computeExportPixelSize(300)
    expect(at150.width).toBeCloseTo(at300.width / 2, 0)
    expect(at150.height).toBeCloseTo(at300.height / 2, 0)
  })

  it('keeps the A4 portrait aspect ratio (taller than wide)', () => {
    const size = computeExportPixelSize(EXPORT_DPI)
    expect(size.height).toBeGreaterThan(size.width)
    expect(size.width / size.height).toBeCloseTo(210 / 297, 3)
  })
})

describe('EXPORT_PRESETS', () => {
  it('maps each quality to its documented DPI + JPEG quality', () => {
    expect(EXPORT_PRESETS.small).toEqual({ dpi: 150, jpegQuality: 0.82 })
    expect(EXPORT_PRESETS.balanced).toEqual({ dpi: 220, jpegQuality: 0.9 })
    expect(EXPORT_PRESETS.max).toEqual({ dpi: 300, jpegQuality: 0.95 })
  })

  it('higher presets have strictly higher DPI and JPEG quality', () => {
    expect(EXPORT_PRESETS.small.dpi).toBeLessThan(EXPORT_PRESETS.balanced.dpi)
    expect(EXPORT_PRESETS.balanced.dpi).toBeLessThan(EXPORT_PRESETS.max.dpi)
    expect(EXPORT_PRESETS.small.jpegQuality).toBeLessThan(
      EXPORT_PRESETS.balanced.jpegQuality,
    )
    expect(EXPORT_PRESETS.balanced.jpegQuality).toBeLessThan(
      EXPORT_PRESETS.max.jpegQuality,
    )
  })

  it('defaults to the balanced preset', () => {
    expect(DEFAULT_EXPORT_QUALITY).toBe('balanced')
    expect(EXPORT_PRESETS[DEFAULT_EXPORT_QUALITY]).toBe(EXPORT_PRESETS.balanced)
  })
})

describe('pdfFilename', () => {
  it('appends .pdf to a plain title', () => {
    expect(pdfFilename('My 2026 Calendar')).toBe('My 2026 Calendar.pdf')
  })

  it('strips path separators and reserved characters', () => {
    expect(pdfFilename('Trip: 2026/2027 <draft>')).toBe('Trip 2026 2027 draft.pdf')
  })

  it('collapses whitespace and trims', () => {
    expect(pdfFilename('   Family   Album   ')).toBe('Family Album.pdf')
  })

  it('falls back to calendar.pdf for empty or whitespace titles', () => {
    expect(pdfFilename('')).toBe(DEFAULT_PDF_FILENAME)
    expect(pdfFilename('   ')).toBe(DEFAULT_PDF_FILENAME)
    expect(pdfFilename(null)).toBe(DEFAULT_PDF_FILENAME)
    expect(pdfFilename(undefined)).toBe(DEFAULT_PDF_FILENAME)
  })

  it('falls back when the title is only dots or reserved characters', () => {
    expect(pdfFilename('...')).toBe(DEFAULT_PDF_FILENAME)
    expect(pdfFilename('///')).toBe(DEFAULT_PDF_FILENAME)
  })

  it('does not leave a trailing dot or space before the extension', () => {
    expect(pdfFilename('Calendar.')).toBe('Calendar.pdf')
  })

  it('keeps hyphens (a legal filename character)', () => {
    expect(pdfFilename('Mom-2026')).toBe('Mom-2026.pdf')
  })

  it('strips ASCII control characters', () => {
    expect(pdfFilename('HelloWorld')).toBe('Hello World.pdf')
    expect(pdfFilename('Trip2026')).toBe('Trip 2026.pdf')
  })

  it('strips leading dots so a dotfile title is not produced', () => {
    expect(pdfFilename('.env')).toBe('env.pdf')
    expect(pdfFilename('..hidden')).toBe('hidden.pdf')
  })

  it('still falls back for an all-dots title', () => {
    expect(pdfFilename('..')).toBe(DEFAULT_PDF_FILENAME)
  })
})
