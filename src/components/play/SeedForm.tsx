"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { InvalidSeedError, parseSeed, UnsupportedRulesetError } from "@/engine";
import { useTranslation } from "@/i18n/useTranslation";
import { runPath } from "@/lib/run-link";
import { Button } from "@/components/ui/Button";
import { SEED_EXAMPLE } from "@/components/run/RunView";

export function SeedForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const inputId = useId();
  const errorId = useId();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function open(event: FormEvent) {
    event.preventDefault();
    try {
      parseSeed(value);
      // Navigate with the input as typed; the run page normalizes it.
      router.push(runPath(value.trim()));
    } catch (caught) {
      if (caught instanceof UnsupportedRulesetError) {
        const kind = caught.seedVersion < caught.supportedVersion ? "outdated" : "newer";
        setError(
          t(`run.errors.${kind}`, {
            seedVersion: caught.seedVersion,
            currentVersion: caught.supportedVersion,
          }),
        );
      } else if (caught instanceof InvalidSeedError) {
        setError(t("run.errors.invalid", { example: SEED_EXAMPLE }));
      } else {
        throw caught;
      }
    }
  }

  return (
    <form onSubmit={open} noValidate className="mt-16 border-t border-stone-800 pt-10">
      <h2 className="font-display text-heading text-bone">{t("play.seedTitle")}</h2>
      <label htmlFor={inputId} className="mt-4 block font-sans text-base text-stone-400">
        {t("play.seedLabel")}
      </label>
      <div className="mt-2 flex flex-wrap gap-3">
        <input
          id={inputId}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setError(null);
          }}
          placeholder={SEED_EXAMPLE}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={error !== null}
          aria-describedby={error ? errorId : undefined}
          className="min-w-0 flex-1 rounded-sm border border-stone-600 bg-stone-900 px-4 py-2.5 font-sans text-lg text-bone placeholder:text-stone-600 focus:border-ember"
        />
        <Button type="submit" disabled={value.trim() === ""}>
          {t("play.seedSubmit")}
        </Button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-3 max-w-prose font-sans text-base text-ember-glow">
          {error}
        </p>
      )}
    </form>
  );
}
