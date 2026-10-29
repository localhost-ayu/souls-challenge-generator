import { describe, expect, it } from "vitest";
import type { Preferences } from "../../core/preferences";
import { createRng } from "../../core/rng";
import type { GenerationContext, Loadout } from "../../core/types";
import { canWieldAtBaseStats, dsrConstraints } from "./constraints";
import { dsrData } from "./dataset";
import { dsrModule } from "./index";

const preferences: Preferences = {
  difficulty: "chosen",
  objective: "all-bosses",
  includeDlc: false,
  categories: {
    level: true,
    equipment: true,
    movement: true,
    resource: true,
    style: true,
  },
};

const classById = (id: string) => dsrData.classes.find((c) => c.id === id)!;
const weaponById = (id: string) => dsrData.weapons.find((w) => w.id === id)!;

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

  it("put every weapon rule in the same exclusive group", () => {
    const weaponRules = dsrConstraints.filter(
      (c) => c.exclusiveGroup === "weapon-rule",
    );
    expect(weaponRules.map((c) => c.id).sort()).toEqual([
      "bow-only",
      "specific-weapon",
      "weapon-category",
    ]);
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
      expect(loadout?.weapon).toBeDefined();
      const weapon = weaponById(loadout!.weapon!);
      expect(canWieldAtBaseStats(classById(loadout!.startingClass), weapon)).toBe(true);
    }
  });

  it("never picks a magic category with no-magic", () => {
    for (const loadout of resolveMany(["no-magic", "weapon-category"])) {
      expect(["catalyst", "talisman", "pyromancy-flame"]).not.toContain(
        loadout?.weaponCategory,
      );
    }
  });

  it("never picks missable or disabled dlc items", () => {
    for (const loadout of resolveMany(["specific-weapon", "cosplay"])) {
      const weapon = weaponById(loadout!.weapon!);
      const armorSet = dsrData.armorSets.find((s) => s.id === loadout!.armorSet)!;
      expect(weapon.missable || weapon.dlc).toBe(false);
      expect(armorSet.missable || armorSet.dlc).toBe(false);
    }
  });

  it("can pick dlc items when dlc is enabled", () => {
    const withDlc = { ...preferences, includeDlc: true };
    const dlcPicked = resolveMany(["cosplay"], withDlc).some(
      (l) => dsrData.armorSets.find((s) => s.id === l?.armorSet)?.dlc,
    );
    expect(dlcPicked).toBe(true);
  });

  it("only fills the fields the selected rules ask for", () => {
    expect(resolveWith(["no-rolling"], 1)).toEqual({
      startingClass: expect.any(String),
    });
  });
});
