"use client";

import { LOCALES } from "@/i18n/config";
import { useTranslation } from "@/i18n/useTranslation";

const SHORT_LABELS = { "en-US": "EN", "pt-BR": "PT" } as const;

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useTranslation();

  return (
    <div role="group" aria-label={t("language.label")} className="lang">
      {LOCALES.map((option) => (
        <button
          key={option}
          type="button"
          lang={option}
          aria-pressed={option === locale}
          // The visible code stays part of the accessible name.
          aria-label={`${t(`language.${option}`)} (${SHORT_LABELS[option]})`}
          onClick={() => setLocale(option)}
        >
          {SHORT_LABELS[option]}
        </button>
      ))}
    </div>
  );
}
