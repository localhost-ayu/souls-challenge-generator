"use client";

import { useEffect, useRef } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { Button } from "@/components/ui/Button";

/** The inline question shown before a destructive action runs. */
export function ConfirmClear({
  question,
  onConfirm,
  onCancel,
}: {
  question: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Move focus into the question so keyboard users land on the choice.
  useEffect(() => confirmRef.current?.focus(), []);

  return (
    <div role="alert" className="confirm">
      <p>{question}</p>
      <Button ref={confirmRef} variant="danger" className="btn-sm" onClick={onConfirm}>
        {t("history.confirm")}
      </Button>
      <Button className="btn-sm" onClick={onCancel}>
        {t("history.cancel")}
      </Button>
    </div>
  );
}
