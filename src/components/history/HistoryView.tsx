"use client";

import { useRef, useState, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons/Icon";
import { Button, ButtonLink } from "@/components/ui/Button";
import { useTranslation } from "@/i18n/useTranslation";
import { favoritesItem, historyItem } from "@/lib/storage/items";
import { removeSeed, setFavoriteLabel } from "@/lib/storage/saved-runs";
import { setItemValue, useStorageItem } from "@/lib/storage/store";
import { ConfirmClear } from "./ConfirmClear";
import { SavedRunItem } from "./SavedRunItem";

function Section({
  id,
  icon,
  title,
  count,
  clearLabel,
  confirmQuestion,
  onClear,
  empty,
  children,
}: {
  id: string;
  icon: IconName;
  title: string;
  count: number;
  clearLabel: string;
  confirmQuestion: string;
  onClear: () => void;
  empty: ReactNode;
  children: ReactNode;
}) {
  const [asking, setAsking] = useState(false);
  const clearRef = useRef<HTMLButtonElement>(null);

  return (
    <section className="mb-14" aria-labelledby={id}>
      <div className="list-head">
        <h2 id={id}>
          <Icon name={icon} size={22} className="text-ember-glow" />
          {title}
          <span className="pill">{count}</span>
        </h2>
        {count > 0 && (
          <Button
            ref={clearRef}
            variant="ghost"
            className="btn-sm"
            onClick={() => setAsking(true)}
          >
            {clearLabel}
          </Button>
        )}
      </div>
      {asking && (
        <ConfirmClear
          question={confirmQuestion}
          onConfirm={() => {
            onClear();
            setAsking(false);
          }}
          onCancel={() => {
            setAsking(false);
            clearRef.current?.focus();
          }}
        />
      )}
      {count === 0 ? empty : <ul className="runs">{children}</ul>}
    </section>
  );
}

export function HistoryView() {
  const { t } = useTranslation();
  const favorites = useStorageItem(favoritesItem);
  const history = useStorageItem(historyItem);

  return (
    <div className="page max-w-form pt-12">
      <div className="mb-10 flex flex-col gap-2.5">
        <p className="eyebrow">{t("history.eyebrow")}</p>
        <h1 className="display page-title">{t("history.title")}</h1>
      </div>

      <Section
        id="favorites"
        icon="star"
        title={t("history.favoritesTitle")}
        count={favorites.length}
        clearLabel={t("history.clearFavorites")}
        confirmQuestion={t("history.confirmClearFavorites", { count: favorites.length })}
        onClear={() => setItemValue(favoritesItem, [])}
        empty={
          <div className="empty">
            <Icon name="star" size={32} />
            <p>{t("history.favoritesEmpty")}</p>
          </div>
        }
      >
        {favorites.map((entry) => (
          <SavedRunItem
            key={entry.seed}
            seed={entry.seed}
            timestamp={entry.savedAt}
            timestampKey="history.savedAt"
            label={entry.label}
            onLabelChange={(label) =>
              setItemValue(favoritesItem, setFavoriteLabel(favorites, entry.seed, label))
            }
            onRemove={() => setItemValue(favoritesItem, removeSeed(favorites, entry.seed))}
          />
        ))}
      </Section>

      <Section
        id="recent"
        icon="clock"
        title={t("history.recentTitle")}
        count={history.length}
        clearLabel={t("history.clearHistory")}
        confirmQuestion={t("history.confirmClearHistory", { count: history.length })}
        onClear={() => setItemValue(historyItem, [])}
        empty={
          <div className="empty">
            <Icon name="bonfire" size={32} />
            <p>{t("history.recentEmpty")}</p>
            <ButtonLink href="/play" variant="primary">
              {t("history.goToPlay")}
            </ButtonLink>
          </div>
        }
      >
        {history.map((entry) => (
          <SavedRunItem
            key={entry.seed}
            seed={entry.seed}
            timestamp={entry.savedAt}
            timestampKey="history.openedAt"
            onRemove={() => setItemValue(historyItem, removeSeed(history, entry.seed))}
          />
        ))}
      </Section>
    </div>
  );
}
