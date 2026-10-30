"use client";

import type { CSSProperties } from "react";
import {
  DIFFICULTIES,
  getGameCatalog,
  getGameConstraints,
  HOUSE_RULES,
  type ChallengeRun,
  type ConstraintParams,
  type GameCatalog,
  type GameId,
} from "@/engine";
import { Icon } from "@/components/icons/Icon";
import { useTranslation } from "@/i18n/useTranslation";
import type { MessageKey } from "@/i18n/translate";
import { WIKI_NAMES, WIKI_SOURCES, wikiUrl } from "@/lib/wiki";
import { ConstraintIcon } from "./ConstraintIcon";

type Translate = ReturnType<typeof useTranslation>["t"];
type ParamValue = ConstraintParams[string];

const NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

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
function formatParam(key: string, value: string | number, catalog: GameCatalog, t: Translate) {
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
    case "stat":
      return t(`attributes.${id}` as MessageKey);
    case "school":
      return t(`spellSchools.${id}` as MessageKey);
    case "scope":
      return t(`oneShotScopes.${id}` as MessageKey);
    case "upgradeCap":
      return `+${id}`;
    default:
      return id;
  }
}

/** Links to read about a game item on the community wikis. */
function WikiLinks({ gameId, name }: { gameId: GameId; name: string }) {
  const { t } = useTranslation();
  return (
    <span className="wiki">
      {WIKI_SOURCES.map((source, index) => (
        <span key={source} className="contents">
          {index > 0 && <span aria-hidden="true">·</span>}
          <a
            href={wikiUrl(gameId, source, name)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("run.wikiLink", { name, wiki: WIKI_NAMES[source] })}
          >
            {WIKI_NAMES[source]}
          </a>
        </span>
      ))}
    </span>
  );
}

function DifficultyBadge({ run }: { run: ChallengeRun }) {
  const { t } = useTranslation();
  const level = DIFFICULTIES.indexOf(run.difficulty) + 1;
  return (
    <span className="diff-badge">
      <span className="pips" aria-hidden="true">
        {DIFFICULTIES.map((difficulty, index) => (
          <span key={difficulty} className={index < level ? "pip on" : "pip"} />
        ))}
      </span>
      <span>
        <span className="sr-only">{t("run.difficulty")}: </span>
        {t(`difficulties.${run.difficulty}.name`)}
      </span>
    </span>
  );
}

function Corners() {
  return (
    <>
      {["tl", "tr", "bl", "br"].map((corner) => (
        <span key={corner} className={`corner ${corner}`} aria-hidden="true" />
      ))}
    </>
  );
}

