"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import {
  CONSTRAINT_CATEGORIES,
  createLuckySeed,
  createSeed,
  DEFAULT_PREFERENCES,
  DIFFICULTIES,
  getGameCatalog,
  HOUSE_RULES,
  isObjectiveAllowed,
  OBJECTIVES,
  type Objective,
  type Preferences,
} from "@/engine";
import { Icon } from "@/components/icons/Icon";
import { ConstraintIcon } from "@/components/run/ConstraintIcon";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/i18n/useTranslation";
import { randomSeedKey } from "@/lib/random";
import { runPath } from "@/lib/run-link";
import { preferencesItem } from "@/lib/storage/items";
import { setItemValue, useStorageItem } from "@/lib/storage/store";

const UPCOMING_GAMES = ["ds2", "ds3", "bb", "er", "sote"] as const;

function bossCount(objective: Objective, includeDlc: boolean): number {
  return getGameCatalog("dsr").bosses.filter((boss) => {
    if (boss.dlc && !includeDlc) return false;
    return objective === "all-bosses" || boss.required;
  }).length;
}

function Fieldset({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="fieldset">
      <legend className="legend">{legend}</legend>
      {children}
    </fieldset>
  );
}

export function PlayForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const [customizing, setCustomizing] = useState(false);
  const preferences = useStorageItem(preferencesItem) ?? DEFAULT_PREFERENCES;
  const activeCategories = Object.values(preferences.categories).filter(Boolean).length;
  const allowedHouseRules = Object.values(preferences.houseRules).filter(Boolean).length;
  const noCategory = activeCategories === 0;

  // Saved on every change so the form comes back as the player left it.
  function update(patch: Partial<Preferences>) {
    setItemValue(preferencesItem, { ...preferences, ...patch });
  }

  function setHouseRules(houseRules: Preferences["houseRules"]) {
    // Forbidding what the objective needs falls back to the default one.
    const objective = isObjectiveAllowed(preferences.objective, houseRules)
      ? preferences.objective
      : "main-bosses";
    update({ houseRules, objective });
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
        <div className="opt-grid g3 games">
          <label className="card-option">
            <input type="radio" name="game" value="dsr" defaultChecked className="sr-only" />
            <span className="co-mark" aria-hidden="true" />
            <span className="co-title">{t("games.dsr")}</span>
            <span className="co-desc">{t("play.dsrScope")}</span>
          </label>
          {UPCOMING_GAMES.map((game) => (
            <label key={game} className="card-option">
              <input type="radio" name="game" value={game} disabled className="sr-only" />
              <span className="co-title">{t(`games.${game}`)}</span>
              <span className="soon">{t("common.comingSoon")}</span>
            </label>
          ))}
        </div>
      </Fieldset>

      <Fieldset legend={t("play.difficultyLegend")}>
        <div className="opt-grid g4">
          {DIFFICULTIES.map((difficulty, index) => (
            <label key={difficulty} className="card-option">
              <input
                type="radio"
                name="difficulty"
                value={difficulty}
                checked={preferences.difficulty === difficulty}
                onChange={() => update({ difficulty })}
                className="sr-only"
              />
              <span className="co-mark" aria-hidden="true" />
              <span className="pips" aria-hidden="true">
                {DIFFICULTIES.map((pip, pipIndex) => (
                  <span key={pip} className={pipIndex <= index ? "pip on" : "pip"} />
                ))}
              </span>
              <span className="co-title">{t(`difficulties.${difficulty}.name`)}</span>
              <span className="co-desc">{t(`difficulties.${difficulty}.description`)}</span>
            </label>
          ))}
        </div>
      </Fieldset>

      <Fieldset legend={t("play.objectiveLegend")}>
        <div className="opt-grid g3">
          {OBJECTIVES.map((objective) => {
            const allowed = isObjectiveAllowed(objective, preferences.houseRules);
            return (
              <label key={objective} className="card-option">
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
                {allowed ? (
                  <span className="co-mark" aria-hidden="true" />
                ) : (
                  <span className="co-lock" aria-hidden="true">
                    <Icon name="lock" size={18} />
                  </span>
                )}
                <span className="co-title">{t(`objectives.${objective}.name`)}</span>
                <span className="co-desc">
                  {t(`objectives.${objective}.description`, {
                    count: bossCount(objective, preferences.includeDlc),
                  })}
                </span>
              </label>
            );
          })}
        </div>
        {OBJECTIVES.filter((o) => !isObjectiveAllowed(o, preferences.houseRules)).map(
          (objective) => (
            <p key={objective} id={`${objective}-locked`} className="opt-hint">
              <Icon name="lock" size={16} />
              <span>
                {t("play.needsGlitches")}{" "}
                <button
                  type="button"
                  className="link-button"
                  onClick={() => setHouseRules({ ...preferences.houseRules, glitches: true })}
                >
                  {t("play.allowGlitches")}
                </button>
              </span>
            </p>
          ),
        )}
        <label className="check mt-3.5">
          <input
            type="checkbox"
            className="cbx"
            checked={preferences.includeDlc}
            onChange={(event) => update({ includeDlc: event.target.checked })}
          />
          <span>
            <span className="cl">{t("play.includeDlc")}</span>
            <span className="cd">{t("play.includeDlcHint")}</span>
          </span>
        </label>
      </Fieldset>

      <section className="disclosure">
        <button
          type="button"
          className="disclosure-btn"
          aria-expanded={customizing}
          aria-controls="customize-panel"
          onClick={() => setCustomizing(!customizing)}
        >
          <span>
            <span className="dt">{t("play.customizeTitle")}</span>
            <span className="ds">
              {t("play.customizeSummary", {
                count: activeCategories,
                total: CONSTRAINT_CATEGORIES.length,
              })}{" "}
              ·{" "}
              {t("play.houseSummary", {
                count: allowedHouseRules,
                total: HOUSE_RULES.length,
              })}
            </span>
          </span>
          <Icon name="chevron" className="chev" />
        </button>
        <div id="customize-panel" className="disclosure-panel" hidden={!customizing}>
          <fieldset>
            <legend className="sub-legend">{t("play.houseRulesLegend")}</legend>
            <p className="hint mb-3">{t("play.houseRulesHint")}</p>
            <div className="flex flex-col gap-2">
              {HOUSE_RULES.map((rule) => (
                <label key={rule} className="switch-row">
                  <span>
                    <span className="cl">{t(`houseRules.${rule}.name`)}</span>
                    <span className="cd">{t(`houseRules.${rule}.description`)}</span>
                  </span>
                  <input
                    type="checkbox"
                    role="switch"
                    className="switch"
                    checked={preferences.houseRules[rule]}
                    onChange={(event) =>
                      setHouseRules({ ...preferences.houseRules, [rule]: event.target.checked })
                    }
                  />
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-3">
            <legend className="sub-legend">{t("play.categoriesLegend")}</legend>
            <p className="hint mb-1">{t("play.categoriesHint")}</p>
            <div className="cat-grid">
              {CONSTRAINT_CATEGORIES.map((category) => (
                <label key={category} className="cat-item">
                  <input
                    type="checkbox"
                    className="cbx"
                    checked={preferences.categories[category]}
                    onChange={(event) =>
                      update({
                        categories: {
                          ...preferences.categories,
                          [category]: event.target.checked,
                        },
                      })
                    }
                    aria-describedby={noCategory ? "categories-error" : undefined}
                  />
                  <span className="ci" aria-hidden="true">
                    <ConstraintIcon category={category} />
                  </span>
                  <span className="cbody">
                    <span className="cl">{t(`categories.${category}.name`)}</span>
                    <span className="cd">{t(`categories.${category}.description`)}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </section>

      {noCategory && (
        <p id="categories-error" role="alert" className="opt-hint bad mb-4">
          <Icon name="alert" size={16} />
          {t("play.categoriesEmpty")}
        </p>
      )}

      <div className="actions-bar">
        <Button type="submit" variant="primary" disabled={noCategory} className="min-w-50">
          <Icon name="flame" />
          {t("play.generate")}
        </Button>
        <div className="lucky">
          <Button onClick={feelLucky} aria-describedby="lucky-hint">
            <Icon name="dice" />
            {t("play.lucky")}
          </Button>
          <p id="lucky-hint" className="hint">
            {t("play.luckyHint")}
          </p>
        </div>
      </div>
    </form>
  );
}
