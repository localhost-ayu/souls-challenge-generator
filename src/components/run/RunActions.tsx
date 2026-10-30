"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSeed, parseSeed, type ChallengeRun } from "@/engine";
import { Icon } from "@/components/icons/Icon";
import { Button, ButtonLink } from "@/components/ui/Button";
import { useTranslation } from "@/i18n/useTranslation";
import type { MessageKey } from "@/i18n/translate";
import { copyText } from "@/lib/clipboard";
import { randomSeedKey } from "@/lib/random";
import { runPath, runUrl } from "@/lib/run-link";
import { favoritesItem } from "@/lib/storage/items";
import { isFavorite, toggleFavorite } from "@/lib/storage/saved-runs";
import { setItemValue, useStorageItem } from "@/lib/storage/store";

export function RunActions({ run }: { run: ChallengeRun }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [status, setStatus] = useState<MessageKey | null>(null);
  const favorites = useStorageItem(favoritesItem);
  const favorite = isFavorite(favorites, run.seed);

  function toggle() {
    setItemValue(favoritesItem, toggleFavorite(favorites, run.seed, Date.now()));
    setStatus(favorite ? "run.unfavorited" : "run.favorited");
  }

  async function copy(text: string, success: MessageKey) {
    setStatus((await copyText(text)) ? success : "run.copyFailed");
  }

  async function share() {
    const url = runUrl(run.seed);
    if (navigator.share) {
      try {
        await navigator.share({ title: t("common.appName"), text: t("run.shareText"), url });
        return;
      } catch (error) {
        // Closing the share sheet is not a failure worth reporting.
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await copy(url, "run.linkCopied");
  }

  function generateAnother() {
    const { gameId, preferences } = parseSeed(run.seed);
    router.push(runPath(createSeed({ gameId, preferences, key: randomSeedKey() })));
  }

  return (
    <aside className="run-actions" aria-label={t("run.actions")}>
      <div className="group pair">
        <Button className="btn-block" onClick={() => copy(run.seed, "run.seedCopied")}>
          <Icon name="copy" />
          {t("run.copySeed")}
        </Button>
        <Button className="btn-block" onClick={() => copy(runUrl(run.seed), "run.linkCopied")}>
          <Icon name="link" />
          {t("run.copyLink")}
        </Button>
        <Button className="btn-block" onClick={share}>
          <Icon name="share" />
          {t("run.share")}
        </Button>
        <Button className="btn-block" aria-pressed={favorite} onClick={toggle}>
          <Icon name="star" filled={favorite} />
          {t("run.favorite")}
        </Button>
      </div>
      <p className="status" aria-live="polite">
        {status && t(status)}
      </p>
      <Button variant="primary" className="btn-block" onClick={generateAnother}>
        <Icon name="reroll" />
        {t("run.another")}
      </Button>
      <ButtonLink href="/play" variant="ghost" className="btn-block">
        <Icon name="settings" />
        {t("run.newSettings")}
      </ButtonLink>
    </aside>
  );
}
