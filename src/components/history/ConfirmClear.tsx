"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { Button } from "@/components/ui/Button";

/** A destructive action that asks inline before running. */
export function ConfirmClear({
  label,
  question,
  onConfirm,
}: {
  label: string;
  question: string;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  const [asking, setAsking] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasAsking = useRef(false);

  // Move focus into the question, and back to the trigger when cancelled.
  useEffect(() => {
    if (asking) confirmRef.current?.focus();
    else if (wasAsking.current) triggerRef.current?.focus();
    wasAsking.current = asking;
  }, [asking]);

  if (!asking) {
    return (
      <Button ref={triggerRef} variant="quiet" onClick={() => setAsking(true)}>
        {label}
      </Button>
    );
  }

  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-3">
      <p className="font-sans text-base text-bone">{question}</p>
      <Button
        ref={confirmRef}
        onClick={() => {
          onConfirm();
          setAsking(false);
        }}
        className="border-blood text-bone hover:border-blood hover:bg-blood hover:text-bone"
      >
        {t("history.confirm")}
      </Button>
      <Button variant="quiet" onClick={() => setAsking(false)}>
        {t("history.cancel")}
      </Button>
    </div>
  );
}
