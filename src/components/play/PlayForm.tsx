"use client";

import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import {
  CONSTRAINT_CATEGORIES,
  createLuckySeed,
  createSeed,
  DEFAULT_PREFERENCES,
  DIFFICULTIES,
  HOUSE_RULES,
  isObjectiveAllowed,
  OBJECTIVES,
  type Preferences,
} from "@/engine";
import { useTranslation } from "@/i18n/useTranslation";
import { randomSeedKey } from "@/lib/random";
import { runPath } from "@/lib/run-link";
import { preferencesItem } from "@/lib/storage/items";
import { setItemValue, useStorageItem } from "@/lib/storage/store";
import { Button } from "@/components/ui/Button";

const UPCOMING_GAMES = ["ds2", "ds3", "bb", "er", "sote"] as const;

// Native inputs stay in the DOM (visually hidden) so keyboard and screen
// reader behaviour comes for free; the label carries the visual state.
const optionClass =
  "relative block cursor-pointer rounded-sm border border-stone-600 bg-stone-900/70 p-4 transition-colors duration-200 hover:border-stone-400 has-checked:border-ember has-checked:bg-stone-800 has-disabled:cursor-not-allowed has-disabled:border-dashed has-disabled:opacity-60 has-focus-visible:outline-2 has-focus-visible:outline-offset-3 has-focus-visible:outline-ember-glow";

function Fieldset({
  legend,
  hint,
  children,
}: {
  legend: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="mt-12">
      <legend className="font-display text-heading text-bone">{legend}</legend>
      {hint && <p className="mt-2 font-sans text-base text-stone-400">{hint}</p>}
      <div className="mt-5">{children}</div>
    </fieldset>
  );
}

