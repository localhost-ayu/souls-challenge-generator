import { describe, expect, it } from "vitest";
import type { Preferences } from "../../core/preferences";
import { isCompatible } from "../../core/compatibility";
import { createRng } from "../../core/rng";
import type { GenerationContext, Loadout } from "../../core/types";
import {
  ATTRIBUTES,
  canWieldAtBaseStats,
  dsrConstraints,
  levelsToWield,
} from "./constraints";
import { dsrData } from "./dataset";
import { dsrModule } from "./index";

const preferences: Preferences = {
  difficulty: "chosen",
  objective: "all-bosses",
  includeDlc: false,
  houseRules: { buffs: true, summons: false, glitches: false },
  categories: {
    level: true,
    equipment: true,
    movement: true,
    combat: true,
    resource: true,
    style: true,
    absurd: true,
  },
};

const classById = (id: string) => dsrData.classes.find((c) => c.id === id)!;
const weaponById = (id: string) => dsrData.weapons.find((w) => w.id === id)!;
const armorSetById = (id: string) => dsrData.armorSets.find((s) => s.id === id);

/** Runs narrow + resolve for a forced set of constraints. */
function resolveWith(
  ids: string[],
  seed: number,
  prefs = preferences,
): Loadout | null {
  const ctx: GenerationContext = {
    rng: createRng(seed),
    preferences: prefs,
    constraints: new Set(ids),
  };
  const pools = dsrConstraints
    .filter((c) => ctx.constraints.has(c.id))
    .reduce((p, c) => c.narrow?.(p, ctx) ?? p, dsrModule.createPools(prefs));
  return dsrModule.resolve(pools, ctx);
}

function resolveMany(ids: string[], prefs = preferences): (Loadout | null)[] {
  return Array.from({ length: 300 }, (_, seed) => resolveWith(ids, seed, prefs));
}

describe("dsr constraint definitions", () => {
  it("have unique ids", () => {
    const ids = dsrConstraints.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only reference existing constraints", () => {
    const ids = new Set(dsrConstraints.map((c) => c.id));
    for (const constraint of dsrConstraints) {
      const refs = [
        ...(constraint.conflictsWith ?? []),
        ...(constraint.requires ?? []),
      ];
      for (const ref of refs) {
        expect(ids, `${constraint.id} -> ${ref}`).toContain(ref);
      }
    }
  });

  it("put both ring rules in the same exclusive group", () => {
    const ringRules = dsrConstraints.filter((c) => c.exclusiveGroup === "ring-rule");
    expect(ringRules.map((c) => c.id).sort()).toEqual(["no-rings", "one-ring"]);
  });

  it("never pair Estus limits with rules that make them pointless", () => {
    for (const id of ["no-estus-upgrades", "no-kindling"]) {
      for (const other of ["no-estus", "no-bonfires"]) {
        const a = dsrConstraints.find((c) => c.id === id)!;
        const b = dsrConstraints.find((c) => c.id === other)!;
        expect(isCompatible([a, b]), `${id} + ${other}`).toBe(false);
      }
    }
  });

  it("put every weapon rule in the same exclusive group", () => {
    const weaponRules = dsrConstraints.filter(
      (c) => c.exclusiveGroup === "weapon-rule",
    );
    expect(weaponRules.map((c) => c.id).sort()).toEqual([
      "boss-weapons-only",
      "bow-only",
      "enemy-drops-only",
      "region-weapons",
      "specific-weapon",
      "spell-school-only",
      "consumables-only",
      "firebombs-only",
      "poison-only",
      "shield-only",
      "tail-weapons-only",
      "thorns-only",
      "throwing-knives-only",
      "weapon-category",
      "weapon-roulette",
    ].sort());
  });
});

