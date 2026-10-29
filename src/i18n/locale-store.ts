import { localeItem } from "@/lib/storage/items";
import {
  getItemValue,
  setItemValue,
  subscribeToItem,
} from "@/lib/storage/store";
import { DEFAULT_LOCALE, matchLocale, type Locale } from "./config";

/** The saved choice, else the browser languages, else the default. */
export function getLocale(): Locale {
  return (
    getItemValue(localeItem) ??
    matchLocale(navigator.languages ?? [navigator.language])
  );
}

/** The static HTML is always rendered in the default locale. */
export function getServerLocale(): Locale {
  return DEFAULT_LOCALE;
}

export function subscribeToLocale(listener: () => void): () => void {
  return subscribeToItem(localeItem, listener);
}

export function setLocale(locale: Locale): void {
  setItemValue(localeItem, locale);
}
