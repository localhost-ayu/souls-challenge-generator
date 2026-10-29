import { DEFAULT_LOCALE, isLocale, matchLocale, type Locale } from "./config";

// Replaced by the versioned storage wrapper once it exists.
const STORAGE_KEY = "scg:locale";

const listeners = new Set<() => void>();
let current: Locale | undefined;

function detectLocale(): Locale {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    // Storage can be blocked (privacy mode, disabled cookies); fall through.
  }
  return matchLocale(navigator.languages ?? [navigator.language]);
}

export function getLocale(): Locale {
  current ??= detectLocale();
  return current;
}

/** The static HTML is always rendered in the default locale. */
export function getServerLocale(): Locale {
  return DEFAULT_LOCALE;
}

export function subscribeToLocale(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setLocale(locale: Locale): void {
  current = locale;
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Not persisting is fine; the choice still applies to this visit.
  }
  listeners.forEach((listener) => listener());
}
