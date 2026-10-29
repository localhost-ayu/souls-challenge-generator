import { describe, expect, it } from "vitest";
import { DIFFICULTIES, OBJECTIVES, type Preferences } from "./preferences";
import { createRng, nextInt } from "./rng";
import {
  decodeSeed,
  encodeSeed,
  InvalidSeedError,
  seedKeyFromNumber,
  UnsupportedRulesetError,
  type SeedParts,
} from "./seed";
import { CONSTRAINT_CATEGORIES } from "./types";

const SUPPORTED = { dsr: 1 } as const;

const allCategories = Object.fromEntries(
  CONSTRAINT_CATEGORIES.map((category) => [category, true]),
) as Preferences["categories"];

const parts: SeedParts = {
  gameId: "dsr",
  rulesetVersion: 1,
  preferences: {
    difficulty: "chosen",
    objective: "all-bosses",
    includeDlc: true,
    categories: allCategories,
  },
  key: "0k3j9x2",
};

function decode(seed: string) {
  return decodeSeed(seed, SUPPORTED);
}

describe("encodeSeed", () => {
  it("produces a short, url-safe seed", () => {
    const seed = encodeSeed(parts);

    expect(seed).toBe("dsr-1-e6-0k3j9x2");
    expect(encodeURIComponent(seed)).toBe(seed);
  });

  it("stays within 32 characters with the longest key", () => {
    const seed = encodeSeed({
      ...parts,
      rulesetVersion: 9999,
      key: "z".repeat(16),
    });

    expect(seed.length).toBeLessThanOrEqual(32);
  });

  it("rejects invalid parts", () => {
    expect(() => encodeSeed({ ...parts, key: "not valid!" })).toThrow();
    expect(() => encodeSeed({ ...parts, rulesetVersion: 0 })).toThrow();
  });
});

describe("decodeSeed", () => {
  it("round-trips every preference combination", () => {
    for (const difficulty of DIFFICULTIES) {
      for (const objective of OBJECTIVES) {
        for (const includeDlc of [false, true]) {
          for (let mask = 0; mask < 1 << CONSTRAINT_CATEGORIES.length; mask++) {
            const categories = Object.fromEntries(
              CONSTRAINT_CATEGORIES.map((category, i) => [
                category,
                ((mask >> i) & 1) === 1,
              ]),
            ) as Preferences["categories"];
            const original: SeedParts = {
              ...parts,
              preferences: { difficulty, objective, includeDlc, categories },
            };

            expect(decode(encodeSeed(original))).toEqual(original);
          }
        }
      }
    }
  });

  it("round-trips random keys", () => {
    const rng = createRng(2024);
    for (let i = 0; i < 1_000; i++) {
      const key = seedKeyFromNumber(rng.nextUint32());
      const original = { ...parts, key };

      expect(decode(encodeSeed(original))).toEqual(original);
    }
  });

  it("accepts custom word keys", () => {
    expect(decode("dsr-1-e6-praisethesun").key).toBe("praisethesun");
  });

  it("ignores surrounding whitespace and letter case", () => {
    expect(decode("  DSR-1-E6-0K3J9X2\n")).toEqual(parts);
  });

  it.each([
    ["empty input", ""],
    ["random text", "hello world"],
    ["missing key", "dsr-1-e6-"],
    ["missing segment", "dsr-1-0k3j9x2"],
    ["extra segment", "dsr-1-e6-0k3j9x2-extra"],
    ["non-numeric ruleset", "dsr-x-e6-0k3j9x2"],
    ["zero-padded ruleset", "dsr-01-e6-0k3j9x2"],
    ["one-char preferences", "dsr-1-u-0k3j9x2"],
    ["key too long", `dsr-1-e6-${"a".repeat(17)}`],
    ["symbols in key", "dsr-1-e6-0k3j_x2"],
    ["unknown game", "ds9-1-e6-0k3j9x2"],
    ["preferences out of range", "dsr-1-zz-0k3j9x2"],
  ])("rejects %s", (_, seed) => {
    expect(() => decode(seed)).toThrow(InvalidSeedError);
  });

  it("rejects seeds from another ruleset version with details", () => {
    let error: unknown;
    try {
      decode("dsr-2-e6-0k3j9x2");
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(UnsupportedRulesetError);
    expect(error).toMatchObject({
      gameId: "dsr",
      seedVersion: 2,
      supportedVersion: 1,
    });
  });
});

describe("seedKeyFromNumber", () => {
  it("pads to a fixed length", () => {
    expect(seedKeyFromNumber(0)).toBe("0000000");
    expect(seedKeyFromNumber(0xffff_ffff)).toBe("1z141z3");
  });

  it("rejects values outside the uint32 range", () => {
    expect(() => seedKeyFromNumber(-1)).toThrow(RangeError);
    expect(() => seedKeyFromNumber(2 ** 32)).toThrow(RangeError);
    expect(() => seedKeyFromNumber(1.5)).toThrow(RangeError);
  });

  it("gives distinct keys for distinct inputs", () => {
    const rng = createRng(99);
    const keys = new Set(
      Array.from({ length: 1_000 }, () => seedKeyFromNumber(nextInt(rng, 2 ** 31))),
    );

    expect(keys.size).toBe(1_000);
  });
});
