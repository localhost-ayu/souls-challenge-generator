"use client";

import { useTranslation } from "@/i18n/useTranslation";
import { ButtonLink } from "@/components/ui/Button";

export function NotFoundView() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-page px-5 pt-16 pb-24 sm:px-8 sm:pt-28">
      <p aria-hidden="true" className="font-display text-display text-ember/40">
        404
      </p>
      <h1 className="mt-2 max-w-3xl font-display text-title font-medium text-bone">
        {t("notFound.title")}
      </h1>
      <p className="mt-6 max-w-prose text-lead text-parchment">{t("notFound.body")}</p>
      <div className="mt-10 flex flex-wrap items-center gap-4">
        <ButtonLink href="/" variant="primary">
          {t("notFound.home")}
        </ButtonLink>
        <ButtonLink href="/play">{t("notFound.play")}</ButtonLink>
      </div>
    </div>
  );
}
