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
const armorSetsById = new Map(dsrData.armorSets.map((s) => [s.id, s]));
const MAGIC = ["catalyst", "talisman", "pyromancy-flame"];
const PARAMETERIZED = [
  "specific-weapon",
  "weapon-category",
  "cosplay",
  "region-weapons",
  "upgrade-cap",
];
const SOURCE_RULES: Record<string, string> = {
  "boss-weapons-only": "boss-soul",
  "tail-weapons-only": "tail-cut",
  "enemy-drops-only": "enemy-drop",
};

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
  const region = paramsOf("region-weapons")?.region;
  const upgradeCap = paramsOf("upgrade-cap")?.upgradeCap;
  expect(weaponId !== undefined).toBe(has("specific-weapon"));
  expect(weaponCategory !== undefined).toBe(has("weapon-category"));
  expect(armorSetId !== undefined).toBe(has("cosplay"));
  expect(region !== undefined).toBe(has("region-weapons"));
  expect(upgradeCap !== undefined).toBe(has("upgrade-cap"));

  // Rebuilt independently of the resolver: the weapons this run allows.
  const sourceRule = Object.keys(SOURCE_RULES).find(has);
  const allowed = dsrData.weapons.filter(
    (w) =>
      (preferences.includeDlc || !w.dlc) &&
      (!has("sl1") || canWieldAtBaseStats(startingClass!, w)) &&
      (!has("no-buying") ||
        startingClass!.startingEquipment.weapons.includes(w.id) ||
        w.sources.some((s) => s !== "merchant")) &&
      (!has("no-magic") || !MAGIC.includes(w.category)) &&
      (!has("bow-only") || w.category === "bow" || w.category === "greatbow") &&
      (!sourceRule || w.sources.includes(SOURCE_RULES[sourceRule] as never)) &&
      (region === undefined ||
        (w.region === region &&
          w.sources.some((s) => ["found", "merchant", "enemy-drop"].includes(s)))),
  );
  expect(allowed.length).toBeGreaterThan(0);

  let ruleWeapons = allowed;
  if (weaponId !== undefined) {
    const weapon = allowed.find((w) => w.id === weaponId);
    expect(weapon, String(weaponId)).toBeDefined();
    expect(weapon!.missable).toBe(false);
    ruleWeapons = [weapon!];
  }

  if (weaponCategory !== undefined) {
    ruleWeapons = allowed.filter((w) => w.category === weaponCategory);
    expect(ruleWeapons.some((w) => !w.missable)).toBe(true);
  }

  if (upgradeCap !== undefined) {
    expect(upgradeCap).toBeLessThan(Math.max(...ruleWeapons.map((w) => w.maxUpgrade)));
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
    expect(generateRun("dsr-3-68u-praisethesun")).toMatchInlineSnapshot(`
      {
        "constraints": [
          {
            "id": "permadeath",
          },
          {
            "id": "no-magic",
          },
          {
            "id": "boss-weapons-only",
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
        "rulesetVersion": 3,
        "seed": "dsr-3-68u-praisethesun",
        "startingClass": "thief",
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
