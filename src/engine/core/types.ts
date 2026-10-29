import type { Difficulty, Objective, Preferences } from "./preferences";
import type { Rng } from "./rng";

export const GAME_IDS = ["dsr"] as const;
export type GameId = (typeof GAME_IDS)[number];

export const CONSTRAINT_CATEGORIES = [
  "level",
  "equipment",
  "movement",
  "resource",
  "style",
] as const;
export type ConstraintCategory = (typeof CONSTRAINT_CATEGORIES)[number];

export type ConstraintDifficulty = 1 | 2 | 3;

/** What a constraint or game module sees while a run is being generated. */
export interface GenerationContext {
  rng: Rng;
  preferences: Preferences;
  /** Ids of the constraints selected for this attempt. */
  constraints: ReadonlySet<string>;
}

export interface ConstraintDefinition<TPools> {
  id: string;
  category: ConstraintCategory;
  difficulty: ConstraintDifficulty;
  /** At most one constraint per group can be part of a run. */
  exclusiveGroup?: string;
  conflictsWith?: readonly string[];
  requires?: readonly string[];
  /** Removes options that this constraint makes impossible. */
  narrow?: (pools: TPools, ctx: GenerationContext) => TPools;
}

export interface ObjectiveDefinition {
  id: Objective;
}

/** The concrete picks of a run, chosen once constraints are known. */
export interface Loadout {
  startingClass: string;
  weapon?: string;
  weaponCategory?: string;
  armorSet?: string;
}

export interface CatalogEntry {
  id: string;
  /** Proper name as used in the game; not translated. */
  name: string;
}

export interface BossEntry extends CatalogEntry {
  required: boolean;
  dlc: boolean;
}

/** Display names for the ids a run refers to. */
export interface GameCatalog {
  classes: readonly CatalogEntry[];
  weapons: readonly CatalogEntry[];
  armorSets: readonly CatalogEntry[];
  bosses: readonly BossEntry[];
}

/**
 * Everything the generator needs to know about one game. The core never
 * imports a game directly; games are looked up through the registry.
 */
export interface GameModule<TData, TPools> {
  id: GameId;
  /**
   * Bumped whenever the dataset or the generation algorithm changes, since
   * either alters the run a seed produces.
   */
  rulesetVersion: number;
  data: TData;
  catalog: GameCatalog;
  constraints: readonly ConstraintDefinition<TPools>[];
  objectives: readonly ObjectiveDefinition[];
  /** Every option the preferences allow, before constraints narrow it down. */
  createPools(preferences: Preferences): TPools;
  /** Picks a coherent loadout from the narrowed pools, or null if none exists. */
  resolve(pools: TPools, ctx: GenerationContext): Loadout | null;
}

/** A generated run. Holds ids only; display text is resolved by the UI. */
export interface ChallengeRun extends Loadout {
  seed: string;
  gameId: GameId;
  rulesetVersion: number;
  constraints: string[];
  difficulty: Difficulty;
  objective: Objective;
  includeDlc: boolean;
}
