import { describe, expect, it } from "vitest";
import { matchLocale } from "./config";

describe("matchLocale", () => {
  it("matches exact tags case-insensitively", () => {
    expect(matchLocale(["pt-br"])).toBe("pt-BR");
    expect(matchLocale(["en-US"])).toBe("en-US");
  });

  it("falls back to the same language", () => {
    expect(matchLocale(["pt-PT"])).toBe("pt-BR");
    expect(matchLocale(["pt"])).toBe("pt-BR");
    expect(matchLocale(["en-GB"])).toBe("en-US");
  });

  it("respects the order of preference", () => {
    expect(matchLocale(["fr-FR", "pt-BR", "en-US"])).toBe("pt-BR");
  });

  it("defaults to en-US", () => {
    expect(matchLocale(["ja-JP"])).toBe("en-US");
    expect(matchLocale([])).toBe("en-US");
  });
});
