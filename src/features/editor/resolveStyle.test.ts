import { describe, expect, it } from 'vitest'

import { DEFAULT_STYLE } from '../../types/calendar'
import type { CalendarStyle } from '../../types/calendar'
import { resolveStyle } from './resolveStyle'

/** A fallback standing in for the theme-derived defaults the canvas supplies. */
const fallback: CalendarStyle = {
  fontFamily: 'FallbackFont',
  textColor: '#111111',
  saturdayColor: '#222222',
  sundayColor: '#444444',
  backgroundColor: '#333333',
}

describe('resolveStyle', () => {
  it('uses explicit style values verbatim when all are present', () => {
    const style: CalendarStyle = {
      fontFamily: 'Inter',
      textColor: '#aaaaaa',
      saturdayColor: '#bbbbbb',
      sundayColor: '#dddddd',
      backgroundColor: '#cccccc',
    }
    expect(resolveStyle(style, fallback)).toEqual({
      fontFamily: 'Inter',
      background: '#cccccc',
      text: '#aaaaaa',
      saturday: '#bbbbbb',
      sunday: '#dddddd',
    })
  })

  it('falls back field by field for missing values', () => {
    expect(resolveStyle({ textColor: '#aaaaaa' }, fallback)).toEqual({
      fontFamily: 'FallbackFont',
      background: '#333333',
      text: '#aaaaaa',
      saturday: '#222222',
      sunday: '#444444',
    })
  })

  it('treats a blank color string as unset and falls back (no empty/black fill)', () => {
    expect(
      resolveStyle(
        { textColor: '', saturdayColor: '   ', sundayColor: '', backgroundColor: '' },
        fallback,
      ),
    ).toEqual({
      fontFamily: 'FallbackFont',
      background: '#333333',
      text: '#111111',
      saturday: '#222222',
      sunday: '#444444',
    })
  })

  it('resolves Saturday and Sunday independently', () => {
    expect(resolveStyle({ saturdayColor: '#0000ff' }, fallback)).toEqual({
      fontFamily: 'FallbackFont',
      background: '#333333',
      text: '#111111',
      saturday: '#0000ff',
      sunday: '#444444',
    })
  })

  it('falls back entirely when the style is undefined', () => {
    expect(resolveStyle(undefined, fallback)).toEqual({
      fontFamily: 'FallbackFont',
      background: '#333333',
      text: '#111111',
      saturday: '#222222',
      sunday: '#444444',
    })
  })

  it('an explicit value wins over the fallback (the exported-PDF guarantee)', () => {
    // The fallback stands in for the export's forced-light theme; a user-chosen
    // value must still win so the PDF honors it rather than the paper default.
    const resolved = resolveStyle({ backgroundColor: '#000000' }, DEFAULT_STYLE)
    expect(resolved.background).toBe('#000000')
  })
})
