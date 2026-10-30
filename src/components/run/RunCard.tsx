"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  getGameCatalog,
  getGameConstraints,
  HOUSE_RULES,
  type ChallengeRun,
  type GameCatalog,
} from "@/engine";
import { useTranslation } from "@/i18n/useTranslation";
import type { MessageKey } from "@/i18n/translate";
import { ConstraintIcon } from "./ConstraintIcon";

function nameOf(entries: GameCatalog[keyof GameCatalog], id: string): string {
  return entries.find((entry) => entry.id === id)?.name ?? id;
}

function bossCount(run: ChallengeRun, catalog: GameCatalog): number {
  return catalog.bosses.filter((boss) => {
    if (boss.dlc && !run.includeDlc) return false;
    return run.objective === "all-bosses" || boss.required;
  }).length;
}

/**
 * Parameter keys name what their value is, so ids can be resolved to display
 * names; anything else (e.g. a number) is shown as is.
 */
function formatParam(
  key: string,
  value: string | number,
  catalog: GameCatalog,
  t: ReturnType<typeof useTranslation>["t"],
): string {
  const id = String(value);
  switch (key) {
    case "weapon":
      return nameOf(catalog.weapons, id);
    case "armorSet":
      return nameOf(catalog.armorSets, id);
    case "weaponCategory":
      return t(`weaponCategories.${id}` as MessageKey);
    case "region":
      return t(`regions.${id}` as MessageKey);
    case "upgradeCap":
      return `+${id}`;
    default:
      return id;
  }
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="font-sans text-sm text-stone-400">{label}</dt>
      <dd className="mt-1 text-lg text-bone">{children}</dd>
    </div>
  );
}

export function RunCard({
  run,
  footer,
  animate = false,
}: {
  run: ChallengeRun;
  /** Rendered under the seed, e.g. the copy button. */
  footer?: ReactNode;
  animate?: boolean;
}) {
  const { t } = useTranslation();
  const catalog = getGameCatalog(run.gameId);
  const categoryOf = new Map(
    getGameConstraints(run.gameId).map((c) => [c.id, c.category]),
  );
  const params = run.constraints.flatMap(({ params }) => Object.entries(params ?? {}));

  return (
    <article
      className={`relative overflow-hidden rounded-md border border-stone-600 bg-stone-900/90 shadow-[0_30px_80px_-40px_var(--color-ember)] ${
        animate ? "run-reveal" : ""
      }`}
      aria-labelledby={`run-${run.seed}`}
    >
      <div className="h-1 bg-gradient-to-r from-transparent via-ember to-transparent" />

      <div className="p-6 sm:p-10">
        <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 font-sans text-base">
          <span className="text-parchment">{t(`games.${run.gameId}`)}</span>
          <span className="text-ember-glow">
            <span className="sr-only">{t("run.difficulty")}: </span>
            {t(`difficulties.${run.difficulty}.name`)}
          </span>
        </header>

        <div className="mt-8">
          <p className="font-sans text-sm text-stone-400">{t("run.startingClass")}</p>
          <h2
            id={`run-${run.seed}`}
            className="mt-1 font-display text-title font-medium text-bone"
          >
            {nameOf(catalog.classes, run.startingClass)}
          </h2>
        </div>

        {params.length > 0 && (
          <dl className="mt-8 grid gap-6 sm:grid-cols-2">
            {params.map(([key, value]) => (
              <Field key={key} label={t(`run.params.${key}` as MessageKey)}>
                {formatParam(key, value, catalog, t)}
              </Field>
            ))}
          </dl>
        )}

        <section className="mt-10" aria-labelledby={`rules-${run.seed}`}>
          <h3 id={`rules-${run.seed}`} className="font-display text-heading text-bone">
            {t("run.rules")}
          </h3>
          <ul className="mt-5 space-y-5">
            {run.constraints.map(({ id }, index) => {
              const category = categoryOf.get(id) ?? "style";
              return (
                <li
                  key={id}
                  className={`flex gap-4 ${animate ? "run-reveal-item" : ""}`}
                  style={{ "--reveal-index": index } as CSSProperties}
                >
                  <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full border border-stone-600 text-ember">
                    <ConstraintIcon category={category} className="size-5" />
                  </span>
                  <div>
                    <p className="font-sans text-lg font-medium text-bone">
                      {t(`constraints.${id}.name` as MessageKey)}
                    </p>
                    <p className="text-parchment">
                      {t(`constraints.${id}.description` as MessageKey)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="mt-10">
          <h3 className="font-display text-heading text-bone">{t("run.objective")}</h3>
          <p className="mt-3 font-sans text-lg font-medium text-bone">
            {t(`objectives.${run.objective}.name`)}
          </p>
          <p className="text-parchment">
            {t(`objectives.${run.objective}.description`, {
              count: bossCount(run, catalog),
            })}
          </p>
        </section>

        <section className="mt-10" aria-labelledby={`house-${run.seed}`}>
          <h3 id={`house-${run.seed}`} className="font-display text-heading text-bone">
            {t("run.houseRules")}
          </h3>
          <dl className="mt-4 grid gap-x-6 gap-y-2 font-sans sm:grid-cols-3">
            {HOUSE_RULES.map((rule) => (
              <div key={rule} className="flex justify-between gap-3 sm:block">
                <dt className="text-stone-400">{t(`houseRules.${rule}.name`)}</dt>
                <dd
                  className={
                    run.houseRules[rule] ? "text-bone" : "font-medium text-ember-glow"
                  }
                >
                  {t(run.houseRules[rule] ? "run.allowed" : "run.forbidden")}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <footer className="mt-10 flex flex-wrap items-end justify-between gap-4 border-t border-stone-800 pt-6">
          <div>
            <p className="font-sans text-sm text-stone-400">{t("run.seed")}</p>
            <p className="mt-1 font-sans text-xl tracking-wide break-all text-ember-glow select-all">
              {run.seed}
            </p>
          </div>
          {footer}
        </footer>
      </div>
    </article>
  );
}