describe("canWieldAtBaseStats", () => {
  it("counts strength as 1.5x for two-handing", () => {
    const can = (classId: string, weaponId: string) =>
      canWieldAtBaseStats(classById(classId), weaponById(weaponId));

    // Deprived: 11 STR -> 16 two-handed, enough for the Claymore (16).
    expect(can("deprived", "claymore")).toBe(true);
    // Bandit: 14 STR -> 21 two-handed, not enough for the Zweihander (24).
    expect(can("bandit", "zweihander")).toBe(false);
  });

  it("does not stretch dexterity, intelligence or faith", () => {
    const can = (classId: string, weaponId: string) =>
      canWieldAtBaseStats(classById(classId), weaponById(weaponId));

    // Sorcerer has 11 DEX; the Short Bow needs 12.
    expect(can("sorcerer", "short-bow")).toBe(false);
    // Cleric has 14 FAI; the Ivory Talisman needs 16.
    expect(can("cleric", "ivory-talisman")).toBe(false);
  });
});

describe("levelsToWield", () => {
  const all = new Set(ATTRIBUTES);
  const levels = (classId: string, weaponId: string, raisable = all) =>
    levelsToWield(classById(classId), weaponById(weaponId), raisable);

  it("counts the levels a class still needs, two-handing for strength", () => {
    // Bandit: 14 STR, 9 DEX. The Butcher Knife needs 24 STR, i.e. 16 two-handed.
    expect(levels("bandit", "butcher-knife")).toBe(2);
    // The Zweihander also needs 10 DEX: one more level.
    expect(levels("bandit", "zweihander")).toBe(3);
    expect(levels("deprived", "claymore")).toBe(0);
  });

  it("is infinite when a needed attribute may not be raised", () => {
    expect(levels("bandit", "zweihander", new Set(["str"]))).toBe(Infinity);
    expect(levels("bandit", "butcher-knife", new Set(["str"]))).toBe(2);
  });
});

describe("level rules", () => {
  it("never combine with sl1 or with each other where redundant", () => {
    const byId = (id: string) => dsrConstraints.find((c) => c.id === id)!;
    const pairs = [
      ["sl1", "level-cap"],
      ["sl1", "single-stat"],
      ["sl1", "no-vitality"],
      ["no-vitality", "single-stat"],
      ["no-spending-souls", "sl1"],
      ["no-spending-souls", "no-buying"],
      ["no-spending-souls", "upgrade-cap"],
    ];
    for (const [a, b] of pairs) {
      expect(isCompatible([byId(a!), byId(b!)]), `${a} + ${b}`).toBe(false);
    }
    expect(isCompatible([byId("level-cap"), byId("single-stat")])).toBe(true);
  });
});

