"use client";

import type { ReactNode } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { AUTHOR, REPOSITORY_URL } from "@/lib/site";

const linkClass =
  "underline decoration-stone-600 underline-offset-4 transition-colors duration-200 hover:text-bone hover:decoration-ember";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-14">
      <h2 className="font-display text-heading font-medium text-bone">{title}</h2>
      <div className="mt-4 space-y-4 text-parchment">{children}</div>
    </section>
  );
}

export function AboutContent() {
  const { t } = useTranslation();

  return (
    <article className="mx-auto max-w-prose px-5 pt-12 pb-16 sm:px-0 sm:pt-20">
      <h1 className="font-display text-title font-medium text-bone">{t("about.title")}</h1>
      <p className="mt-8 text-lead text-parchment">{t("about.intro")}</p>

      <Section title={t("about.coherenceTitle")}>
        <p>{t("about.coherence")}</p>
      </Section>

      <Section title={t("about.dataTitle")}>
        <p>{t("about.data")}</p>
      </Section>

      <Section title={t("about.disclaimerTitle")}>
        <p className="border-l-2 border-ember pl-5">{t("about.disclaimer")}</p>
      </Section>

      <Section title={t("about.creditsTitle")}>
        <p>
          {t("about.credits")} <strong className="font-semibold text-bone">{AUTHOR.name}</strong>
        </p>
        <ul className="flex gap-6 font-sans text-base">
          <li>
            <a href={AUTHOR.githubUrl} className={linkClass} rel="noopener noreferrer" target="_blank">
              {t("footer.github")}
            </a>
          </li>
          <li>
            <a href={AUTHOR.portfolioUrl} className={linkClass} rel="noopener noreferrer" target="_blank">
              {t("footer.portfolio")}
            </a>
          </li>
        </ul>
      </Section>

      <Section title={t("about.licenseTitle")}>
        <p>{t("about.license")}</p>
        <p className="font-sans text-base">
          <a href={REPOSITORY_URL} className={linkClass} rel="noopener noreferrer" target="_blank">
            {t("about.sourceCode")}
          </a>
        </p>
      </Section>
    </article>
  );
}
