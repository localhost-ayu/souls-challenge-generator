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
  Spell,
  SpellSchool,
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
  /** Spells the run may rely on. */
  spells: readonly Spell[];
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

/** Soul level ceilings; all above every class's starting level (at most 6). */
export const LEVEL_CAPS = [10, 20, 30] as const;

export const ATTRIBUTES = ["vit", "att", "end", "str", "dex", "res", "int", "fai"] as const;
export type Attribute = (typeof ATTRIBUTES)[number];

type Requirements = Partial<Record<Attribute, number>>;

/** The weapon category that casts each school (a talisman casts miracles). */
const CASTING_TOOLS: Readonly<Record<SpellSchool, WeaponCategory>> = {
  sorcery: "catalyst",
  miracle: "talisman",
  pyromancy: "pyromancy-flame",
};

export const SPELL_SCHOOLS = ["sorcery", "miracle", "pyromancy"] as const satisfies readonly SpellSchool[];

/** Attunement needed for a spell's slots: 10 opens the first, 12 the second. */
const ATTUNEMENT_FOR_SLOTS = { 1: 10, 2: 12 } as const;

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

/**
 * Levels a class must gain to meet some requirements, or Infinity when an
 * attribute outside `raisable` falls short. Strength counts 1.5×, since a
 * weapon can be wielded with both hands.
 */
export function levelsToReach(
  startingClass: StartingClass,
  requirements: Requirements,
  raisable: ReadonlySet<Attribute>,
): number {
  const { attributes } = startingClass;
  let levels = 0;
  for (const stat of ATTRIBUTES) {
    const required = requirements[stat] ?? 0;
    const needed = stat === "str" ? Math.ceil((2 * required) / 3) : required;
    const deficit = Math.max(0, needed - attributes[stat]);
    if (deficit === 0) continue;
    if (!raisable.has(stat)) return Infinity;
    levels += deficit;
  }
  return levels;
}

export function levelsToWield(
  startingClass: StartingClass,
  weapon: Weapon,
  raisable: ReadonlySet<Attribute>,
): number {
  return levelsToReach(startingClass, weapon.requirements, raisable);
}

/** What casting a spell with a given tool asks for, slots included. */
export function castingRequirements(tool: Weapon, spell: Spell): Requirements {
  return {
    ...tool.requirements,
    int: Math.max(tool.requirements.int, spell.requirements.int),
    fai: Math.max(tool.requirements.fai, spell.requirements.fai),
    att: ATTUNEMENT_FOR_SLOTS[spell.slots],
  };
}

const LEVEL_RULES = ["level-cap", "single-stat", "no-vitality"];

/** Weapons in a roulette run, switched after each boss. */
export const ROULETTE_LENGTH = 5;

export const ONE_SHOT_SCOPES = ["bosses", "everything"] as const;

/**
 * Rules where damage comes from items bought from merchants, so they cannot
 * coexist with a ban on shopping, and where weapon upgrades mean nothing.
 */
function itemDamageRule(id: string): ConstraintDefinition<DsrPools> {
  return {
    id,
    category: "absurd",
    difficulty: 3,
    exclusiveGroup: "weapon-rule",
    conflictsWith: ["no-buying", "no-spending-souls", "upgrade-cap"],
  };
}