export function RunCard({
  run,
  animate = false,
  compact = false,
}: {
  run: ChallengeRun;
  animate?: boolean;
  /** A smaller card with only the class, rules, objective and seed. */
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const catalog = getGameCatalog(run.gameId);
  const categoryOf = new Map(getGameConstraints(run.gameId).map((c) => [c.id, c.category]));
  const params = run.constraints.flatMap(({ params }) =>
    Object.entries(params ?? {}),
  ) as [string, ParamValue][];
  const scalars = params.filter(
    (entry): entry is [string, string | number] => typeof entry[1] !== "object",
  );
  const roulette = params.find(([, value]) => typeof value === "object")?.[1] as
    | readonly string[]
    | undefined;
  const objectiveDescription = t(`objectives.${run.objective}.description`, {
    count: bossCount(run, catalog),
  });

  // Reveal order follows the reading order of the card.
  let step = 0;
  const reveal = (className: string) => ({
    className: animate ? `${className} reveal` : className,
    style: { "--i": step++ } as CSSProperties,
  });
  const headingId = (name: string) => `${name}-${run.seed}`;

  const rules = (
    <ul className="rules">
      {run.constraints.map(({ id }) => {
        const category = categoryOf.get(id) ?? "style";
        return (
          <li key={id} {...reveal("rule")}>
            <span className="rule-icon" aria-hidden="true">
              <ConstraintIcon category={category} />
            </span>
            <div className="rule-body">
              <div className="rule-cat">{t(`categories.${category}.name`)}</div>
              <p className="rule-name">{t(`constraints.${id}.name` as MessageKey)}</p>
              <p className="rule-desc">{t(`constraints.${id}.description` as MessageKey)}</p>
            </div>
          </li>
        );
      })}
      {compact && (
        <li {...reveal("rule")}>
          <span className="rule-icon" aria-hidden="true">
            <Icon name="objective" size={24} />
          </span>
          <div className="rule-body">
            <div className="rule-cat">{t("run.objective")}</div>
            <p className="rule-name">{t(`objectives.${run.objective}.name`)}</p>
            <p className="rule-desc">{objectiveDescription}</p>
          </div>
        </li>
      )}
    </ul>
  );

  return (
    <article
      className={compact ? "run-card mini" : "run-card"}
      aria-labelledby={headingId("class")}
    >
      <Corners />
      <div className="run-card-inner">
        <div className="card-top">
          <span className="game-tag">{t(`games.${run.gameId}`)}</span>
          <DifficultyBadge run={run} />
        </div>

        <div className="class-hero">
          <p className="eyebrow">{t("run.startingClass")}</p>
          <h2 id={headingId("class")} className="display">
            {nameOf(catalog.classes, run.startingClass)}
          </h2>
        </div>

        {compact ? (
          rules
        ) : (
          <>
            <div className="divider" aria-hidden="true">
              <Icon name="diamond" size={14} />
            </div>

            {scalars.length > 0 && (
              <section {...reveal("card-section")} aria-label={t("run.drawn")}>
                <dl className="params">
                  {scalars.map(([key, value]) => {
                    const display = formatParam(key, value, catalog, t);
                    const isItem = key === "weapon" || key === "armorSet";
                    return (
                      <div key={key} className="param">
                        <dt>{t(`run.params.${key}` as MessageKey)}</dt>
                        <dd>
                          {display}
                          {isItem && <WikiLinks gameId={run.gameId} name={display} />}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </section>
            )}

            {roulette && (
              <section {...reveal("card-section")} aria-labelledby={headingId("roulette")}>
                <h3 id={headingId("roulette")} className="h-section">
                  {t("run.params.weapons")}
                </h3>
                <ol className="roulette">
                  {roulette.map((id, index) => {
                    const name = nameOf(catalog.weapons, id);
                    return (
                      <li key={id}>
                        <span className="n" aria-hidden="true">
                          {NUMERALS[index]}
                        </span>
                        <span className="w">{name}</span>
                        <WikiLinks gameId={run.gameId} name={name} />
                      </li>
                    );
                  })}
                </ol>
              </section>
            )}

            <section className="card-section" aria-labelledby={headingId("rules")}>
              <h3 id={headingId("rules")} className="h-section">
                {t("run.rules")} <span className="count">{run.constraints.length}</span>
              </h3>
              {rules}
            </section>

            <section {...reveal("card-section")} aria-labelledby={headingId("objective")}>
              <h3 id={headingId("objective")} className="h-section">
                {t("run.objective")}
              </h3>
              <div className="objective">
                <span className="rule-icon" aria-hidden="true">
                  <Icon name="objective" size={24} />
                </span>
                <div className="rule-body">
                  <p className="rule-name">{t(`objectives.${run.objective}.name`)}</p>
                  <p className="rule-desc">{objectiveDescription}</p>
                  {run.includeDlc && <span className="tag">{t("run.includesDlc")}</span>}
                </div>
              </div>
            </section>

            <section {...reveal("card-section")} aria-labelledby={headingId("house")}>
              <h3 id={headingId("house")} className="h-section">
                {t("run.houseRules")}
              </h3>
              <dl className="house">
                {HOUSE_RULES.map((rule) => {
                  const allowed = run.houseRules[rule];
                  return (
                    <div key={rule} className={allowed ? "allowed" : "forbidden"}>
                      <dt>{t(`houseRules.${rule}.name`)}</dt>
                      <dd>
                        <Icon name={allowed ? "check" : "cross"} size={16} />
                        {t(allowed ? "run.allowed" : "run.forbidden")}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </section>
          </>
        )}

        <footer className="seed-foot">
          <div className="min-w-0">
            <p className="eyebrow">{t("run.seed")}</p>
            <code className="seed-value" tabIndex={compact ? undefined : 0}>
              {run.seed}
            </code>
          </div>
          {!compact && (
            <span className="seed-meta">
              {t("run.seedMeta", { version: run.rulesetVersion })}
            </span>
          )}
        </footer>
      </div>
    </article>
  );
}
