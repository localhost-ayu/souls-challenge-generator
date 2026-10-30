import { z } from "zod";
import { nextInt, pick, type Rng } from "./rng";
import { CONSTRAINT_CATEGORIES } from "./types";

export const DIFFICULTIES = [
  "hollow",
  "undead",
  "chosen",
  "lord-of-cinder",
] as const;

export const OBJECTIVES = ["main-bosses", "all-bosses"] as const;

/**
 * Baseline rules that apply to every run, whatever constraints are drawn.
 * They answer the questions a rule list alone leaves open ("may I buff?").
 */
export const HOUSE_RULES = ["buffs", "summons", "glitches"] as const;
export type HouseRule = (typeof HOUSE_RULES)[number];

export const preferencesSchema = z.strictObject({
  difficulty: z.enum(DIFFICULTIES),
  objective: z.enum(OBJECTIVES),
  includeDlc: z.boolean(),
  /** true = allowed. */
  houseRules: z.strictObject(
    Object.fromEntries(HOUSE_RULES.map((rule) => [rule, z.boolean()])) as Record<
      HouseRule,
      z.ZodBoolean
    >,
  ),
  categories: z.strictObject(
    Object.fromEntries(
      CONSTRAINT_CATEGORIES.map((category) => [category, z.boolean()]),
    ) as Record<(typeof CONSTRAINT_CATEGORIES)[number], z.ZodBoolean>,
  ),
});

export type Difficulty = (typeof DIFFICULTIES)[number];
export type Objective = (typeof OBJECTIVES)[number];
export type Preferences = z.infer<typeof preferencesSchema>;

export const DEFAULT_PREFERENCES: Preferences = {
  difficulty: "undead",
  objective: "main-bosses",
  includeDlc: false,
  houseRules: { buffs: true, summons: false, glitches: false },
  categories: Object.fromEntries(
    CONSTRAINT_CATEGORIES.map((category) => [category, true]),
  ) as Preferences["categories"],
};

/**
 * Random preferences with at least one constraint category enabled.
 * Glitches stay forbidden: a lucky run should be playable without
 * speedrun knowledge.
 */
export function randomPreferences(rng: Rng): Preferences {
  const mask = 1 + nextInt(rng, (1 << CONSTRAINT_CATEGORIES.length) - 1);
  return {
    difficulty: pick(rng, DIFFICULTIES),
    objective: pick(rng, OBJECTIVES),
    includeDlc: nextInt(rng, 2) === 1,
    houseRules: {
      buffs: nextInt(rng, 2) === 1,
      summons: nextInt(rng, 2) === 1,
      glitches: false,
    },
    categories: Object.fromEntries(
      CONSTRAINT_CATEGORIES.map((category, index) => [
        category,
        ((mask >> index) & 1) === 1,
      ]),
    ) as Preferences["categories"],
  };
}
