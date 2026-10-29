export type GameId = "dsr";

export type ConstraintCategory =
  | "level"
  | "equipment"
  | "movement"
  | "resource"
  | "style";

export type ConstraintDifficulty = 1 | 2 | 3;

export interface ConstraintDefinition {
  id: string;
  category: ConstraintCategory;
  difficulty: ConstraintDifficulty;
  /** At most one constraint per group can be part of a run. */
  exclusiveGroup?: string;
  conflictsWith?: readonly string[];
  requires?: readonly string[];
}

export interface ObjectiveDefinition {
  id: string;
}

/**
 * Everything the generator needs to know about one game. The core never
 * imports a game directly; games are looked up through the registry.
 */
export interface GameModule<TData> {
  id: GameId;
  /** Bumped whenever the dataset or the generation algorithm changes, since either alters the run a seed produces. */
  rulesetVersion: number;
  data: TData;
  constraints: readonly ConstraintDefinition[];
  objectives: readonly ObjectiveDefinition[];
}

/** A generated run. Holds ids only; display text is resolved by the UI. */
export interface ChallengeRun {
  seed: string;
  gameId: GameId;
  rulesetVersion: number;
  startingClass: string;
  weapon?: string;
  weaponCategory?: string;
  armorSet?: string;
  constraints: string[];
  objective: string;
}
