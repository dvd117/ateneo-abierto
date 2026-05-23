export type Locale = 'es' | 'en';

export type LocaleDetectionInput = {
  search: string;
  savedLocale: string | null;
  browserLanguages: readonly string[];
};

const supportedLocales = new Set<Locale>(['es', 'en']);

export function isLocale(value: string | null): value is Locale {
  return value === 'es' || value === 'en';
}

export function detectLocale(input: LocaleDetectionInput): Locale {
  const params = new URLSearchParams(input.search);
  const urlLocale = params.get('lang');

  if (isLocale(urlLocale)) {
    return urlLocale;
  }

  if (isLocale(input.savedLocale)) {
    return input.savedLocale;
  }

  for (const language of input.browserLanguages) {
    const baseLanguage = language.toLowerCase().split('-')[0];

    if (supportedLocales.has(baseLanguage as Locale)) {
      return baseLanguage as Locale;
    }
  }

  return 'en';
}

export function readSavedLocale(storage: Storage): Locale | null {
  const savedLocale = storage.getItem('ateneo-abierto-locale');
  return isLocale(savedLocale) ? savedLocale : null;
}

export function saveLocale(storage: Storage, locale: Locale): void {
  storage.setItem('ateneo-abierto-locale', locale);
}

export function updateUrlLocale(url: URL, locale: Locale): string {
  url.searchParams.set('lang', locale);
  return `${url.pathname}${url.search}${url.hash}`;
}
