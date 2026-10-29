"use client";

import Link from "next/link";
import { useMemo } from "react";
import { generateRun, getGameCatalog } from "@/engine";
import { useTranslation } from "@/i18n/useTranslation";
import { runPath } from "@/lib/run-link";
import { FAVORITE_LABEL_MAX } from "@/lib/storage/items";
import { Button } from "@/components/ui/Button";

function tryGenerate(seed: string) {
  try {
    return generateRun(seed);
  } catch {
    return null;
  }
}

export function SavedRunItem({
  seed,
  timestamp,
  timestampKey,
  label,
  onLabelChange,
  onRemove,
}: {
  seed: string;
  timestamp: number;
  timestampKey: "history.openedAt" | "history.savedAt";
  label?: string;
  onLabelChange?: (label: string) => void;
  onRemove: () => void;
}) {
  const { t, locale } = useTranslation();
  const run = useMemo(() => tryGenerate(seed), [seed]);
  const className = run
    ? getGameCatalog(run.gameId).classes.find((c) => c.id === run.startingClass)?.name
    : undefined;
  const title = label || className || seed;
  const date = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp);

  return (
    <li className="flex flex-col gap-3 border-b border-stone-800 py-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {run ? (
          <Link
            href={runPath(seed)}
            className="font-display text-heading text-bone underline-offset-4 hover:text-ember-glow hover:underline"
          >
            {title}
          </Link>
        ) : (
          <p className="font-display text-heading text-stone-400">{title}</p>
        )}
        <p className="mt-1 font-sans text-base text-parchment">
          {run
            ? `${t(`difficulties.${run.difficulty}.name`)}, ${
                run.constraints.length === 1
                  ? t("history.rulesOne")
                  : t("history.rulesOther", { count: run.constraints.length })
              }`
            : t("history.unavailable")}
        </p>
        <p className="mt-1 font-sans text-sm break-all text-stone-400">
          <span className="text-ember-glow">{seed}</span> {t(timestampKey, { date })}
        </p>
        {onLabelChange && (
          <label className="mt-3 block max-w-sm">
            <span className="sr-only">{t("history.label")}</span>
            <input
              defaultValue={label}
              maxLength={FAVORITE_LABEL_MAX}
              placeholder={t("history.labelPlaceholder")}
              onBlur={(event) => onLabelChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
              }}
              className="w-full rounded-sm border border-stone-800 bg-transparent px-3 py-1.5 font-sans text-base text-bone placeholder:text-stone-600 hover:border-stone-600 focus:border-ember"
            />
          </label>
        )}
      </div>
      <Button
        variant="quiet"
        onClick={onRemove}
        aria-label={t("history.removeNamed", { name: title })}
        className="self-start"
      >
        {t("history.remove")}
      </Button>
    </li>
  );
}