export const dsrConstraints: readonly ConstraintDefinition<DsrPools>[] = [
  {
    id: "sl1",
    category: "level",
    difficulty: 3,
    // Every other level rule limits leveling that SL1 already forbids.
    conflictsWith: LEVEL_RULES,
  },
  { id: "level-cap", category: "level", difficulty: 2 },
  // The drawn attribute is the only one that may ever be raised.
  { id: "single-stat", category: "level", difficulty: 2 },
  {
    id: "no-vitality",
    category: "level",
    difficulty: 1,
    conflictsWith: ["single-stat"],
  },
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
    id: "no-spending-souls",
    category: "level",
    difficulty: 3,
    // Already rules out leveling, buying and reinforcing.
    conflictsWith: ["sl1", ...LEVEL_RULES, "no-buying", "upgrade-cap"],
  },
  {
    // The drawn school is the only way to deal damage.
    id: "spell-school-only",
    category: "style",
    difficulty: 3,
    exclusiveGroup: "weapon-rule",
    // Spells are mostly bought, and reinforcing a flame costs souls.
    conflictsWith: ["no-magic", "no-buying", "no-spending-souls"],
  },
  {
    // Switch to the next listed weapon after each boss.
    id: "weapon-roulette",
    category: "equipment",
    difficulty: 2,
    exclusiveGroup: "weapon-rule",
  },
  itemDamageRule("consumables-only"),
  itemDamageRule("firebombs-only"),
  itemDamageRule("throwing-knives-only"),
  itemDamageRule("poison-only"),
  {
    // The Armor of Thorns hurts what it rolls into.
    id: "thorns-only",
    category: "absurd",
    difficulty: 3,
    exclusiveGroup: "weapon-rule",
    conflictsWith: ["no-rolling", "no-armor", "cosplay", "upgrade-cap"],
  },
  {
    // Every starting class carries a shield it can use.
    id: "shield-only",
    category: "absurd",
    difficulty: 3,
    exclusiveGroup: "weapon-rule",
    conflictsWith: ["no-shield"],
  },
  // Every kill (of the drawn scope) must come from a single attack input.
  { id: "one-shot", category: "absurd", difficulty: 3 },
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
 * selected rule can be met. Only weapons the class can reach within its
 * level rules count (none at all under SL1), without buying only weapons it
 * can get for free, and a class left with no usable weapon is never picked.
 */
export function resolveDsrLoadout(
  pools: DsrPools,
  ctx: GenerationContext,
): Loadout | null {
  const has = (id: string) => ctx.constraints.has(id);

  if (has("cosplay") && pools.armorSets.length === 0) return null;

  const frozen = has("sl1") || has("no-spending-souls");

  for (const startingClass of shuffle(ctx.rng, pools.classes)) {
    const params: Record<string, ConstraintParams> = {};
    let raisable: ReadonlySet<Attribute> = new Set(frozen ? [] : ATTRIBUTES);
    let budget = Infinity;
    if (has("single-stat")) {
      const stat = pick(ctx.rng, ATTRIBUTES);
      raisable = new Set([stat]);
      params["single-stat"] = { stat };
    }
    if (has("level-cap")) {
      const maxLevel = pick(ctx.rng, LEVEL_CAPS);
      budget = maxLevel - startingClass.soulLevel;
      params["level-cap"] = { maxLevel };
    }

    const reachable = (requirements: Requirements) => {
      const levels = levelsToReach(startingClass, requirements, raisable);
      return Number.isFinite(levels) && levels <= budget;
    };

    let usable = pools.weapons.filter((w) => reachable(w.requirements));
    if (has("no-buying") || has("no-spending-souls")) {
      const owned = new Set(startingClass.startingEquipment.weapons);
      usable = usable.filter(
        (w) => owned.has(w.id) || w.sources.some((source) => source !== "merchant"),
      );
    }

    if (has("spell-school-only")) {
      const castable = (school: SpellSchool) =>
        usable.some(
          (tool) =>
            tool.category === CASTING_TOOLS[school] &&
            pools.spells.some(
              (spell) =>
                spell.school === school &&
                spell.kind === "offensive" &&
                reachable(castingRequirements(tool, spell)),
            ),
        );
      const schools = SPELL_SCHOOLS.filter(castable);
      if (schools.length === 0) continue;
      const school = pick(ctx.rng, schools);
      usable = usable.filter((w) => w.category === CASTING_TOOLS[school]);
      params["spell-school-only"] = { school };
    }
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
    if (has("weapon-roulette")) {
      if (candidates.length < 2) continue;
      const order = shuffle(ctx.rng, candidates).slice(0, ROULETTE_LENGTH);
      params["weapon-roulette"] = { weapons: order.map((w) => w.id) };
      ruleWeapons = order;
    }
    if (has("one-shot")) {
      params["one-shot"] = { scope: pick(ctx.rng, ONE_SHOT_SCOPES) };
    }
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
