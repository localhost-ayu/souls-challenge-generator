"use client";

import { LOCALES } from "@/i18n/config";
import { useTranslation } from "@/i18n/useTranslation";

const SHORT_LABELS = { "en-US": "EN", "pt-BR": "PT" } as const;

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useTranslation();

  return (
    <div
      role="group"
      aria-label={t("language.label")}
      className="flex rounded-full border border-stone-600 p-0.5 font-sans text-sm"
    >
      {LOCALES.map((option) => {
        const active = option === locale;
        return (
          <button
            key={option}
            type="button"
            lang={option}
            aria-pressed={active}
            // The visible code stays part of the accessible name.
            aria-label={`${t(`language.${option}`)} (${SHORT_LABELS[option]})`}
            onClick={() => setLocale(option)}
            className={`rounded-full px-3 py-1 font-medium transition-colors duration-200 ${
              active
                ? "bg-bone text-abyss"
                : "text-stone-400 hover:text-bone"
            }`}
          >
            {SHORT_LABELS[option]}
          </button>
        );
      })}
    </div>
  );
}
