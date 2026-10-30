import type { Objective, Preferences } from "./preferences";
import type { Rng } from "./rng";

export const GAME_IDS = ["dsr"] as const;
export type GameId = (typeof GAME_IDS)[number];

export const CONSTRAINT_CATEGORIES = [
  "level",
  "equipment",
  "movement",
  "combat",
  "resource",
  "style",
  "absurd",
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

/**
 * Values a constraint draws for one run, e.g. `{ weapon: "claymore" }`.
 * The key tells the UI how to display the value (an id to look up in the
 * catalog, a translated category, a plain number, or an ordered list of ids).
 */
export type ConstraintParams = Readonly<
  Record<string, string | number | readonly string[]>
>;

export interface AppliedConstraint {
  id: string;
  params?: ConstraintParams;
}

/** The concrete picks of a run, chosen once constraints are known. */
export interface Loadout {
  startingClass: string;
  /** Parameters keyed by constraint id; constraints without any are absent. */
  params: Readonly<Record<string, ConstraintParams>>;
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

/** What the UI needs to present a constraint; the text itself is translated. */
export type ConstraintSummary = Pick<
  ConstraintDefinition<unknown>,
  "id" | "category" | "difficulty"
>;

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
export interface ChallengeRun
  extends Pick<Preferences, "difficulty" | "objective" | "includeDlc" | "houseRules"> {
  seed: string;
  gameId: GameId;
  rulesetVersion: number;
  startingClass: string;
  constraints: AppliedConstraint[];
}
