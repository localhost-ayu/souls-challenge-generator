import { describe, expect, it } from "vitest";
import {
  createSeed,
  generateRun,
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
  categories: {
    level: true,
    equipment: true,
    movement: true,
    resource: true,
    style: true,
  },
};

describe("engine public api", () => {
  it("creates a seed for the current ruleset and generates its run", () => {
    const seed = createSeed({ gameId: "dsr", preferences, key: "praisethesun" });
    const run = generateRun(seed);

    expect(seed).toMatch(/^dsr-1-/);
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
    expect(() => generateRun("dsr-99-e6-abc")).toThrow(UnsupportedRulesetError);

    const noCategories = createSeed({
      gameId: "dsr",
      key: "abc",
      preferences: {
        ...preferences,
        categories: {
          level: false,
          equipment: false,
          movement: false,
          resource: false,
          style: false,
        },
      },
    });
    expect(() => generateRun(noCategories)).toThrow(GenerationError);
  });
});
