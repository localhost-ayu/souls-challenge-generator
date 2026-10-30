"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { InvalidSeedError, parseSeed, UnsupportedRulesetError } from "@/engine";
import { useTranslation } from "@/i18n/useTranslation";
import { runPath } from "@/lib/run-link";
import { Icon } from "@/components/icons/Icon";
import { Button } from "@/components/ui/Button";
import { SEED_EXAMPLE } from "@/components/run/RunView";

export function SeedForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const inputId = useId();
  const errorId = useId();
  const titleId = useId();
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
    <section className="mt-10 border-t border-stone-800 pt-8" aria-labelledby={titleId}>
      <h2 id={titleId} className="legend mb-3.5">
        {t("play.seedTitle")}
      </h2>
      <form onSubmit={open} noValidate className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-[1_1_280px]">
          <label htmlFor={inputId} className="label">
            {t("play.seedLabel")}
          </label>
          <input
            id={inputId}
            className="input"
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
          />
        </div>
        <Button type="submit" disabled={value.trim() === ""}>
          {t("play.seedSubmit")}
          <Icon name="arrow" size={18} />
        </Button>
      </form>
      {error && (
        <p id={errorId} role="alert" className="opt-hint bad">
          <Icon name="alert" size={16} />
          {error}
        </p>
      )}
    </section>
  );
}
