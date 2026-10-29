import { z } from "zod";
import { preferencesSchema } from "@/engine";
import { LOCALES } from "@/i18n/config";
import { defineStorageItem } from "./storage";

export const localeItem = defineStorageItem({
  key: "locale",
  version: 1,
  schema: z.enum(LOCALES).nullable(),
  fallback: null,
});

/** The last preferences used in the generator form. */
export const preferencesItem = defineStorageItem({
  key: "preferences",
  version: 1,
  schema: preferencesSchema.nullable(),
  fallback: null,
});
