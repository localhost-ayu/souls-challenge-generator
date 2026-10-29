"use client";

import type { ReactNode } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { favoritesItem, historyItem } from "@/lib/storage/items";
import { removeSeed, setFavoriteLabel } from "@/lib/storage/saved-runs";
import { setItemValue, useStorageItem } from "@/lib/storage/store";
import { ButtonLink } from "@/components/ui/Button";
import { ConfirmClear } from "./ConfirmClear";
import { SavedRunItem } from "./SavedRunItem";

function Section({
  id,
  title,
  action,
  children,
}: {
  id: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mt-14" aria-labelledby={id}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 id={id} className="font-display text-heading text-bone">
          {title}
        </h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function HistoryView() {
  const { t } = useTranslation();
  const favorites = useStorageItem(favoritesItem);
  const history = useStorageItem(historyItem);

  return (
    <div className="mx-auto max-w-3xl px-5 pt-10 pb-16 sm:px-8 sm:pt-16">
      <h1 className="font-display text-title font-medium text-bone">{t("history.title")}</h1>

      <Section
        id="favorites"
        title={t("history.favoritesTitle")}
        action={
          favorites.length > 0 && (
            <ConfirmClear
              label={t("history.clearFavorites")}
              question={t("history.confirmClearFavorites", { count: favorites.length })}
              onConfirm={() => setItemValue(favoritesItem, [])}
            />
          )
        }
      >
        {favorites.length === 0 ? (
          <p className="text-parchment">{t("history.favoritesEmpty")}</p>
        ) : (
          <ul>
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
          </ul>
        )}
      </Section>

      <Section
        id="recent"
        title={t("history.recentTitle")}
        action={
          history.length > 0 && (
            <ConfirmClear
              label={t("history.clearHistory")}
              question={t("history.confirmClearHistory", { count: history.length })}
              onConfirm={() => setItemValue(historyItem, [])}
            />
          )
        }
      >
        {history.length === 0 ? (
          <div>
            <p className="text-parchment">{t("history.recentEmpty")}</p>
            <ButtonLink href="/play" variant="primary" className="mt-6">
              {t("history.goToPlay")}
            </ButtonLink>
          </div>
        ) : (
          <ul>
            {history.map((entry) => (
              <SavedRunItem
                key={entry.seed}
                seed={entry.seed}
                timestamp={entry.savedAt}
                timestampKey="history.openedAt"
                onRemove={() => setItemValue(historyItem, removeSeed(history, entry.seed))}
              />
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
