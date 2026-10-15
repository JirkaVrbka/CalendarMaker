import { describe, expect, it } from 'vitest'
import { DISPLAY_FONT, FONT_OPTIONS, UI_FONT } from './fonts'

describe('fonts', () => {
  it('includes the original curated five families', () => {
    const families = FONT_OPTIONS.map((f) => f.cssFamily)
    expect(families).toContain('Nunito')
    expect(families).toContain('Inter')
    expect(families).toContain('Merriweather')
    expect(families).toContain('Playfair Display')
    expect(families).toContain('Pacifico')
  })

  it('includes the new restyle families Fraunces and Hanken Grotesk', () => {
    const families = FONT_OPTIONS.map((f) => f.cssFamily)
    expect(families).toContain('Fraunces')
    expect(families).toContain('Hanken Grotesk')
  })

  it('exposes the UI and display font constants used by the theme', () => {
    expect(UI_FONT).toBe('Hanken Grotesk')
    expect(DISPLAY_FONT).toBe('Fraunces')
  })
})
