"use client";

import { Icon } from "@/components/icons/Icon";
import { useTranslation } from "@/i18n/useTranslation";
import { AUTHOR, REPOSITORY_URL } from "@/lib/site";

export function AboutContent() {
  const { t } = useTranslation();

  return (
    <div className="page max-w-article pt-14">
      <article className="prose">
        <p className="eyebrow">{t("about.eyebrow")}</p>
        <h1 className="display page-title mt-2.5 mb-6">{t("about.title")}</h1>
        <p className="intro">{t("about.intro")}</p>

        <div className="divider mt-10" aria-hidden="true">
          <Icon name="diamond" size={14} />
        </div>

        <h2>{t("about.coherenceTitle")}</h2>
        <p>{t("about.coherence")}</p>

        <h2>{t("about.dataTitle")}</h2>
        <p>{t("about.data")}</p>

        <section className="legal" aria-labelledby="legal-title">
          <h2 id="legal-title">
            <Icon name="shield" size={24} className="text-ember-glow" />
            {t("about.disclaimerTitle")}
          </h2>
          <p>{t("about.disclaimer")}</p>
        </section>

        <h2>{t("about.creditsTitle")}</h2>
        <div className="credit">
          <div className="who">
            <span className="eyebrow mb-1 block">{t("about.credits")}</span>
            {AUTHOR.name}
          </div>
          <div className="links">
            <a
              href={AUTHOR.githubUrl}
              className="btn btn-sm"
              rel="noopener noreferrer"
              target="_blank"
            >
              <Icon name="code" size={18} />
              {t("footer.github")}
            </a>
            <a
              href={AUTHOR.portfolioUrl}
              className="btn btn-sm"
              rel="noopener noreferrer"
              target="_blank"
            >
              <Icon name="globe" size={18} />
              {t("footer.portfolio")}
            </a>
          </div>
        </div>

        <h2>{t("about.licenseTitle")}</h2>
        <p>{t("about.license")}</p>
        <a
          href={REPOSITORY_URL}
          className="btn mt-2"
          rel="noopener noreferrer"
          target="_blank"
        >
          {t("about.sourceCode")}
          <Icon name="external" size={18} />
        </a>
      </article>
    </div>
  );
}
