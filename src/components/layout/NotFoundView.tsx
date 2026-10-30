"use client";

import { Icon } from "@/components/icons/Icon";
import { ButtonLink } from "@/components/ui/Button";
import { useTranslation } from "@/i18n/useTranslation";

export function NotFoundView() {
  const { t } = useTranslation();

  return (
    <div className="page max-w-form pt-16">
      <div className="state">
        <span className="state-icon">
          <Icon name="embers" size={32} />
        </span>
        <p aria-hidden="true" className="display text-4xl text-ember">
          404
        </p>
        <h1>{t("notFound.title")}</h1>
        <p>{t("notFound.body")}</p>
        <div className="cta-row">
          <ButtonLink href="/" variant="primary">
            {t("notFound.home")}
          </ButtonLink>
          <ButtonLink href="/play">{t("notFound.play")}</ButtonLink>
        </div>
      </div>
    </div>
  );
}
