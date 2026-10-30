import { describe, expect, it } from "vitest";
import { isCompatible } from "../../core/compatibility";
import { DIFFICULTY_PROFILES } from "../../core/generator";
import {
  DIFFICULTIES,
  randomPreferences as randomCorePreferences,
  type Preferences,
} from "../../core/preferences";
import { createRng, pick, type Rng } from "../../core/rng";
import { seedKeyFromNumber } from "../../core/seed";
import type { ChallengeRun } from "../../core/types";
import { createSeed, generateRun } from "../../index";
import { canWieldAtBaseStats, dsrConstraints } from "./constraints";
import { dsrData } from "./dataset";

const SEEDS_PER_DIFFICULTY = 5_000;

const constraintsById = new Map(dsrConstraints.map((c) => [c.id, c]));
const classesById = new Map(dsrData.classes.map((c) => [c.id, c]));
const weaponsById = new Map(dsrData.weapons.map((w) => [w.id, w]));
const armorSetsById = new Map(dsrData.armorSets.map((s) => [s.id, s]));
const MAGIC = ["catalyst", "talisman", "pyromancy-flame"];
const PARAMETERIZED = ["specific-weapon", "weapon-category", "cosplay"];

function randomPreferences(
  rng: Rng,
  difficulty: Preferences["difficulty"],
): Preferences {
  return { ...randomCorePreferences(rng), difficulty };
}

function expectValidRun(run: ChallengeRun, preferences: Preferences): void {
  const ids = run.constraints.map((c) => c.id);
  const has = (id: string) => ids.includes(id);
  const paramsOf = (id: string) => run.constraints.find((c) => c.id === id)?.params;
  const definitions = ids.map((id) => constraintsById.get(id));

  // Only known ids, all compatible, all from allowed categories.
  expect(definitions.every((d) => d !== undefined)).toBe(true);
  const known = definitions.filter((d) => d !== undefined);
  expect(isCompatible(known)).toBe(true);
  expect(known.every((d) => preferences.categories[d.category])).toBe(true);
  expect(run.constraints.length).toBeGreaterThan(0);
  expect(run.constraints.length).toBeLessThanOrEqual(
    DIFFICULTY_PROFILES[preferences.difficulty].maxConstraints,
  );

  const startingClass = classesById.get(run.startingClass);
  expect(startingClass).toBeDefined();
  expect(run.difficulty).toBe(preferences.difficulty);
  expect(run.objective).toBe(preferences.objective);
  expect(run.includeDlc).toBe(preferences.includeDlc);
  expect(run.houseRules).toEqual(preferences.houseRules);

  // Only rules that draw something carry parameters.
  const withParams = run.constraints.filter((c) => c.params).map((c) => c.id);
  expect(withParams.every((id) => PARAMETERIZED.includes(id))).toBe(true);
  const weaponId = paramsOf("specific-weapon")?.weapon;
  const weaponCategory = paramsOf("weapon-category")?.weaponCategory;
  const armorSetId = paramsOf("cosplay")?.armorSet;
  expect(weaponId !== undefined).toBe(has("specific-weapon"));
  expect(weaponCategory !== undefined).toBe(has("weapon-category"));
  expect(armorSetId !== undefined).toBe(has("cosplay"));

  if (weaponId !== undefined) {
    const weapon = weaponsById.get(String(weaponId));
    expect(weapon).toBeDefined();
    expect(weapon!.missable).toBe(false);
    if (!preferences.includeDlc) expect(weapon!.dlc).toBe(false);
    if (has("sl1")) expect(canWieldAtBaseStats(startingClass!, weapon!)).toBe(true);
    if (has("no-magic")) expect(MAGIC).not.toContain(weapon!.category);
  }

  if (weaponCategory !== undefined) {
    const usable = dsrData.weapons.filter(
      (w) =>
        w.category === weaponCategory &&
        !w.missable &&
        (preferences.includeDlc || !w.dlc) &&
        (!has("sl1") || canWieldAtBaseStats(startingClass!, w)),
    );
    expect(usable.length).toBeGreaterThan(0);
    if (has("no-magic")) expect(MAGIC).not.toContain(weaponCategory);
  }

  if (has("bow-only") && has("sl1")) {
    const usableBow = dsrData.weapons.some(
      (w) =>
        (w.category === "bow" || w.category === "greatbow") &&
        !w.missable &&
        (preferences.includeDlc || !w.dlc) &&
        canWieldAtBaseStats(startingClass!, w),
    );
    expect(usableBow).toBe(true);
  }

  if (armorSetId !== undefined) {
    const armorSet = armorSetsById.get(String(armorSetId));
    expect(armorSet).toBeDefined();
    expect(armorSet!.missable).toBe(false);
    if (!preferences.includeDlc) expect(armorSet!.dlc).toBe(false);
  }

  if (has("naked-start")) expect(run.startingClass).toBe("deprived");
}

describe.each(DIFFICULTIES)("generated %s runs", (difficulty) => {
  it(`hold every invariant across ${SEEDS_PER_DIFFICULTY} random seeds`, () => {
    const rng = createRng(difficulty.length * 7919);

    for (let i = 0; i < SEEDS_PER_DIFFICULTY; i++) {
      const preferences = randomPreferences(rng, difficulty);
      const seed = createSeed({
        gameId: "dsr",
        preferences,
        key: seedKeyFromNumber(rng.nextUint32()),
      });

      const run = generateRun(seed);

      expectValidRun(run, preferences);
      expect(generateRun(seed)).toEqual(run);
    }
  });

  it("stays within the constraint count range when every category is allowed", () => {
    const rng = createRng(difficulty.length * 104729);
    const { minConstraints, maxConstraints } = DIFFICULTY_PROFILES[difficulty];
    const preferences: Preferences = {
      difficulty,
      objective: "all-bosses",
      includeDlc: true,
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

    for (let i = 0; i < 1_000; i++) {
      const seed = createSeed({
        gameId: "dsr",
        preferences,
        key: seedKeyFromNumber(rng.nextUint32()),
      });
      const { constraints } = generateRun(seed);

      expect(constraints.length).toBeGreaterThanOrEqual(minConstraints);
      expect(constraints.length).toBeLessThanOrEqual(maxConstraints);
    }
  });
});

describe("generated runs", () => {
  it("are locked for a known seed", () => {
    // Regression guard: if this changes, the ruleset version must be bumped.
    expect(generateRun("dsr-2-68u-praisethesun")).toMatchInlineSnapshot(`
      {
        "constraints": [
          {
            "id": "no-blocking",
          },
          {
            "id": "boss-no-hit",
          },
          {
            "id": "no-estus",
          },
          {
            "id": "bow-only",
          },
        ],
        "difficulty": "chosen",
        "gameId": "dsr",
        "houseRules": {
          "buffs": true,
          "glitches": false,
          "summons": false,
        },
        "includeDlc": true,
        "objective": "all-bosses",
        "rulesetVersion": 2,
        "seed": "dsr-2-68u-praisethesun",
        "startingClass": "sorcerer",
      }
    `);
  });

  it("eventually use every constraint", () => {
    const rng = createRng(1);
    const seen = new Set<string>();
    for (let i = 0; i < 2_000; i++) {
      const preferences = randomPreferences(rng, pick(rng, DIFFICULTIES));
      const seed = createSeed({
        gameId: "dsr",
        preferences,
        key: seedKeyFromNumber(rng.nextUint32()),
      });
      generateRun(seed).constraints.forEach(({ id }) => seen.add(id));
    }

    expect([...seen].sort()).toEqual(dsrConstraints.map((c) => c.id).sort());
  });
});
