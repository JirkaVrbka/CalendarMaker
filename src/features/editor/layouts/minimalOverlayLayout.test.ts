import { describe, expect, it } from 'vitest'

import { computeMinimalOverlayLayout } from './minimalOverlayLayout'

const A4_PX = { width: 480, height: 679 }

describe('computeMinimalOverlayLayout', () => {
  it('makes the photo full-bleed (the whole page)', () => {
    const l = computeMinimalOverlayLayout(A4_PX, 6)
    expect(l.photo).toEqual({ x: 0, y: 0, width: 480, height: 679 })
  })

  it('anchors the card in the bottom-right, inside the page with a margin', () => {
    const l = computeMinimalOverlayLayout(A4_PX, 6)
    expect(l.card.x).toBeGreaterThan(0)
    expect(l.card.y).toBeGreaterThan(0)
    expect(l.card.x + l.card.width).toBeLessThan(480)
    expect(l.card.y + l.card.height).toBeLessThan(679)
    // Right/bottom margins are equal (corner-anchored).
    const rightMargin = 480 - (l.card.x + l.card.width)
    const bottomMargin = 679 - (l.card.y + l.card.height)
    expect(rightMargin).toBeCloseTo(bottomMargin, 5)
  })

  it('grows the card height with the number of week rows', () => {
    const five = computeMinimalOverlayLayout(A4_PX, 5)
    const six = computeMinimalOverlayLayout(A4_PX, 6)
    expect(six.card.height).toBeGreaterThan(five.card.height)
    // A taller card is anchored higher (bottom edge stays fixed).
    expect(six.card.y).toBeLessThan(five.card.y)
    expect(six.card.y + six.card.height).toBeCloseTo(five.card.y + five.card.height, 5)
  })

  it('places the title overlay near the top-left and keeps pad positive', () => {
    const l = computeMinimalOverlayLayout(A4_PX, 6)
    expect(l.title.x).toBeGreaterThan(0)
    expect(l.title.x).toBeLessThan(240)
    expect(l.title.y).toBeLessThan(l.card.y)
    expect(l.title.monthFontSize).toBeGreaterThan(l.title.yearFontSize)
    expect(l.cardPad).toBeGreaterThan(0)
    expect(l.cardPad * 2).toBeLessThan(l.card.height)
  })
})
