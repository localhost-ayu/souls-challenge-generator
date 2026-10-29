import { describe, expect, it } from "vitest";
import enUS from "./messages/en-US.json";
import ptBR from "./messages/pt-BR.json";

function flatten(value: unknown, prefix = ""): Map<string, string> {
  const entries = new Map<string, string>();
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof child === "string") {
      entries.set(path, child);
    } else {
      flatten(child, path).forEach((text, nested) => entries.set(nested, text));
    }
  }
  return entries;
}

const placeholders = (text: string) =>
  [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();

describe("dictionaries", () => {
  const english = flatten(enUS);
  const portuguese = flatten(ptBR);

  it("share exactly the same keys", () => {
    expect([...portuguese.keys()].sort()).toEqual([...english.keys()].sort());
  });

  it("use the same placeholders for every key", () => {
    for (const [key, text] of english) {
      expect(placeholders(portuguese.get(key) ?? ""), key).toEqual(
        placeholders(text),
      );
    }
  });

  it("have no empty strings", () => {
    for (const [key, text] of [...english, ...portuguese]) {
      expect(text.trim(), key).not.toBe("");
    }
  });
});
