"use client";

import { useTranslation } from "@/i18n/useTranslation";
import { PlayForm } from "./PlayForm";
import { SeedForm } from "./SeedForm";

export function PlayView() {
  const { t } = useTranslation();

  return (
    <div className="page max-w-form pt-12">
      <div className="mb-12 flex flex-col gap-2.5">
        <p className="eyebrow">{t("play.eyebrow")}</p>
        <h1 className="display page-title">{t("play.title")}</h1>
        <p className="lead">{t("play.lead")}</p>
      </div>
      <PlayForm />
      <SeedForm />
    </div>
  );
}