describe("resolveDsrLoadout", () => {
  it("only picks classes that can use a bow at base stats for sl1 + bow-only", () => {
    // Only classes with at least 12 DEX (the Short Bow) qualify.
    const loadouts = resolveMany(["sl1", "bow-only"]);
    const classes = new Set(loadouts.map((l) => l?.startingClass));

    expect([...classes].sort()).toEqual(["hunter", "thief", "wanderer", "warrior"]);
  });

  it("finds no loadout for sl1 + bow-only + naked-start", () => {
    // The Deprived has 11 DEX and every bow needs at least 12.
    const loadouts = resolveMany(["sl1", "bow-only", "naked-start"]);

    expect(loadouts.every((l) => l === null)).toBe(true);
  });

  it("always starts as the Deprived with naked-start", () => {
    for (const loadout of resolveMany(["naked-start"])) {
      expect(loadout?.startingClass).toBe("deprived");
    }
  });

  it("picks a weapon the class can use under sl1", () => {
    for (const loadout of resolveMany(["sl1", "specific-weapon"])) {
      const weaponId = loadout?.params["specific-weapon"]?.weapon;
      expect(weaponId).toBeDefined();
      const weapon = weaponById(String(weaponId));
      expect(canWieldAtBaseStats(classById(loadout!.startingClass), weapon)).toBe(true);
    }
  });

  it("never picks a magic category with no-magic", () => {
    for (const loadout of resolveMany(["no-magic", "weapon-category"])) {
      expect(["catalyst", "talisman", "pyromancy-flame"]).not.toContain(
        loadout?.params["weapon-category"]?.weaponCategory,
      );
    }
  });

  it("never picks missable or disabled dlc items", () => {
    for (const loadout of resolveMany(["specific-weapon", "cosplay"])) {
      const weapon = weaponById(String(loadout!.params["specific-weapon"]!.weapon));
      const armorSet = armorSetById(String(loadout!.params.cosplay!.armorSet))!;
      expect(weapon.missable || weapon.dlc).toBe(false);
      expect(armorSet.missable || armorSet.dlc).toBe(false);
    }
  });

  it("can pick dlc items when dlc is enabled", () => {
    const withDlc = { ...preferences, includeDlc: true };
    const dlcPicked = resolveMany(["cosplay"], withDlc).some(
      (l) => armorSetById(String(l?.params.cosplay?.armorSet))?.dlc,
    );
    expect(dlcPicked).toBe(true);
  });

  it("never needs a purchase without buying, unless the class starts with it", () => {
    for (const loadout of resolveMany(["no-buying", "specific-weapon"])) {
      const weapon = weaponById(String(loadout!.params["specific-weapon"]!.weapon));
      const owned = classById(loadout!.startingClass).startingEquipment.weapons;
      const free = weapon.sources.some((source) => source !== "merchant");
      expect(free || owned.includes(weapon.id), weapon.id).toBe(true);
    }
  });

  it("draws a region with weapons obtainable there", () => {
    for (const loadout of resolveMany(["region-weapons", "sl1"])) {
      const region = loadout!.params["region-weapons"]!.region;
      const startingClass = classById(loadout!.startingClass);
      const local = dsrData.weapons.filter(
        (w) =>
          w.region === region &&
          !w.dlc &&
          w.sources.some((s) => s !== "boss-soul" && s !== "tail-cut" && s !== "npc") &&
          canWieldAtBaseStats(startingClass, w),
      );
      expect(local.length, String(region)).toBeGreaterThan(0);
    }
  });

  it("only caps upgrades below what the drawn weapon can reach", () => {
    for (const loadout of resolveMany(["upgrade-cap", "specific-weapon"])) {
      const weapon = weaponById(String(loadout!.params["specific-weapon"]!.weapon));
      expect(loadout!.params["upgrade-cap"]!.upgradeCap).toBeLessThan(weapon.maxUpgrade);
    }
  });

  it("never makes a class without spell slots cast under sl1", () => {
    // Warriors and Bandits start with 8 Attunement: not a single slot.
    for (const loadout of resolveMany(["sl1", "spell-school-only"])) {
      expect(["warrior", "bandit"]).not.toContain(loadout?.startingClass);
    }
  });

  it("only draws miracles under sl1 for classes that can cast one", () => {
    // The cheapest damaging miracle without a covenant, Emit Force, needs 18 FAI.
    for (const loadout of resolveMany(["sl1", "spell-school-only"])) {
      expect(loadout?.params["spell-school-only"]?.school).not.toBe("miracle");
    }
  });

  it("lists distinct, non-missable weapons the class can use for a roulette", () => {
    for (const loadout of resolveMany(["weapon-roulette", "sl1"])) {
      const weapons = loadout!.params["weapon-roulette"]!.weapons as readonly string[];
      expect(new Set(weapons).size).toBe(weapons.length);
      expect(weapons.length).toBeGreaterThanOrEqual(2);
      for (const id of weapons) {
        const weapon = weaponById(id);
        expect(weapon.missable, id).toBe(false);
        expect(canWieldAtBaseStats(classById(loadout!.startingClass), weapon), id).toBe(true);
      }
    }
  });

  it("never pairs the Armor of Thorns with rules that keep it from rolling or being worn", () => {
    const byId = (id: string) => dsrConstraints.find((c) => c.id === id)!;
    for (const other of ["no-rolling", "no-armor", "cosplay"]) {
      expect(isCompatible([byId("thorns-only"), byId(other)]), other).toBe(false);
    }
  });

  it("finds tail weapons usable at sl1, even for the Deprived", () => {
    // The Drake Sword needs 16 STR (two-handed) and 10 DEX.
    expect(resolveWith(["sl1", "tail-weapons-only", "naked-start"], 1)).not.toBeNull();
  });

  it("only draws parameters for the rules that need them", () => {
    expect(resolveWith(["no-rolling"], 1)).toEqual({
      startingClass: expect.any(String),
      params: {},
    });
  });
});
