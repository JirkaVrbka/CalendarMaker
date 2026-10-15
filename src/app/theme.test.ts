/**
 * Theme factory tests. These lock in the professional design tokens pulled from
 * mockups/app-professional.html so a stray color or font swap can't slip through
 * unnoticed — the calendar relies on these palette values reading true, and the
 * `theme.tokens` bag is the single source of truth for the chrome design system.
 */
import { describe, it, expect } from 'vitest'
import { createAppTheme } from './theme'

describe('createAppTheme', () => {
  describe('light mode', () => {
    const theme = createAppTheme('light')

    it('uses the paper background token for background.default', () => {
      expect(theme.palette.background.default).toBe('#F4F2EC')
    })

    it('uses the accent token for primary.main', () => {
      expect(theme.palette.primary.main).toBe('#1E3A5F')
    })

    it('uses the weekend token for secondary.main', () => {
      expect(theme.palette.secondary.main).toBe('#A8432A')
    })

    it('uses the hairline token for divider', () => {
      expect(theme.palette.divider).toBe('#E1DED5')
    })

    it('uses Hanken Grotesk as the base UI font', () => {
      expect(theme.typography.fontFamily).toContain('Hanken Grotesk')
    })

    it('uses the Fraunces display stack on headings', () => {
      expect(theme.typography.h2.fontFamily).toContain('Fraunces')
    })

    it('exposes the surface and layout tokens', () => {
      expect(theme.tokens.surface).toBe('#FBFAF7')
      expect(theme.tokens.layout.railWidth).toBe(136)
      expect(theme.tokens.layout.panelWidth).toBe(312)
    })

    it('exposes an elevation shadow string', () => {
      expect(theme.tokens.shadow.page).toContain('rgba(28,32,36')
    })
  })

  describe('dark mode', () => {
    const theme = createAppTheme('dark')

    it('uses the dark surface token for background.default', () => {
      expect(theme.palette.background.default).toBe('#14161A')
    })

    it('uses the dark accent token for primary.main', () => {
      expect(theme.palette.primary.main).toBe('#6E92C4')
    })

    it('uses the dark weekend token for secondary.main', () => {
      expect(theme.palette.secondary.main).toBe('#E09578')
    })

    it('uses the dark hairline token for divider', () => {
      expect(theme.palette.divider).toBe('#2C3036')
    })

    it('exposes the dark surface and layout tokens', () => {
      expect(theme.tokens.surface).toBe('#1A1D22')
      expect(theme.tokens.layout.railWidth).toBe(136)
      expect(theme.tokens.layout.panelWidth).toBe(312)
    })

    it('exposes an elevation shadow string', () => {
      expect(theme.tokens.shadow.page).toContain('rgba(0,0,0')
    })
  })
})
