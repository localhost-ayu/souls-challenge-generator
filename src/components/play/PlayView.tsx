"use client";

import { useTranslation } from "@/i18n/useTranslation";
import { PlayForm } from "./PlayForm";
import { SeedForm } from "./SeedForm";

export function PlayView() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-3xl px-5 pt-10 pb-16 sm:px-8 sm:pt-16">
      <h1 className="font-display text-title font-medium text-bone">{t("play.title")}</h1>
      <PlayForm />
      <SeedForm />
    </div>
  );
}
