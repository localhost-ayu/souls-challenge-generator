import { describe, expect, it } from "vitest";
import { translate, type Messages } from "./translate";

const messages = {
  common: { appName: "Souls Challenge Generator" },
  language: { label: "Language", "en-US": "English", "pt-BR": "Português" },
  greeting: { hello: "Hello, {name}! You died {count} times." },
} as unknown as Messages;

// The fixture has keys beyond the real dictionary, so cast for the test.
const t = (key: string, params?: Record<string, string | number>) =>
  translate(messages, key as never, params);

describe("translate", () => {
  it("resolves nested keys", () => {
    expect(t("language.label")).toBe("Language");
  });

  it("fills placeholders", () => {
    expect(t("greeting.hello", { name: "Solaire", count: 3 })).toBe(
      "Hello, Solaire! You died 3 times.",
    );
  });

  it("leaves placeholders without a value untouched", () => {
    expect(t("greeting.hello", { name: "Solaire" })).toBe(
      "Hello, Solaire! You died {count} times.",
    );
  });

  it("falls back to the key when a dictionary entry is missing", () => {
    expect(t("missing.key")).toBe("missing.key");
    expect(t("language")).toBe("language");
  });
});
