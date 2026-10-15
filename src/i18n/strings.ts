/**
 * Minimal UI string table for the foundation slice. Month and weekday names
 * come from native `Intl` (see `src/lib/calendar.ts`); only the few chrome
 * labels live here. A fuller i18n setup can replace this later.
 */
import type { Language } from '../types/calendar'

interface UiStrings {
  readonly appTitle: string
  readonly toggleTheme: string
  readonly toggleLanguage: string
  readonly languageName: string
  readonly titleLabel: string
  readonly subtitleLabel: string
  readonly startMonthLabel: string
  readonly startYearLabel: string
  readonly navigatorLabel: string
  readonly coverLabel: string
  readonly uploadImage: string
  readonly replaceImage: string
  readonly removeImage: string
  readonly zoomLabel: string
  readonly fontLabel: string
  readonly textColorLabel: string
  readonly saturdayColorLabel: string
  readonly sundayColorLabel: string
  readonly backgroundColorLabel: string
  /** Accessible group label for the layout-template picker. */
  readonly layoutLabel: string
  readonly newReset: string
  readonly newResetConfirm: string
  readonly loading: string
  readonly exportPdf: string
  readonly exportError: string
  /** Progress label shown while exporting, e.g. "Page 3 / 13". */
  readonly exportProgress: (current: number, total: number) => string
}

const STRINGS: Record<Language, UiStrings> = {
  en: {
    appTitle: 'CalendarMaker',
    toggleTheme: 'Toggle light / dark theme',
    toggleLanguage: 'Switch language',
    languageName: 'English',
    titleLabel: 'Calendar title',
    subtitleLabel: 'Subtitle',
    startMonthLabel: 'Start month',
    startYearLabel: 'Start year',
    navigatorLabel: 'Calendar pages',
    coverLabel: 'Cover',
    uploadImage: 'Upload photo',
    replaceImage: 'Replace photo',
    removeImage: 'Remove photo',
    zoomLabel: 'Zoom',
    fontLabel: 'Font',
    textColorLabel: 'Text color',
    saturdayColorLabel: 'Saturday color',
    sundayColorLabel: 'Sunday color',
    backgroundColorLabel: 'Background color',
    layoutLabel: 'Layout',
    newReset: 'New / Reset',
    newResetConfirm:
      'Start a new calendar? This clears the current calendar and all its photos.',
    loading: 'Loading…',
    exportPdf: 'Export PDF',
    exportError: 'PDF export failed. Please try again.',
    exportProgress: (current, total) => `Page ${current} / ${total}`,
  },
  cs: {
    appTitle: 'CalendarMaker',
    toggleTheme: 'Přepnout světlý / tmavý režim',
    toggleLanguage: 'Změnit jazyk',
    languageName: 'Čeština',
    titleLabel: 'Název kalendáře',
    subtitleLabel: 'Podnázev',
    startMonthLabel: 'První měsíc',
    startYearLabel: 'První rok',
    navigatorLabel: 'Stránky kalendáře',
    coverLabel: 'Obálka',
    uploadImage: 'Nahrát fotku',
    replaceImage: 'Vyměnit fotku',
    removeImage: 'Odebrat fotku',
    zoomLabel: 'Přiblížení',
    fontLabel: 'Písmo',
    textColorLabel: 'Barva textu',
    saturdayColorLabel: 'Barva soboty',
    sundayColorLabel: 'Barva neděle',
    backgroundColorLabel: 'Barva pozadí',
    layoutLabel: 'Rozvržení',
    newReset: 'Nový / Reset',
    newResetConfirm:
      'Začít nový kalendář? Tím se smaže aktuální kalendář i všechny jeho fotky.',
    loading: 'Načítání…',
    exportPdf: 'Exportovat PDF',
    exportError: 'Export PDF se nezdařil. Zkuste to prosím znovu.',
    exportProgress: (current, total) => `Strana ${current} / ${total}`,
  },
}

export function getStrings(lang: Language): UiStrings {
  return STRINGS[lang]
}
