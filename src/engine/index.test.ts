import { describe, expect, it } from "vitest";
import {
  createLuckySeed,
  createSeed,
  generateRun,
  getGameCatalog,
  GenerationError,
  InvalidSeedError,
  parseSeed,
  UnsupportedRulesetError,
  type Preferences,
} from "./index";

const preferences: Preferences = {
  difficulty: "undead",
  objective: "main-bosses",
  includeDlc: false,
  houseRules: { buffs: true, summons: false, glitches: false },
  categories: {
    level: true,
    equipment: true,
    movement: true,
    combat: true,
    resource: true,
    style: true,
  },
};

describe("engine public api", () => {
  it("creates a seed for the current ruleset and generates its run", () => {
    const seed = createSeed({ gameId: "dsr", preferences, key: "praisethesun" });
    const run = generateRun(seed);

    expect(seed).toMatch(/^dsr-5-/);
    expect(run.seed).toBe(seed);
    expect(run.gameId).toBe("dsr");
    expect(parseSeed(seed).preferences).toEqual(preferences);
  });

  it("normalizes the seed it was given", () => {
    const seed = createSeed({ gameId: "dsr", preferences, key: "abc" });

    expect(generateRun(` ${seed.toUpperCase()} `)).toEqual(generateRun(seed));
  });

  it("surfaces typed errors", () => {
    expect(() => generateRun("not a seed")).toThrow(InvalidSeedError);
    expect(() => generateRun("dsr-99-68u-abc")).toThrow(UnsupportedRulesetError);

    const noCategories = createSeed({
      gameId: "dsr",
      key: "abc",
      preferences: {
        ...preferences,
        categories: {
          level: false,
          equipment: false,
          movement: false,
          combat: false,
          resource: false,
          style: false,
        },
      },
    });
    expect(() => generateRun(noCategories)).toThrow(GenerationError);
  });

  it("creates deterministic lucky seeds with at least one category", () => {
    const seeds = Array.from({ length: 200 }, (_, i) =>
      createLuckySeed({ gameId: "dsr", key: `lucky${i}` }),
    );

    expect(createLuckySeed({ gameId: "dsr", key: "lucky0" })).toBe(seeds[0]);
    expect(new Set(seeds.map((s) => s.split("-")[2])).size).toBeGreaterThan(20);
    for (const seed of seeds) {
      const { categories } = parseSeed(seed).preferences;
      expect(Object.values(categories)).toContain(true);
      expect(() => generateRun(seed)).not.toThrow();
    }
  });

  it("exposes display names for the ids in a run", () => {
    const catalog = getGameCatalog("dsr");
    const run = generateRun(createSeed({ gameId: "dsr", preferences, key: "names" }));

    expect(catalog.classes).toHaveLength(10);
    expect(catalog.classes.map((c) => c.id)).toContain(run.startingClass);
  });
});
