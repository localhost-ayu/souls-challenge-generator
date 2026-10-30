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
import {
  ATTRIBUTES,
  dsrConstraints,
  LEVEL_CAPS,
} from "./constraints";
import { dsrData } from "./dataset";
import type { StartingClass, Weapon } from "./schema";

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
  "level-cap",
  "single-stat",
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

/**
 * Levels needed per attribute to wield a weapon two-handed, counted one
 * level at a time so it does not share the resolver's arithmetic.
 */
function levelDeficits(startingClass: StartingClass, weapon: Weapon) {
  const { attributes: base } = startingClass;
  const { requirements } = weapon;
  let str = base.str;
  while (Math.floor(str * 1.5) < requirements.str) str++;
  return {
    str: str - base.str,
    dex: Math.max(0, requirements.dex - base.dex),
    int: Math.max(0, requirements.int - base.int),
    fai: Math.max(0, requirements.fai - base.fai),
  };
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
  const maxLevel = paramsOf("level-cap")?.maxLevel;
  const stat = paramsOf("single-stat")?.stat;
  expect(maxLevel !== undefined).toBe(has("level-cap"));
  expect(stat !== undefined).toBe(has("single-stat"));
  if (stat !== undefined) expect(ATTRIBUTES).toContain(stat);
  if (maxLevel !== undefined) {
    expect(LEVEL_CAPS).toContain(maxLevel);
    expect(maxLevel).toBeGreaterThan(startingClass!.soulLevel);
  }

  const frozen = has("sl1") || has("no-spending-souls");
  const reachable = (w: Weapon) => {
    const deficits = Object.entries(levelDeficits(startingClass!, w)).filter(
      ([, levels]) => levels > 0,
    );
    if (frozen) return deficits.length === 0;
    if (stat !== undefined && deficits.some(([name]) => name !== stat)) return false;
    const total = deficits.reduce((sum, [, levels]) => sum + levels, 0);
    return maxLevel === undefined || total <= Number(maxLevel) - startingClass!.soulLevel;
  };
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
      reachable(w) &&
      (!(has("no-buying") || has("no-spending-souls")) ||
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
    expect(generateRun("dsr-4-68u-praisethesun")).toMatchInlineSnapshot(`
      {
        "constraints": [
          {
            "id": "no-blocking",
          },
          {
            "id": "no-estus",
          },
          {
            "id": "tail-weapons-only",
          },
          {
            "id": "upgrade-cap",
            "params": {
              "upgradeCap": 5,
            },
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
        "rulesetVersion": 4,
        "seed": "dsr-4-68u-praisethesun",
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
