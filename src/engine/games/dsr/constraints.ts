import { pick, shuffle } from "../../core/rng";
import type {
  ConstraintDefinition,
  ConstraintParams,
  GenerationContext,
  Loadout,
} from "../../core/types";
import type {
  ArmorSet,
  Region,
  StartingClass,
  Weapon,
  WeaponCategory,
  WeaponSource,
} from "./schema";

export interface DsrPools {
  classes: readonly StartingClass[];
  /**
   * Weapons the run may rely on. Missable ones are included: a fresh run
   * has not lost them yet, and rules such as "boss weapons only" need them.
   * Picking one specific weapon still avoids them.
   */
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

/** Ways of getting a weapon that tie it to the place where it is obtained. */
const REGIONAL_SOURCES: ReadonlySet<WeaponSource> = new Set([
  "found",
  "merchant",
  "enemy-drop",
]);

/** Ceilings an upgrade cap can impose; +15 is no cap at all. */
export const UPGRADE_CAPS = [0, 5, 10] as const;

function onlyFrom(source: WeaponSource) {
  return (pools: DsrPools): DsrPools => ({
    ...pools,
    weapons: pools.weapons.filter((w) => w.sources.includes(source)),
  });
}

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
  {
    id: "no-rings",
    category: "equipment",
    difficulty: 1,
    exclusiveGroup: "ring-rule",
  },
  {
    id: "one-ring",
    category: "equipment",
    difficulty: 1,
    exclusiveGroup: "ring-rule",
  },
  { id: "no-rolling", category: "movement", difficulty: 2 },
  { id: "no-sprinting", category: "movement", difficulty: 1 },
  { id: "no-jumping", category: "movement", difficulty: 1 },
  { id: "no-blocking", category: "combat", difficulty: 1 },
  { id: "no-parrying", category: "combat", difficulty: 1 },
  // A boss hit loses the attempt: the player dies or quits and refights it.
  { id: "boss-no-hit", category: "combat", difficulty: 3 },
  {
    id: "no-estus",
    category: "resource",
    difficulty: 3,
    // Without Estus, limits on upgrading it change nothing.
    conflictsWith: ["no-estus-upgrades", "no-kindling"],
  },
  // Bonfires may be lit (to unlock warps) but never rested at.
  {
    id: "no-bonfires",
    category: "resource",
    difficulty: 3,
    // Kindling and reinforcing Estus both happen while resting.
    conflictsWith: ["no-estus-upgrades", "no-kindling"],
  },
  { id: "no-estus-upgrades", category: "resource", difficulty: 1 },
  { id: "no-kindling", category: "resource", difficulty: 1 },
  { id: "permadeath", category: "resource", difficulty: 3 },
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
    id: "boss-weapons-only",
    category: "equipment",
    difficulty: 2,
    exclusiveGroup: "weapon-rule",
    narrow: onlyFrom("boss-soul"),
  },
  {
    id: "tail-weapons-only",
    category: "equipment",
    difficulty: 2,
    exclusiveGroup: "weapon-rule",
    narrow: onlyFrom("tail-cut"),
  },
  {
    id: "enemy-drops-only",
    category: "equipment",
    difficulty: 1,
    exclusiveGroup: "weapon-rule",
    narrow: onlyFrom("enemy-drop"),
  },
  {
    id: "region-weapons",
    category: "equipment",
    difficulty: 1,
    exclusiveGroup: "weapon-rule",
  },
  { id: "upgrade-cap", category: "equipment", difficulty: 2 },
  // Starting equipment counts as owned, not bought.
  { id: "no-buying", category: "resource", difficulty: 2 },
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
 * count, without buying only weapons the class can get for free, and a class
 * left with no usable weapon at all is never picked.
 */
export function resolveDsrLoadout(
  pools: DsrPools,
  ctx: GenerationContext,
): Loadout | null {
  const has = (id: string) => ctx.constraints.has(id);

  if (has("cosplay") && pools.armorSets.length === 0) return null;

  for (const startingClass of shuffle(ctx.rng, pools.classes)) {
    let usable = pools.weapons;
    if (has("sl1")) {
      usable = usable.filter((w) => canWieldAtBaseStats(startingClass, w));
    }
    if (has("no-buying")) {
      const owned = new Set(startingClass.startingEquipment.weapons);
      usable = usable.filter(
        (w) => owned.has(w.id) || w.sources.some((source) => source !== "merchant"),
      );
    }

    const params: Record<string, ConstraintParams> = {};
    if (has("region-weapons")) {
      const regional = usable.filter(
        (w) => w.region && w.sources.some((source) => REGIONAL_SOURCES.has(source)),
      );
      const regions = [...new Set(regional.map((w) => w.region as Region))];
      if (regions.length === 0) continue;
      const region = pick(ctx.rng, regions);
      usable = regional.filter((w) => w.region === region);
      params["region-weapons"] = { region };
    }
    if (usable.length === 0) continue;

    // A single drawn weapon must not be one the player could lose for good.
    let candidates = usable.filter((w) => !w.missable);
    if (has("upgrade-cap")) candidates = candidates.filter((w) => w.maxUpgrade > 0);

    let ruleWeapons = usable;
    if (has("specific-weapon")) {
      if (candidates.length === 0) continue;
      const weapon = pick(ctx.rng, candidates);
      params["specific-weapon"] = { weapon: weapon.id };
      ruleWeapons = [weapon];
    }
    if (has("weapon-category")) {
      const categories = [...new Set(candidates.map((w) => w.category))];
      if (categories.length === 0) continue;
      const weaponCategory = pick(ctx.rng, categories);
      params["weapon-category"] = { weaponCategory };
      ruleWeapons = usable.filter((w) => w.category === weaponCategory);
    }
    if (has("upgrade-cap")) {
      // Only caps below what the allowed weapons can reach change anything.
      const ceiling = Math.max(...ruleWeapons.map((w) => w.maxUpgrade));
      const caps = UPGRADE_CAPS.filter((cap) => cap < ceiling);
      if (caps.length === 0) continue;
      params["upgrade-cap"] = { upgradeCap: pick(ctx.rng, caps) };
    }
    if (has("cosplay")) {
      params.cosplay = { armorSet: pick(ctx.rng, pools.armorSets).id };
    }
    return { startingClass: startingClass.id, params };
  }

  return null;
}
