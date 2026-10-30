import { isCompatible } from "./compatibility";
import { isObjectiveAllowed, type Difficulty, type Preferences } from "./preferences";
import { createRng, hashString, nextInt, weightedPick, type Rng } from "./rng";
import { encodeSeed, type SeedParts } from "./seed";
import type {
  ChallengeRun,
  ConstraintDefinition,
  ConstraintDifficulty,
  GameModule,
} from "./types";

interface DifficultyProfile {
  minConstraints: number;
  maxConstraints: number;
  /** Relative chance of picking a constraint of each difficulty tier. */
  weights: Record<ConstraintDifficulty, number>;
}

// Weights never reach zero so narrow category choices (e.g. only "level")
// still produce a run instead of failing.
export const DIFFICULTY_PROFILES: Readonly<Record<Difficulty, DifficultyProfile>> = {
  hollow: { minConstraints: 1, maxConstraints: 2, weights: { 1: 1, 2: 0.25, 3: 0.05 } },
  undead: { minConstraints: 2, maxConstraints: 3, weights: { 1: 1, 2: 1, 3: 0.3 } },
  chosen: { minConstraints: 3, maxConstraints: 4, weights: { 1: 0.6, 2: 1, 3: 1 } },
  "lord-of-cinder": {
    minConstraints: 4,
    maxConstraints: 5,
    weights: { 1: 0.3, 2: 1, 3: 1.5 },
  },
};

/**
 * Each failed attempt keeps consuming the same rng, so retries stay
 * deterministic. The limit only guards against preference/data combinations
 * that can never be satisfied.
 */
export const MAX_ATTEMPTS = 50;

export type GenerationErrorReason =
  | "no-eligible-constraints"
  | "unknown-objective"
  | "objective-needs-house-rule"
  | "attempts-exhausted";

export class GenerationError extends Error {
  override readonly name = "GenerationError";

  constructor(
    readonly reason: GenerationErrorReason,
    message: string,
  ) {
    super(message);
  }
}

export function generateFromModule<TData, TPools>(
  module: GameModule<TData, TPools>,
  parts: SeedParts,
): ChallengeRun {
  if (parts.gameId !== module.id || parts.rulesetVersion !== module.rulesetVersion) {
    throw new Error(
      `seed is for ${parts.gameId} v${parts.rulesetVersion}, ` +
        `module is ${module.id} v${module.rulesetVersion}`,
    );
  }

  const { preferences } = parts;
  if (!module.objectives.some((objective) => objective.id === preferences.objective)) {
    throw new GenerationError(
      "unknown-objective",
      `${module.id} does not support the "${preferences.objective}" objective`,
    );
  }

  if (!isObjectiveAllowed(preferences.objective, preferences.houseRules)) {
    throw new GenerationError(
      "objective-needs-house-rule",
      `the "${preferences.objective}" objective needs house rules the seed forbids`,
    );
  }

  const eligible = module.constraints.filter((c) => preferences.categories[c.category]);
  if (eligible.length === 0) {
    throw new GenerationError(
      "no-eligible-constraints",
      "the selected categories contain no constraints",
    );
  }

  // Hashing the whole canonical seed (not only the key) makes runs with the
  // same key but different preferences independent of each other.
  const seed = encodeSeed(parts);
  const rng = createRng(hashString(seed));

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const selected = selectConstraints(eligible, preferences, rng);
    const ctx = {
      rng,
      preferences,
      constraints: new Set(selected.map((c) => c.id)),
    };

    const pools = selected.reduce(
      (current, constraint) => constraint.narrow?.(current, ctx) ?? current,
      module.createPools(preferences),
    );
    const loadout = module.resolve(pools, ctx);
    if (!loadout) continue;

    return {
      seed,
      gameId: module.id,
      rulesetVersion: module.rulesetVersion,
      startingClass: loadout.startingClass,
      constraints: selected.map(({ id }) => {
        const params = loadout.params[id];
        return params ? { id, params } : { id };
      }),
      difficulty: preferences.difficulty,
      objective: preferences.objective,
      includeDlc: preferences.includeDlc,
      houseRules: preferences.houseRules,
    };
  }

  throw new GenerationError(
    "attempts-exhausted",
    `no feasible run found for "${seed}" after ${MAX_ATTEMPTS} attempts`,
  );
}

/**
 * Picks constraints one at a time, weighted by difficulty, keeping only
 * candidates that stay compatible with what was already picked. Returns them
 * in definition order so the output does not depend on pick order.
 */
export function selectConstraints<TPools>(
  eligible: readonly ConstraintDefinition<TPools>[],
  preferences: Preferences,
  rng: Rng,
): ConstraintDefinition<TPools>[] {
  const profile = DIFFICULTY_PROFILES[preferences.difficulty];
  const target =
    profile.minConstraints +
    nextInt(rng, profile.maxConstraints - profile.minConstraints + 1);
  const byId = new Map(eligible.map((c) => [c.id, c]));
  const selected: ConstraintDefinition<TPools>[] = [];

  while (selected.length < target) {
    const options = eligible
      .filter((c) => !selected.includes(c))
      .map((c) => withRequirements(c, byId, selected))
      .filter(
        (bundle): bundle is ConstraintDefinition<TPools>[] =>
          bundle !== null &&
          selected.length + bundle.length <= profile.maxConstraints &&
          isCompatible([...selected, ...bundle]),
      );
    if (options.length === 0) break;

    const bundle = weightedPick(rng, options, (b) => profile.weights[b[0]!.difficulty]);
    selected.push(...bundle);
  }

  return eligible.filter((c) => selected.includes(c));
}

/**
 * The constraint plus any requirements not yet selected, or null when a
 * requirement is not eligible under the current preferences.
 */
function withRequirements<TPools>(
  constraint: ConstraintDefinition<TPools>,
  byId: ReadonlyMap<string, ConstraintDefinition<TPools>>,
  selected: readonly ConstraintDefinition<TPools>[],
): ConstraintDefinition<TPools>[] | null {
  const bundle = [constraint];
  for (let i = 0; i < bundle.length; i++) {
    for (const id of bundle[i]!.requires ?? []) {
      const required = byId.get(id);
      if (!required) return null;
      if (!selected.includes(required) && !bundle.includes(required)) {
        bundle.push(required);
      }
    }
  }
  return bundle;
}