export function PlayForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const preferences = useStorageItem(preferencesItem) ?? DEFAULT_PREFERENCES;
  const noCategory = !Object.values(preferences.categories).some(Boolean);

  // Saved on every change so the form comes back as the player left it.
  function update(patch: Partial<Preferences>) {
    setItemValue(preferencesItem, { ...preferences, ...patch });
  }

  function generate(event: FormEvent) {
    event.preventDefault();
    if (noCategory) return;
    router.push(runPath(createSeed({ gameId: "dsr", preferences, key: randomSeedKey() })));
  }

  function feelLucky() {
    router.push(runPath(createLuckySeed({ gameId: "dsr", key: randomSeedKey() })));
  }

  return (
    <form onSubmit={generate} noValidate>
      <Fieldset legend={t("play.gameLegend")}>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className={optionClass}>
            <input type="radio" name="game" value="dsr" defaultChecked className="sr-only" />
            <span className="font-sans text-lg font-medium text-bone">{t("games.dsr")}</span>
          </label>
          {UPCOMING_GAMES.map((game) => (
            <label
              key={game}
              className="block rounded-sm border border-dashed border-stone-800 p-4 text-stone-400"
            >
              <input type="radio" name="game" value={game} disabled className="sr-only" />
              <span className="font-sans text-lg">{t(`games.${game}`)}</span>
              <span className="mt-1 block font-sans text-sm">{t("common.comingSoon")}</span>
            </label>
          ))}
        </div>
      </Fieldset>

      <Fieldset legend={t("play.difficultyLegend")}>
        <div className="grid gap-3 sm:grid-cols-2">
          {DIFFICULTIES.map((difficulty) => (
            <label key={difficulty} className={optionClass}>
              <input
                type="radio"
                name="difficulty"
                value={difficulty}
                checked={preferences.difficulty === difficulty}
                onChange={() => update({ difficulty })}
                className="sr-only"
              />
              <span className="font-sans text-lg font-medium text-bone">
                {t(`difficulties.${difficulty}.name`)}
              </span>
              <span className="mt-1 block text-base text-parchment">
                {t(`difficulties.${difficulty}.description`)}
              </span>
            </label>
          ))}
        </div>
      </Fieldset>

      <Fieldset legend={t("play.objectiveLegend")}>
        <div className="grid gap-3 sm:grid-cols-3">
          {OBJECTIVES.map((objective) => {
            const allowed = isObjectiveAllowed(objective, preferences.houseRules);
            return (
              <label key={objective} className={optionClass}>
                <input
                  type="radio"
                  name="objective"
                  value={objective}
                  checked={preferences.objective === objective}
                  disabled={!allowed}
                  onChange={() => update({ objective })}
                  aria-describedby={allowed ? undefined : `${objective}-locked`}
                  className="sr-only"
                />
                <span className="font-sans text-lg font-medium text-bone">
                  {t(`objectives.${objective}.name`)}
                </span>
                {!allowed && (
                  <span
                    id={`${objective}-locked`}
                    className="mt-1 block font-sans text-sm text-stone-400"
                  >
                    {t("play.needsGlitches")}
                  </span>
                )}
              </label>
            );
          })}
        </div>
        <label className="mt-5 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={preferences.includeDlc}
            onChange={(event) => update({ includeDlc: event.target.checked })}
            className="mt-1.5 size-5 accent-ember"
          />
          <span>
            <span className="block font-sans text-lg text-bone">{t("play.includeDlc")}</span>
            <span className="block font-sans text-base text-stone-400">
              {t("play.includeDlcHint")}
            </span>
          </span>
        </label>
      </Fieldset>

      <Fieldset legend={t("play.houseRulesLegend")} hint={t("play.houseRulesHint")}>
        <div className="grid gap-3 sm:grid-cols-3">
          {HOUSE_RULES.map((rule) => (
            <label key={rule} className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={preferences.houseRules[rule]}
                onChange={(event) => {
                  const houseRules = { ...preferences.houseRules, [rule]: event.target.checked };
                  // Forbidding what the objective needs falls back to the default one.
                  const objective = isObjectiveAllowed(preferences.objective, houseRules)
                    ? preferences.objective
                    : "main-bosses";
                  update({ houseRules, objective });
                }}
                className="mt-1.5 size-5 accent-ember"
              />
              <span>
                <span className="block font-sans text-lg text-bone">
                  {t(`houseRules.${rule}.name`)}
                </span>
                <span className="block font-sans text-base text-stone-400">
                  {t(`houseRules.${rule}.description`)}
                </span>
              </span>
            </label>
          ))}
        </div>
      </Fieldset>

      <Fieldset legend={t("play.categoriesLegend")} hint={t("play.categoriesHint")}>
        <div className="grid gap-3 sm:grid-cols-2">
          {CONSTRAINT_CATEGORIES.map((category) => (
            <label key={category} className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={preferences.categories[category]}
                onChange={(event) =>
                  update({
                    categories: { ...preferences.categories, [category]: event.target.checked },
                  })
                }
                aria-describedby={noCategory ? "categories-error" : undefined}
                className="mt-1.5 size-5 accent-ember"
              />
              <span>
                <span className="block font-sans text-lg text-bone">
                  {t(`categories.${category}.name`)}
                </span>
                <span className="block font-sans text-base text-stone-400">
                  {t(`categories.${category}.description`)}
                </span>
              </span>
            </label>
          ))}
        </div>
        {noCategory && (
          <p id="categories-error" role="alert" className="mt-4 font-sans text-base text-ember-glow">
            {t("play.categoriesEmpty")}
          </p>
        )}
      </Fieldset>

      <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-4">
        <Button type="submit" variant="primary" disabled={noCategory}>
          {t("play.generate")}
        </Button>
        <div>
          <Button onClick={feelLucky} aria-describedby="lucky-hint">
            {t("play.lucky")}
          </Button>
          <p id="lucky-hint" className="mt-2 font-sans text-sm text-stone-400">
            {t("play.luckyHint")}
          </p>
        </div>
      </div>
    </form>
  );
}
