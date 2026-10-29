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

export const HISTORY_LIMIT = 30;
export const FAVORITE_LABEL_MAX = 60;

// Only the seed is stored: it rebuilds the whole run.
const savedRunSchema = z.strictObject({
  seed: z.string().min(1).max(64),
  savedAt: z.number().int().nonnegative(),
});

const favoriteSchema = savedRunSchema.extend({
  label: z.string().max(FAVORITE_LABEL_MAX).optional(),
});

export type SavedRun = z.infer<typeof savedRunSchema>;
export type FavoriteRun = z.infer<typeof favoriteSchema>;

export const historyItem = defineStorageItem<SavedRun[]>({
  key: "history",
  version: 1,
  schema: z.array(savedRunSchema).max(HISTORY_LIMIT),
  fallback: [],
});

export const favoritesItem = defineStorageItem<FavoriteRun[]>({
  key: "favorites",
  version: 1,
  schema: z.array(favoriteSchema),
  fallback: [],
});
