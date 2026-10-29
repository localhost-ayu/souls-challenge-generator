import { pick, shuffle } from "../../core/rng";
import type {
  ConstraintDefinition,
  GenerationContext,
  Loadout,
} from "../../core/types";
import type {
  ArmorSet,
  StartingClass,
  Weapon,
  WeaponCategory,
} from "./schema";

export interface DsrPools {
  classes: readonly StartingClass[];
  /** Candidates for the run's main weapon. */
  weapons: readonly Weapon[];
  /** Candidates for cosplay. */
  armorSets: readonly ArmorSet[];
}

const MAGIC_CATEGORIES: ReadonlySet<WeaponCategory> = new Set([
  "catalyst",
  "talisman",
  "pyromancy-flame",
]);

const BOW_CATEGORIES: ReadonlySet<WeaponCategory> = new Set(["bow", "greatbow"]);

/**
 * Whether a class meets a weapon's requirements with its base attributes.
 * Wielding with both hands counts Strength as 1.5×, as in the game.
 */
export function canWieldAtBaseStats(
  startingClass: StartingClass,
  weapon: Weapon,
): boolean {
  const { attributes } = startingClass;
  const { requirements } = weapon;
  return (
    Math.floor(attributes.str * 1.5) >= requirements.str &&
    attributes.dex >= requirements.dex &&
    attributes.int >= requirements.int &&
    attributes.fai >= requirements.fai
  );
}

export const dsrConstraints: readonly ConstraintDefinition<DsrPools>[] = [
  { id: "sl1", category: "level", difficulty: 3 },
  {
    id: "no-armor",
    category: "equipment",
    difficulty: 1,
    conflictsWith: ["cosplay"],
  },
  { id: "no-shield", category: "equipment", difficulty: 1 },
  { id: "no-rolling", category: "movement", difficulty: 2 },
  { id: "no-estus", category: "resource", difficulty: 3 },
  // Bonfires may be lit (to unlock warps) but never rested at.
  { id: "no-bonfires", category: "resource", difficulty: 3 },
  {
    id: "no-magic",
    category: "style",
    difficulty: 1,
    narrow: (pools) => ({
      ...pools,
      weapons: pools.weapons.filter((w) => !MAGIC_CATEGORIES.has(w.category)),
    }),
  },
  {
    id: "bow-only",
    category: "equipment",
    difficulty: 3,
    exclusiveGroup: "weapon-rule",
    narrow: (pools) => ({
      ...pools,
      weapons: pools.weapons.filter((w) => BOW_CATEGORIES.has(w.category)),
    }),
  },
  {
    id: "weapon-category",
    category: "equipment",
    difficulty: 1,
    exclusiveGroup: "weapon-rule",
  },
  {
    id: "specific-weapon",
    category: "equipment",
    difficulty: 2,
    exclusiveGroup: "weapon-rule",
  },
  {
    id: "cosplay",
    category: "style",
    difficulty: 1,
  },
  {
    id: "naked-start",
    category: "style",
    difficulty: 2,
    narrow: (pools) => ({
      ...pools,
      classes: pools.classes.filter((c) => c.id === "deprived"),
    }),
  },
];

/**
 * Tries classes in random order and returns the first one for which every
 * selected rule can be met. Under SL1 only weapons usable at base stats
 * count, and a class with no usable weapon at all is never picked.
 */
export function resolveDsrLoadout(
  pools: DsrPools,
  ctx: GenerationContext,
): Loadout | null {
  const has = (id: string) => ctx.constraints.has(id);

  if (has("cosplay") && pools.armorSets.length === 0) return null;

  for (const startingClass of shuffle(ctx.rng, pools.classes)) {
    const usable = has("sl1")
      ? pools.weapons.filter((w) => canWieldAtBaseStats(startingClass, w))
      : pools.weapons;
    if (usable.length === 0) continue;

    const loadout: Loadout = { startingClass: startingClass.id };
    if (has("specific-weapon")) {
      loadout.weapon = pick(ctx.rng, usable).id;
    }
    if (has("weapon-category")) {
      const categories = [...new Set(usable.map((w) => w.category))];
      loadout.weaponCategory = pick(ctx.rng, categories);
    }
    if (has("cosplay")) {
      loadout.armorSet = pick(ctx.rng, pools.armorSets).id;
    }
    return loadout;
  }

  return null;
}
