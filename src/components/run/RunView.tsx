"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import {
  generateRun,
  GenerationError,
  InvalidSeedError,
  UnsupportedRulesetError,
  type ChallengeRun,
} from "@/engine";
import { useTranslation } from "@/i18n/useTranslation";
import { historyItem } from "@/lib/storage/items";
import { addToHistory } from "@/lib/storage/saved-runs";
import { getItemValue, setItemValue } from "@/lib/storage/store";
import { RunActions } from "./RunActions";
import { RunCard } from "./RunCard";
import { RunMessage } from "./RunMessage";

export const SEED_EXAMPLE = "dsr-6-chi-praisethesun";

type RunState =
  | { kind: "ready"; run: ChallengeRun }
  | { kind: "missing" }
  | { kind: "invalid" }
  | { kind: "outdated" | "newer"; seedVersion: number; currentVersion: number }
  | { kind: "generation" };

function evaluate(seed: string | null): RunState {
  if (!seed) return { kind: "missing" };
  try {
    return { kind: "ready", run: generateRun(seed) };
  } catch (error) {
    if (error instanceof UnsupportedRulesetError) {
      return {
        kind: error.seedVersion < error.supportedVersion ? "outdated" : "newer",
        seedVersion: error.seedVersion,
        currentVersion: error.supportedVersion,
      };
    }
    if (error instanceof InvalidSeedError) return { kind: "invalid" };
    if (error instanceof GenerationError) return { kind: "generation" };
    throw error;
  }
}

export function RunView() {
  const { t } = useTranslation();
  const seed = useSearchParams().get("seed");
  const state = useMemo(() => evaluate(seed), [seed]);
  const readySeed = state.kind === "ready" ? state.run.seed : null;

  useEffect(() => {
    if (!readySeed) return;
    const history = getItemValue(historyItem);
    setItemValue(historyItem, addToHistory(history, readySeed, Date.now()));
  }, [readySeed]);

  return (
    <div className="page pt-12">
      {state.kind === "ready" && (
        <>
          <div className="mb-8 flex flex-col gap-2">
            <p className="eyebrow">{t(`games.${state.run.gameId}`)}</p>
            <h1 className="display page-title">{t("run.title")}</h1>
          </div>
          <div className="run-layout">
            <RunCard key={state.run.seed} run={state.run} animate />
            <RunActions run={state.run} />
          </div>
        </>
      )}
      <div className="mx-auto max-w-form">
        {state.kind === "missing" && (
          <RunMessage
            icon="embers"
            title={t("run.errors.missingTitle")}
            body={t("run.errors.missing")}
          />
        )}
        {state.kind === "invalid" && (
          <RunMessage
            icon="cracked"
            tone="bad"
            title={t("run.errors.invalidTitle")}
            body={t("run.errors.invalid", { example: SEED_EXAMPLE })}
          />
        )}
        {(state.kind === "outdated" || state.kind === "newer") && (
          <RunMessage
            icon="hourglass"
            tone="warn"
            title={t(`run.errors.${state.kind}Title`)}
            body={t(`run.errors.${state.kind}`, {
              seedVersion: state.seedVersion,
              currentVersion: state.currentVersion,
            })}
          />
        )}
        {state.kind === "generation" && (
          <RunMessage
            icon="bonfire"
            title={t("run.errors.generationTitle")}
            body={t("run.errors.generation")}
          />
        )}
      </div>
    </div>
  );
}

/**
 * The static HTML only contains this fallback, so it fills the viewport:
 * otherwise the footer would jump down when the card appears (layout shift).
 */
export function RunLoading() {
  const { t } = useTranslation();
  return (
    <p className="page min-h-dvh pt-12 font-sans text-lg text-parchment">
      {t("run.loading")}
    </p>
  );
}
