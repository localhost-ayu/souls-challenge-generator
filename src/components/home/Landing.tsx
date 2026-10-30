"use client";

import { createSeed, generateRun, type Preferences } from "@/engine";
import { Icon, type IconName } from "@/components/icons/Icon";
import { RunCard } from "@/components/run/RunCard";
import { ButtonLink } from "@/components/ui/Button";
import { useTranslation } from "@/i18n/useTranslation";
import { runPath } from "@/lib/run-link";

// Built from preferences rather than a literal seed so it stays valid when
// the ruleset version changes.
const EXAMPLE_PREFERENCES: Preferences = {
  difficulty: "chosen",
  objective: "all-bosses",
  includeDlc: true,
  houseRules: { buffs: true, summons: false, glitches: false },
  categories: {
    level: true,
    equipment: true,
    movement: true,
    combat: true,
    resource: true,
    style: true,
    absurd: false,
  },
};
const exampleRun = generateRun(
  createSeed({ gameId: "dsr", preferences: EXAMPLE_PREFERENCES, key: "praisethesun" }),
);

const STEPS = [
  { key: "step1", numeral: "I", icon: "card" },
  { key: "step2", numeral: "II", icon: "settings" },
  { key: "step3", numeral: "III", icon: "share" },
] as const satisfies readonly { key: string; numeral: string; icon: IconName }[];

/** Original illustration: a sword planted in an ember-lit mound. */
function BonfireArt() {
  return (
    <svg
      width="170"
      height="170"
      viewBox="0 0 64 64"
      fill="none"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M32 6v34" className="stroke-bone" />
      <path d="M30 8.5 32 6l2 2.5V38" className="stroke-parchment" />
      <path d="M25 15h14" className="stroke-bone" />
      <path d="M32 15v-5" className="stroke-bone" />
      <path d="M32 40c-3-4-1-7 0-9 1 2 3 5 0 9z" className="stroke-ember-glow" />
      <path d="M28 41c-2-3-1-5 0-6.5M36 41c2-3 1-5 0-6.5" className="stroke-ember" />
      <path d="M12 54c5-8 12-12 20-12s15 4 20 12" className="stroke-stone-400" />
      <path d="M18 54c3-4 8-7 14-7s11 3 14 7" className="stroke-stone-500" />
      <path d="M8 54h48" className="stroke-stone-500" />
    </svg>
  );
}

export function Landing() {
  const { t } = useTranslation();

  return (
    <div className="page">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-text">
          <p className="eyebrow">{t("home.eyebrow")}</p>
          <h1 id="hero-title" className="hero-title">
            Souls Challenge<span>Generator</span>
          </h1>
          <p className="lead">{t("home.lead")}</p>
          <div className="cta-row">
            <ButtonLink href="/play" variant="primary">
              <Icon name="flame" />
              {t("home.cta")}
            </ButtonLink>
            <a href="#how-it-works" className="btn btn-ghost">
              {t("home.howTitle")}
            </a>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="halo">
            <BonfireArt />
          </div>
        </div>
      </section>

      <section id="how-it-works" aria-labelledby="how-title" className="pt-6 pb-18">
        <h2 id="how-title" className="h-section text-base">
          {t("home.howTitle")}
        </h2>
        <ol className="steps">
          {STEPS.map((step) => (
            <li key={step.key} className="step">
              <span className="step-icon" aria-hidden="true">
                <Icon name={step.icon} size={24} />
              </span>
              <div className="step-num" aria-hidden="true">
                {step.numeral}
              </div>
              <h3>{t(`home.${step.key}Title`)}</h3>
              <p>{t(`home.${step.key}`)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="example" aria-labelledby="example-title">
        <div className="example-text">
          <p className="eyebrow">{t("home.exampleEyebrow")}</p>
          <h2 id="example-title" className="display text-2xl">
            {t("home.exampleTitle")}
          </h2>
          <p className="text-parchment">{t("home.exampleBody")}</p>
          <ButtonLink href={runPath(exampleRun.seed)}>
            {t("home.exampleOpen")}
            <Icon name="arrow" size={18} />
          </ButtonLink>
        </div>
        <RunCard run={exampleRun} compact />
      </section>
    </div>
  );
}
