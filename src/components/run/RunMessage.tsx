"use client";

import { Icon, type IconName } from "@/components/icons/Icon";
import { ButtonLink } from "@/components/ui/Button";
import { useTranslation } from "@/i18n/useTranslation";

export type MessageTone = "neutral" | "warn" | "bad";

/** Explains why a run cannot be shown and points to the way out. */
export function RunMessage({
  title,
  body,
  icon,
  tone = "neutral",
}: {
  title: string;
  body: string;
  icon: IconName;
  tone?: MessageTone;
}) {
  const { t } = useTranslation();

  return (
    <div role="alert" className={`state ${tone === "neutral" ? "" : tone}`.trim()}>
      <span className="state-icon">
        <Icon name={icon} size={32} />
      </span>
      <h1>{title}</h1>
      <p>{body}</p>
      <div className="cta-row">
        <ButtonLink href="/play" variant="primary">
          <Icon name="settings" size={18} />
          {t("run.errors.backToPlay")}
        </ButtonLink>
      </div>
    </div>
  );
}
