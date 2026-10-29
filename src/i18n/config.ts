export const LOCALES = ["en-US", "pt-BR"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en-US";

export function isLocale(value: unknown): value is Locale {
  return LOCALES.includes(value as Locale);
}

/** Maps browser language tags (e.g. "pt", "pt-PT", "en-GB") to a supported locale. */
export function matchLocale(languages: readonly string[]): Locale {
  for (const language of languages) {
    const tag = language.toLowerCase();
    const exact = LOCALES.find((locale) => locale.toLowerCase() === tag);
    if (exact) return exact;
    const sameLanguage = LOCALES.find(
      (locale) => locale.split("-")[0] === tag.split("-")[0],
    );
    if (sameLanguage) return sameLanguage;
  }
  return DEFAULT_LOCALE;
}
