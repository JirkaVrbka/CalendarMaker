/**
 * The month-page layout registry. Only layouts listed here are "registered":
 * they appear in the picker and can render. The `LayoutId` union in the model
 * lists all seven planned templates, but Wave 1 registers two — Classic Top and
 * Full-bleed Ribbon — and Wave 2 adds the rest by appending them here.
 *
 * Lookup always falls back to the default (Classic Top) so a project whose
 * `layout` is a not-yet-registered id (e.g. a Wave 2 layout opened in a Wave 1
 * build) still renders rather than crashing.
 */
import { createElement } from 'react'

import { DEFAULT_LAYOUT } from '../../../types/calendar'
import type { LayoutId } from '../../../types/calendar'
import { AgendaLayout } from './agenda'
import { BottomPhotoLayout } from './bottom-photo'
import { ClassicTopLayout } from './classic-top'
import { FramedLayout } from './framed'
import { FullbleedRibbonLayout } from './fullbleed-ribbon'
import { MinimalOverlayLayout } from './minimal-overlay'
import type { MonthLayout } from './types'
import { VerticalRibbonLayout } from './vertical-ribbon'

// Registry ENTRIES live here (a .ts file) rather than in the layout .tsx files
// so those stay component-only (keeps React Fast Refresh working — no
// react/only-export-components lint warning). `render` wraps each component in
// an element via `createElement`, exactly what `<Component {...props} />` did.
const classicTop: MonthLayout = {
  id: 'classic-top',
  labelEn: 'Classic Top',
  labelCs: 'Klasický nahoře',
  render: (props) => createElement(ClassicTopLayout, props),
}

const fullbleedRibbon: MonthLayout = {
  id: 'fullbleed-ribbon',
  labelEn: 'Full-bleed Ribbon',
  labelCs: 'Fotka na celou stranu',
  render: (props) => createElement(FullbleedRibbonLayout, props),
}

const bottomPhoto: MonthLayout = {
  id: 'bottom-photo',
  labelEn: 'Bottom Photo',
  labelCs: 'Foto dole',
  render: (props) => createElement(BottomPhotoLayout, props),
}

const framed: MonthLayout = {
  id: 'framed',
  labelEn: 'Framed',
  labelCs: 'Rámeček',
  render: (props) => createElement(FramedLayout, props),
}

const minimalOverlay: MonthLayout = {
  id: 'minimal-overlay',
  labelEn: 'Minimal Overlay',
  labelCs: 'Minimal',
  render: (props) => createElement(MinimalOverlayLayout, props),
}

const agenda: MonthLayout = {
  id: 'agenda',
  labelEn: 'Agenda',
  labelCs: 'Agenda',
  render: (props) => createElement(AgendaLayout, props),
}

const verticalRibbon: MonthLayout = {
  id: 'vertical-ribbon',
  labelEn: 'Vertical Ribbon',
  labelCs: 'Svislý pruh',
  render: (props) => createElement(VerticalRibbonLayout, props),
}

/** All registered layouts, in picker display order. */
export const REGISTERED_LAYOUTS: readonly MonthLayout[] = [
  classicTop,
  fullbleedRibbon,
  bottomPhoto,
  framed,
  minimalOverlay,
  agenda,
  verticalRibbon,
]

const REGISTRY: Partial<Record<LayoutId, MonthLayout>> = Object.fromEntries(
  REGISTERED_LAYOUTS.map((layout) => [layout.id, layout]),
)

/** True when `id` is a currently-registered (renderable) layout. */
export function isRegisteredLayout(id: LayoutId): boolean {
  return id in REGISTRY
}

/**
 * Resolve a layout by id, falling back to the default when the id is not
 * registered in this build (keeps old/forward configs renderable).
 */
export function getLayout(id: LayoutId): MonthLayout {
  return REGISTRY[id] ?? REGISTRY[DEFAULT_LAYOUT] ?? classicTop
}
