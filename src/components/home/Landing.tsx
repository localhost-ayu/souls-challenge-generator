"use client";

import Link from "next/link";
import { createSeed, generateRun, type Preferences } from "@/engine";
import { useTranslation } from "@/i18n/useTranslation";
import { runPath } from "@/lib/run-link";
import { ButtonLink } from "@/components/ui/Button";
import { RunCard } from "@/components/run/RunCard";

// Built from preferences rather than a literal seed so it stays valid when
// the ruleset version changes.
const EXAMPLE_PREFERENCES: Preferences = {
  difficulty: "chosen",
  objective: "all-bosses",
  includeDlc: true,
  categories: {
    level: true,
    equipment: true,
    movement: true,
    resource: true,
    style: true,
  },
};
const exampleRun = generateRun(
  createSeed({ gameId: "dsr", preferences: EXAMPLE_PREFERENCES, key: "praisethesun" }),
);

const STEPS = ["step1", "step2", "step3"] as const;

export function Landing() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-page px-5 sm:px-8">
      <section className="grid items-start gap-14 pt-12 pb-20 sm:pt-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:gap-20">
        <div className="lg:pt-10">
          <h1 className="font-display text-display font-medium text-bone">{t("home.title")}</h1>
          <p className="mt-8 max-w-prose text-lead text-parchment">{t("home.lead")}</p>
          <ButtonLink href="/play" variant="primary" className="mt-10">
            {t("home.cta")}
          </ButtonLink>
        </div>

        <div>
          <h2 className="sr-only">{t("home.exampleTitle")}</h2>
          <RunCard run={exampleRun} />
          <Link
            href={runPath(exampleRun.seed)}
            className="mt-4 inline-block font-sans text-base text-parchment underline decoration-stone-600 underline-offset-4 transition-colors duration-200 hover:text-bone hover:decoration-ember"
          >
            {t("home.exampleOpen")}
          </Link>
        </div>
      </section>

      <section className="border-t border-stone-800 py-16" aria-labelledby="how-it-works">
        <h2 id="how-it-works" className="font-display text-title font-medium text-bone">
          {t("home.howTitle")}
        </h2>
        <ol className="mt-10 grid gap-10 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step}>
              <span aria-hidden="true" className="font-display text-title text-ember">
                {index + 1}
              </span>
              <h3 className="mt-2 font-sans text-xl font-medium text-bone">
                {t(`home.${step}Title`)}
              </h3>
              <p className="mt-2 text-parchment">{t(`home.${step}`)}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
