import { randomPreferences, type Preferences } from "./core/preferences";
import { createRng, hashString } from "./core/rng";
import { decodeSeed, encodeSeed, type SeedParts } from "./core/seed";
import type {
  ChallengeRun,
  ConstraintSummary,
  GameCatalog,
  GameId,
} from "./core/types";
import { games, supportedRulesets } from "./games/registry";

/**
 * Recreates the run described by a seed. Pure: the same seed always yields
 * the same run.
 * @throws {InvalidSeedError} malformed seed
 * @throws {UnsupportedRulesetError} seed from another ruleset version
 * @throws {GenerationError} the preferences allow no feasible run
 */
export function generateRun(seed: string): ChallengeRun {
  const parts = parseSeed(seed);
  return games[parts.gameId].generate(parts);
}

/** Builds a seed for the current ruleset of a game. */
export function createSeed(input: {
  gameId: GameId;
  preferences: Preferences;
  key: string;
}): string {
  return encodeSeed({
    ...input,
    rulesetVersion: games[input.gameId].rulesetVersion,
  });
}

/**
 * "I'm feeling lucky": the preferences themselves are drawn from the key,
 * so the same key always leads to the same seed.
 */
export function createLuckySeed(input: { gameId: GameId; key: string }): string {
  const rng = createRng(hashString(`lucky:${input.key}`));
  return createSeed({ ...input, preferences: randomPreferences(rng) });
}

export function getGameCatalog(gameId: GameId): GameCatalog {
  return games[gameId].catalog;
}

export function getGameConstraints(gameId: GameId): readonly ConstraintSummary[] {
  return games[gameId].constraints;
}

/** Validates a seed against the rulesets this build supports. */
export function parseSeed(seed: string): SeedParts {
  return decodeSeed(seed, supportedRulesets);
}

export { GenerationError, type GenerationErrorReason } from "./core/generator";
export {
  DEFAULT_PREFERENCES,
  DIFFICULTIES,
  HOUSE_RULES,
  isObjectiveAllowed,
  OBJECTIVE_REQUIREMENTS,
  OBJECTIVES,
  preferencesSchema,
  type Difficulty,
  type HouseRule,
  type Objective,
  type Preferences,
} from "./core/preferences";
export {
  InvalidSeedError,
  SeedError,
  seedKeyFromNumber,
  UnsupportedRulesetError,
  type SeedParts,
} from "./core/seed";
export {
  CONSTRAINT_CATEGORIES,
  GAME_IDS,
  type AppliedConstraint,
  type BossEntry,
  type CatalogEntry,
  type ChallengeRun,
  type ConstraintCategory,
  type ConstraintParams,
  type ConstraintSummary,
  type GameCatalog,
  type GameId,
} from "./core/types";
