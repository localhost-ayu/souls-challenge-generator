import {
  FAVORITE_LABEL_MAX,
  HISTORY_LIMIT,
  type FavoriteRun,
  type SavedRun,
} from "./items";

/** Newest first, without duplicates, capped at HISTORY_LIMIT. */
export function addToHistory(
  history: readonly SavedRun[],
  seed: string,
  now: number,
): SavedRun[] {
  return [
    { seed, savedAt: now },
    ...history.filter((entry) => entry.seed !== seed),
  ].slice(0, HISTORY_LIMIT);
}

export function removeSeed<T extends SavedRun>(list: readonly T[], seed: string): T[] {
  return list.filter((entry) => entry.seed !== seed);
}

export function isFavorite(favorites: readonly FavoriteRun[], seed: string): boolean {
  return favorites.some((entry) => entry.seed === seed);
}

export function toggleFavorite(
  favorites: readonly FavoriteRun[],
  seed: string,
  now: number,
): FavoriteRun[] {
  return isFavorite(favorites, seed)
    ? removeSeed(favorites, seed)
    : [{ seed, savedAt: now }, ...favorites];
}

/** Blank labels are removed; long ones are cut to fit the stored schema. */
export function setFavoriteLabel(
  favorites: readonly FavoriteRun[],
  seed: string,
  label: string,
): FavoriteRun[] {
  const trimmed = label.trim().slice(0, FAVORITE_LABEL_MAX);
  return favorites.map((entry) => {
    if (entry.seed !== seed) return entry;
    return trimmed
      ? { ...entry, label: trimmed }
      : { seed: entry.seed, savedAt: entry.savedAt };
  });
}
