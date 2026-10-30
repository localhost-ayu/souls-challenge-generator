"use client";

import { useMemo } from "react";
import { generateRun, getGameCatalog } from "@/engine";
import { Icon } from "@/components/icons/Icon";
import { ButtonLink } from "@/components/ui/Button";
import { useTranslation } from "@/i18n/useTranslation";
import { runPath } from "@/lib/run-link";
import { FAVORITE_LABEL_MAX } from "@/lib/storage/items";

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
  const rowClass = ["run-row", onLabelChange && "fav", !run && "unavailable"]
    .filter(Boolean)
    .join(" ");

  return (
    <li className={rowClass}>
      <div className="run-main">
        {onLabelChange ? (
          <input
            className="label-input"
            defaultValue={label}
            maxLength={FAVORITE_LABEL_MAX}
            placeholder={t("history.labelPlaceholder")}
            aria-label={t("history.labelFor", { name: className ?? seed })}
            onBlur={(event) => onLabelChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
          />
        ) : (
          <span className="run-class">{title}</span>
        )}
        <div className="run-meta">
          {run ? (
            <>
              {onLabelChange && className && (
                <>
                  <span>{className}</span>
                  <span aria-hidden="true">·</span>
                </>
              )}
              <span>{t(`difficulties.${run.difficulty}.name`)}</span>
              <span aria-hidden="true">·</span>
              <span>
                {run.constraints.length === 1
                  ? t("history.rulesOne")
                  : t("history.rulesOther", { count: run.constraints.length })}
              </span>
              <span aria-hidden="true">·</span>
            </>
          ) : null}
          <span>{t(timestampKey, { date })}</span>
        </div>
        <code className="run-seed">{seed}</code>
        {!run && (
          <p className="unavail-note">
            <Icon name="hourglass" size={14} />
            {t("history.unavailable")}
          </p>
        )}
      </div>
      <div className="run-row-actions">
        {run && (
          <ButtonLink href={runPath(seed)} className="btn-sm">
            {t("history.open")}
          </ButtonLink>
        )}
        <button
          type="button"
          className="icon-btn"
          onClick={onRemove}
          aria-label={t("history.removeNamed", { name: title })}
        >
          <Icon name="trash" />
        </button>
      </div>
    </li>
  );
}
