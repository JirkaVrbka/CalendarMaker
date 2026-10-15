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
  /** Header wordmark subline, e.g. "Studio · Wall Calendar". */
  readonly appSubtitle: string
  /** Doc-crumb suffix indicating the project is autosaved in the browser. */
  readonly savedLocally: string
  /** Rail header label above the page thumbnails. */
  readonly pagesLabel: string
  /** Hint telling the user the photo can be dragged on the canvas. */
  readonly imageDragHint: string
  /** Stage toolbar page indicator, e.g. "Page 4 / 13 · March". */
  readonly pageIndicator: (
    current: number,
    total: number,
    pageLabel: string,
  ) => string
  readonly uploadImage: string
  readonly replaceImage: string
  readonly removeImage: string
  readonly zoomLabel: string
  readonly fontLabel: string
  /** Label for the font-size slider. */
  readonly fontSizeLabel: string
  readonly textColorLabel: string
  readonly saturdayColorLabel: string
  readonly sundayColorLabel: string
  readonly backgroundColorLabel: string
  /** Label for the calendar-language selector. */
  readonly languageLabel: string
  /** Muted info hint shown at the bottom of the Calendar section. */
  readonly calendarInfo: string
  /** Accessible group label for the layout-template picker. */
  readonly layoutLabel: string
  /** Accessible name for the right-hand controls panel region. */
  readonly controlsPanelLabel: string
  /**
   * Muted sub-line under the controls-panel head, e.g.
   * "Editing page 4 of 13 — changes apply to this page".
   */
  readonly panelEditingNote: (current: number, total: number) => string
  /** Controls-panel section headings. */
  readonly sectionPageText: string
  readonly sectionPhoto: string
  readonly sectionColors: string
  readonly sectionTypography: string
  readonly sectionCalendar: string
  readonly sectionLayout: string
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
    appSubtitle: 'Studio · Wall Calendar',
    savedLocally: 'saved locally',
    pagesLabel: 'Pages',
    imageDragHint: 'Drag the photo on the canvas to reposition it.',
    pageIndicator: (current, total, pageLabel) =>
      `Page ${current} / ${total} · ${pageLabel}`,
    uploadImage: 'Upload photo',
    replaceImage: 'Replace photo',
    removeImage: 'Remove photo',
    zoomLabel: 'Zoom',
    fontLabel: 'Font',
    fontSizeLabel: 'Font size',
    textColorLabel: 'Text color',
    saturdayColorLabel: 'Saturday color',
    sundayColorLabel: 'Sunday color',
    backgroundColorLabel: 'Background color',
    languageLabel: 'Language',
    calendarInfo:
      'Weeks start Monday. Saturdays & Sundays use the weekend highlight. Exported as A4 portrait.',
    layoutLabel: 'Layout',
    controlsPanelLabel: 'Controls',
    panelEditingNote: (current, total) =>
      `Editing page ${current} of ${total} — changes apply to this page`,
    sectionPageText: 'Page text',
    sectionPhoto: 'Photo',
    sectionColors: 'Colors',
    sectionTypography: 'Typography',
    sectionCalendar: 'Calendar',
    sectionLayout: 'Layout',
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
    appSubtitle: 'Studio · Nástěnný kalendář',
    savedLocally: 'uloženo v prohlížeči',
    pagesLabel: 'Stránky',
    imageDragHint: 'Fotku přesuňte přímo na plátně.',
    pageIndicator: (current, total, pageLabel) =>
      `Strana ${current} / ${total} · ${pageLabel}`,
    uploadImage: 'Nahrát fotku',
    replaceImage: 'Vyměnit fotku',
    removeImage: 'Odebrat fotku',
    zoomLabel: 'Přiblížení',
    fontLabel: 'Písmo',
    fontSizeLabel: 'Velikost písma',
    textColorLabel: 'Barva textu',
    saturdayColorLabel: 'Barva soboty',
    sundayColorLabel: 'Barva neděle',
    backgroundColorLabel: 'Barva pozadí',
    languageLabel: 'Jazyk',
    calendarInfo:
      'Týdny začínají pondělím. Soboty a neděle používají zvýraznění víkendu. Export jako A4 na výšku.',
    layoutLabel: 'Rozvržení',
    controlsPanelLabel: 'Ovládání',
    panelEditingNote: (current, total) =>
      `Úprava stránky ${current} z ${total} — změny platí pro tuto stránku`,
    sectionPageText: 'Text stránky',
    sectionPhoto: 'Fotka',
    sectionColors: 'Barvy',
    sectionTypography: 'Typografie',
    sectionCalendar: 'Kalendář',
    sectionLayout: 'Rozvržení',
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
