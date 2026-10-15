import { isValidElement } from 'react'
import { describe, expect, it } from 'vitest'

import { DEFAULT_LAYOUT } from '../../../types/calendar'
import type { LayoutId } from '../../../types/calendar'
import type { PixelSize } from '../../../lib/page'
import {
  getLayout,
  isRegisteredLayout,
  REGISTERED_LAYOUTS,
} from './registry'
import type { MonthLayoutProps } from './types'

const SIZE: PixelSize = { width: 480, height: 679 }

function sampleProps(): MonthLayoutProps {
  return {
    size: SIZE,
    year: 2026,
    month: 2,
    weekStart: 1,
    language: 'en',
    style: {
      fontFamily: 'Nunito',
      background: '#ffffff',
      text: '#2b2f38',
      saturday: '#4c6ef5',
      sunday: '#e03131',
      fontScale: 1,
    },
  }
}

describe('layout registry', () => {
  it('registers all seven Wave-1 + Wave-2 layouts in picker order', () => {
    expect(REGISTERED_LAYOUTS.map((l) => l.id)).toEqual([
      'classic-top',
      'fullbleed-ribbon',
      'bottom-photo',
      'framed',
      'minimal-overlay',
      'agenda',
      'vertical-ribbon',
    ])
  })

  it('gives every registered layout both localized labels', () => {
    for (const layout of REGISTERED_LAYOUTS) {
      expect(layout.labelEn.length).toBeGreaterThan(0)
      expect(layout.labelCs.length).toBeGreaterThan(0)
    }
  })

  it('reports each registered id as registered and renders an element', () => {
    for (const layout of REGISTERED_LAYOUTS) {
      expect(isRegisteredLayout(layout.id)).toBe(true)
      expect(isValidElement(layout.render(sampleProps()))).toBe(true)
      expect(getLayout(layout.id)).toBe(layout)
    }
  })

  it('falls back to the default layout for an unknown id', () => {
    const unknown = 'not-a-layout' as LayoutId
    expect(isRegisteredLayout(unknown)).toBe(false)
    expect(getLayout(unknown).id).toBe(DEFAULT_LAYOUT)
  })
})
