"use client";

import { useTranslation } from "@/i18n/useTranslation";
import { ButtonLink } from "@/components/ui/Button";

/** Explains why a run cannot be shown and points to the way out. */
export function RunMessage({ title, body }: { title: string; body: string }) {
  const { t } = useTranslation();

  return (
    <div role="alert" className="max-w-prose">
      <h1 className="font-display text-title font-medium text-bone">{title}</h1>
      <p className="mt-6 text-lead text-parchment">{body}</p>
      <ButtonLink href="/play" variant="primary" className="mt-10">
        {t("run.errors.backToPlay")}
      </ButtonLink>
    </div>
  );
}
