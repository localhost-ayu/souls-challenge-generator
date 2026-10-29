"use client";

import { useTranslation } from "@/i18n/useTranslation";

export function HomeIntro() {
  const { t } = useTranslation();

  return (
    <section className="mx-auto max-w-page px-5 pt-16 pb-24 sm:px-8 sm:pt-28">
      <h1 className="max-w-3xl font-display text-display font-medium text-bone">
        {t("home.title")}
      </h1>
      <p className="mt-8 max-w-prose text-lead text-parchment">{t("home.lead")}</p>
      <p className="mt-10 font-sans text-base text-stone-400">{t("home.status")}</p>
    </section>
  );
}
