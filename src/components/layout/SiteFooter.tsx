"use client";

import Link from "next/link";
import { useTranslation } from "@/i18n/useTranslation";
import { AUTHOR } from "@/lib/site";

export function SiteFooter() {
  const { t } = useTranslation();

  return (
    <footer className="site-footer">
      <div className="page">
        <p>
          {t("footer.madeBy")} <strong>{AUTHOR.name}</strong> ·{" "}
          <a href={AUTHOR.githubUrl} rel="noopener noreferrer" target="_blank">
            {t("footer.github")}
          </a>{" "}
          ·{" "}
          <a href={AUTHOR.portfolioUrl} rel="noopener noreferrer" target="_blank">
            {t("footer.portfolio")}
          </a>
        </p>
        <p>
          {t("footer.disclaimer")} <Link href="/about">{t("footer.readMore")}</Link>
        </p>
      </div>
    </footer>
  );
}
