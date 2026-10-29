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

export const preferencesSchema = z.strictObject({
  difficulty: z.enum(DIFFICULTIES),
  objective: z.enum(OBJECTIVES),
  includeDlc: z.boolean(),
  categories: z.strictObject(
    Object.fromEntries(
      CONSTRAINT_CATEGORIES.map((category) => [category, z.boolean()]),
    ) as Record<(typeof CONSTRAINT_CATEGORIES)[number], z.ZodBoolean>,
  ),
});

export type Difficulty = (typeof DIFFICULTIES)[number];
export type Objective = (typeof OBJECTIVES)[number];
export type Preferences = z.infer<typeof preferencesSchema>;

/** Random preferences with at least one constraint category enabled. */
export function randomPreferences(rng: Rng): Preferences {
  const mask = 1 + nextInt(rng, (1 << CONSTRAINT_CATEGORIES.length) - 1);
  return {
    difficulty: pick(rng, DIFFICULTIES),
    objective: pick(rng, OBJECTIVES),
    includeDlc: nextInt(rng, 2) === 1,
    categories: Object.fromEntries(
      CONSTRAINT_CATEGORIES.map((category, index) => [
        category,
        ((mask >> index) & 1) === 1,
      ]),
    ) as Preferences["categories"],
  };
}
