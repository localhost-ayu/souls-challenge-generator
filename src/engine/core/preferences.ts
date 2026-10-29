import { z } from "zod";
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
