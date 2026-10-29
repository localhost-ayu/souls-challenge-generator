import type { Preferences } from "./core/preferences";
import { decodeSeed, encodeSeed, type SeedParts } from "./core/seed";
import type { ChallengeRun, GameId } from "./core/types";
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

/** Validates a seed against the rulesets this build supports. */
export function parseSeed(seed: string): SeedParts {
  return decodeSeed(seed, supportedRulesets);
}

export { GenerationError, type GenerationErrorReason } from "./core/generator";
export {
  DIFFICULTIES,
  OBJECTIVES,
  preferencesSchema,
  type Difficulty,
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
  type ChallengeRun,
  type ConstraintCategory,
  type GameId,
} from "./core/types";
