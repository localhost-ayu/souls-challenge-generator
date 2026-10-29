import { useCallback, useSyncExternalStore } from "react";
import {
  itemKeyOf,
  readItem,
  writeItem,
  type StorageItem,
} from "./storage";

/*
 * Reactive layer over the storage wrapper. Values are kept in memory once
 * read, so the UI keeps working for this visit even when saving fails, and
 * the same object is returned until it changes (as useSyncExternalStore
 * requires).
 */
const cache = new Map<string, unknown>();
const listeners = new Map<string, Set<() => void>>();
let syncingTabs = false;

function notify(key: string) {
  listeners.get(key)?.forEach((listener) => listener());
}

// Other tabs write to the same storage; drop our copy and re-read.
function syncAcrossTabs() {
  if (syncingTabs || typeof window === "undefined") return;
  syncingTabs = true;
  window.addEventListener("storage", (event) => {
    if (event.key === null) {
      cache.clear();
      listeners.forEach((_, key) => notify(key));
      return;
    }
    const key = itemKeyOf(event.key);
    if (key) {
      cache.delete(key);
      notify(key);
    }
  });
}

export function getItemValue<T>(item: StorageItem<T>): T {
  if (!cache.has(item.key)) cache.set(item.key, readItem(item));
  return cache.get(item.key) as T;
}

export function setItemValue<T>(item: StorageItem<T>, value: T): void {
  cache.set(item.key, value);
  writeItem(item, value);
  notify(item.key);
}

export function subscribeToItem<T>(
  item: StorageItem<T>,
  listener: () => void,
): () => void {
  syncAcrossTabs();
  const set = listeners.get(item.key) ?? new Set();
  set.add(listener);
  listeners.set(item.key, set);
  return () => set.delete(listener);
}

/**
 * Reads a stored value reactively. The server render and hydration use the
 * fallback, and the stored value follows right after, so there is never a
 * hydration mismatch.
 */
export function useStorageItem<T>(item: StorageItem<T>): T {
  const subscribe = useCallback(
    (listener: () => void) => subscribeToItem(item, listener),
    [item],
  );
  return useSyncExternalStore(
    subscribe,
    () => getItemValue(item),
    () => item.fallback,
  );
}
