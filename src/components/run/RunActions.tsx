"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSeed, parseSeed, type ChallengeRun } from "@/engine";
import { useTranslation } from "@/i18n/useTranslation";
import type { MessageKey } from "@/i18n/translate";
import { copyText } from "@/lib/clipboard";
import { randomSeedKey } from "@/lib/random";
import { runPath, runUrl } from "@/lib/run-link";
import { favoritesItem } from "@/lib/storage/items";
import { isFavorite, toggleFavorite } from "@/lib/storage/saved-runs";
import { setItemValue, useStorageItem } from "@/lib/storage/store";
import { Button, ButtonLink } from "@/components/ui/Button";

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
    <div className="mt-6">
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" onClick={generateAnother}>
          {t("run.another")}
        </Button>
        <Button onClick={() => copy(runUrl(run.seed), "run.linkCopied")}>
          {t("run.copyLink")}
        </Button>
        <Button onClick={share}>{t("run.share")}</Button>
        <Button aria-pressed={favorite} onClick={toggle}>
          <StarIcon filled={favorite} />
          {t("run.favorite")}
        </Button>
        <ButtonLink href="/play" variant="quiet" className="ml-auto">
          {t("run.newSettings")}
        </ButtonLink>
      </div>
      <p aria-live="polite" className="mt-3 min-h-7 font-sans text-base text-parchment">
        {status && t(status)}
      </p>
    </div>
  );
}

export function CopySeedButton({ seed }: { seed: string }) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<MessageKey | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        onClick={async () =>
          setStatus((await copyText(seed)) ? "run.seedCopied" : "run.copyFailed")
        }
      >
        {t("run.copySeed")}
      </Button>
      <span aria-live="polite" className="font-sans text-sm text-parchment">
        {status && t(status)}
      </span>
    </div>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`size-5 ${filled ? "fill-ember text-ember" : "fill-none"}`}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    >
      <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9Z" />
    </svg>
  );
}
