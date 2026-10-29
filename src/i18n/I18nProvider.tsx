"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { Locale } from "./config";
import {
  getLocale,
  getServerLocale,
  setLocale,
  subscribeToLocale,
} from "./locale-store";
import enUS from "./messages/en-US.json";
import ptBR from "./messages/pt-BR.json";
import {
  translate,
  type MessageKey,
  type MessageParams,
  type Messages,
} from "./translate";

// Typing pt-BR as Messages makes a missing key a type error.
const dictionaries: Record<Locale, Messages> = {
  "en-US": enUS,
  "pt-BR": ptBR,
};

export interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, params?: MessageParams) => string;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  // Hydrates with the server locale, then switches to the stored or
  // browser locale without a hydration mismatch.
  const locale = useSyncExternalStore(
    subscribeToLocale,
    getLocale,
    getServerLocale,
  );

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useCallback(
    (key: MessageKey, params?: MessageParams) =>
      translate(dictionaries[locale], key, params),
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, t]);

  return <I18nContext value={value}>{children}</I18nContext>;
}
