import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  defineStorageItem,
  itemKeyOf,
  readItem,
  removeItem,
  writeItem,
  type StorageArea,
} from "./storage";

class MemoryArea implements StorageArea {
  readonly data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
}

const counter = defineStorageItem({
  key: "counter",
  version: 2,
  schema: z.number().int(),
  fallback: 0,
});

describe("storage wrapper", () => {
  it("round-trips values under a prefixed, versioned envelope", () => {
    const area = new MemoryArea();

    expect(writeItem(counter, 7, area)).toBe(true);
    expect(area.data.get("scg:counter")).toBe('{"v":2,"data":7}');
    expect(readItem(counter, area)).toBe(7);
  });

  it("returns the fallback when nothing is stored", () => {
    expect(readItem(counter, new MemoryArea())).toBe(0);
  });

  it.each([
    ["invalid json", "{not json"],
    ["a bare value without envelope", "7"],
    ["data failing the schema", '{"v":2,"data":"seven"}'],
    ["an older version", '{"v":1,"data":7}'],
    ["a newer version", '{"v":3,"data":7}'],
  ])("discards %s and removes it", (_, raw) => {
    const area = new MemoryArea();
    area.setItem("scg:counter", raw);

    expect(readItem(counter, area)).toBe(0);
    expect(area.data.has("scg:counter")).toBe(false);
  });

  it("survives a storage that throws on every access", () => {
    const blocked: StorageArea = {
      getItem() {
        throw new DOMException("blocked", "SecurityError");
      },
      setItem() {
        throw new DOMException("blocked", "SecurityError");
      },
      removeItem() {
        throw new DOMException("blocked", "SecurityError");
      },
    };

    expect(readItem(counter, blocked)).toBe(0);
    expect(writeItem(counter, 1, blocked)).toBe(false);
    expect(() => removeItem(counter, blocked)).not.toThrow();
  });

  it("reports a full quota instead of throwing", () => {
    const area = new MemoryArea();
    area.setItem = () => {
      throw new DOMException("full", "QuotaExceededError");
    };

    expect(writeItem(counter, 1, area)).toBe(false);
  });

  it("falls back when no storage is available at all", () => {
    expect(readItem(counter, null)).toBe(0);
    expect(writeItem(counter, 1, null)).toBe(false);
  });

  it("recognizes its own keys", () => {
    expect(itemKeyOf("scg:history")).toBe("history");
    expect(itemKeyOf("other:history")).toBeNull();
    expect(itemKeyOf(null)).toBeNull();
  });
});
