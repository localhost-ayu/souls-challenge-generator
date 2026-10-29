import { z } from "zod";

/** The subset of the Web Storage API the wrapper needs; easy to fake in tests. */
export type StorageArea = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const PREFIX = "scg:";

export interface StorageItem<T> {
  key: string;
  /**
   * Bump when the stored shape changes incompatibly. Values saved with any
   * other version are discarded instead of being misread.
   */
  version: number;
  schema: z.ZodType<T>;
  fallback: T;
}

export function defineStorageItem<T>(item: StorageItem<T>): StorageItem<T> {
  return item;
}

const envelopeSchema = z.object({ v: z.number().int(), data: z.unknown() });

/** localStorage, or null when the browser blocks it (privacy modes, disabled cookies). */
export function getDefaultArea(): StorageArea | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function readItem<T>(
  item: StorageItem<T>,
  area: StorageArea | null = getDefaultArea(),
): T {
  if (!area) return item.fallback;

  let raw: string | null;
  try {
    raw = area.getItem(PREFIX + item.key);
  } catch {
    return item.fallback;
  }
  if (raw === null) return item.fallback;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = undefined;
  }

  const envelope = envelopeSchema.safeParse(parsed);
  const data =
    envelope.success && envelope.data.v === item.version
      ? item.schema.safeParse(envelope.data.data)
      : undefined;
  if (data?.success) return data.data;

  // Corrupted, outdated or foreign data: drop it so it is not re-read forever.
  removeItem(item, area);
  return item.fallback;
}

/** Returns false when the value could not be saved (blocked storage, quota exceeded). */
export function writeItem<T>(
  item: StorageItem<T>,
  value: T,
  area: StorageArea | null = getDefaultArea(),
): boolean {
  if (!area) return false;
  try {
    area.setItem(PREFIX + item.key, JSON.stringify({ v: item.version, data: value }));
    return true;
  } catch {
    return false;
  }
}

export function removeItem<T>(
  item: StorageItem<T>,
  area: StorageArea | null = getDefaultArea(),
): void {
  try {
    area?.removeItem(PREFIX + item.key);
  } catch {
    // Nothing else to do; the next read falls back anyway.
  }
}

/** Maps a raw localStorage key back to an item key, or null if it is not ours. */
export function itemKeyOf(storageKey: string | null): string | null {
  return storageKey?.startsWith(PREFIX) ? storageKey.slice(PREFIX.length) : null;
}
