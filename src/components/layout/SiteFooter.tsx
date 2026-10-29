"use client";

import Link from "next/link";
import { useTranslation } from "@/i18n/useTranslation";
import { AUTHOR } from "@/lib/site";

const linkClass =
  "underline decoration-stone-600 underline-offset-4 transition-colors duration-200 hover:text-bone hover:decoration-ember";

export function SiteFooter() {
  const { t } = useTranslation();

  return (
    <footer className="mx-auto w-full max-w-page px-5 pt-16 pb-10 sm:px-8">
      <div className="flex flex-col gap-4 border-t border-stone-800 pt-8 font-sans text-base text-stone-400 sm:flex-row sm:items-start sm:justify-between">
        <p className="text-parchment">
          {t("footer.madeBy")}{" "}
          <strong className="font-medium text-bone">{AUTHOR.name}</strong>
          <span className="mt-1 flex gap-4">
            <a href={AUTHOR.githubUrl} className={linkClass} rel="noopener noreferrer" target="_blank">
              {t("footer.github")}
            </a>
            <a href={AUTHOR.portfolioUrl} className={linkClass} rel="noopener noreferrer" target="_blank">
              {t("footer.portfolio")}
            </a>
          </span>
        </p>
        <p className="max-w-md sm:text-right">
          {t("footer.disclaimer")}{" "}
          <Link href="/about" className={linkClass}>
            {t("footer.readMore")}
          </Link>
        </p>
      </div>
    </footer>
  );
}
