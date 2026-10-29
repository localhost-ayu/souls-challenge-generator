import { generateFromModule } from "../core/generator";
import type { SeedParts } from "../core/seed";
import type {
  ChallengeRun,
  ConstraintSummary,
  GameCatalog,
  GameId,
  GameModule,
} from "../core/types";
import { dsrModule } from "./dsr";

/**
 * A game module with its data and pool types erased, so modules with
 * different shapes can live in one lookup table.
 */
export interface RegisteredGame {
  id: GameId;
  rulesetVersion: number;
  catalog: GameCatalog;
  constraints: readonly ConstraintSummary[];
  generate(parts: SeedParts): ChallengeRun;
}

function register<TData, TPools>(
  module: GameModule<TData, TPools>,
): RegisteredGame {
  return {
    id: module.id,
    rulesetVersion: module.rulesetVersion,
    catalog: module.catalog,
    constraints: module.constraints.map(({ id, category, difficulty }) => ({
      id,
      category,
      difficulty,
    })),
    generate: (parts) => generateFromModule(module, parts),
  };
}

export const games: Readonly<Record<GameId, RegisteredGame>> = {
  dsr: register(dsrModule),
};

export const supportedRulesets = Object.fromEntries(
  Object.values(games).map((game) => [game.id, game.rulesetVersion]),
) as Readonly<Record<GameId, number>>;
