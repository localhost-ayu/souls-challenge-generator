import { z } from "zod";
import {
  DIFFICULTIES,
  HOUSE_RULES,
  OBJECTIVES,
  preferencesSchema,
  type Preferences,
} from "./preferences";
import { CONSTRAINT_CATEGORIES, GAME_IDS, type GameId } from "./types";

/*
 * Seed format: <gameId>-<rulesetVersion>-<preferences>-<key>
 * e.g. dsr-2-9zk-0k3j9x2
 *
 * - preferences: a bit field written as fixed-width base36
 *     bits 0-1 difficulty index, bits 2-3 objective index, bit 4 include dlc,
 *     then one bit per house rule (HOUSE_RULES order, set = allowed),
 *     then one bit per allowed constraint category (CONSTRAINT_CATEGORIES order)
 * - key: 1-16 base36 chars; the source of randomness. Any word works, so
 *   players can make memorable seeds such as dsr-2-9zk-praisethesun.
 *
 * The bit layout is part of the ruleset: changing it requires bumping
 * rulesetVersion, which already invalidates older seeds.
 */

const HOUSE_RULES_SHIFT = 5;
const CATEGORIES_SHIFT = HOUSE_RULES_SHIFT + HOUSE_RULES.length;
const PREFERENCE_BITS = CATEGORIES_SHIFT + CONSTRAINT_CATEGORIES.length;
/** Smallest number of base36 digits that holds every preference bit. */
const PREFERENCE_WIDTH = Math.ceil(PREFERENCE_BITS / Math.log2(36));

const KEY_PATTERN = /^[0-9a-z]{1,16}$/;
const SEED_PATTERN = new RegExp(
  `^([a-z0-9]+)-([1-9]\\d{0,3})-([0-9a-z]{${PREFERENCE_WIDTH}})-([0-9a-z]{1,16})$`,
);
const KEY_LENGTH = 7; // enough base36 digits for any uint32

export const seedPartsSchema = z.strictObject({
  gameId: z.enum(GAME_IDS),
  rulesetVersion: z.number().int().min(1).max(9999),
  preferences: preferencesSchema,
  key: z.string().regex(KEY_PATTERN),
});

export type SeedParts = z.infer<typeof seedPartsSchema>;

export class SeedError extends Error {
  override readonly name: string = "SeedError";
}

export class InvalidSeedError extends SeedError {
  override readonly name = "InvalidSeedError";

  constructor(
    readonly input: string,
    reason: string,
  ) {
    super(`invalid seed "${input}": ${reason}`);
  }
}

/** The seed is well formed but was made by another ruleset version. */
export class UnsupportedRulesetError extends SeedError {
  override readonly name = "UnsupportedRulesetError";

  constructor(
    readonly gameId: GameId,
    readonly seedVersion: number,
    readonly supportedVersion: number,
  ) {
    super(
      `seed uses ${gameId} ruleset v${seedVersion}, but only v${supportedVersion} is supported`,
    );
  }
}

/** Turns an unsigned 32-bit number (e.g. from crypto.getRandomValues) into a seed key. */
export function seedKeyFromNumber(value: number): string {
  if (!Number.isInteger(value) || value < 0 || value > 0xffff_ffff) {
    throw new RangeError(`expected an unsigned 32-bit integer, got ${value}`);
  }
  return value.toString(36).padStart(KEY_LENGTH, "0");
}

export function encodeSeed(parts: SeedParts): string {
  const { gameId, rulesetVersion, preferences, key } = seedPartsSchema.parse(parts);
  return `${gameId}-${rulesetVersion}-${encodePreferences(preferences)}-${key}`;
}

/**
 * Parses user input (trimmed, case-insensitive) into seed parts.
 * @throws {InvalidSeedError} when the input is not a valid seed
 * @throws {UnsupportedRulesetError} when the seed belongs to another ruleset version
 */
export function decodeSeed(
  input: string,
  supportedRulesets: Readonly<Record<GameId, number>>,
): SeedParts {
  const normalized = input.trim().toLowerCase();
  const match = SEED_PATTERN.exec(normalized);
  if (!match) {
    throw new InvalidSeedError(input, "unexpected format");
  }
  const [, rawGameId, rawVersion, rawPreferences, key] = match;

  const gameId = z.enum(GAME_IDS).safeParse(rawGameId);
  if (!gameId.success) {
    throw new InvalidSeedError(input, `unknown game "${rawGameId}"`);
  }

  const rulesetVersion = Number(rawVersion);
  const supportedVersion = supportedRulesets[gameId.data];
  if (rulesetVersion !== supportedVersion) {
    throw new UnsupportedRulesetError(gameId.data, rulesetVersion, supportedVersion);
  }

  const preferences = decodePreferences(rawPreferences!);
  if (!preferences) {
    throw new InvalidSeedError(input, "preferences out of range");
  }

  return { gameId: gameId.data, rulesetVersion, preferences, key: key! };
}

function encodePreferences(preferences: Preferences): string {
  let bits = DIFFICULTIES.indexOf(preferences.difficulty);
  bits |= OBJECTIVES.indexOf(preferences.objective) << 2;
  bits |= (preferences.includeDlc ? 1 : 0) << 4;
  HOUSE_RULES.forEach((rule, index) => {
    if (preferences.houseRules[rule]) bits |= 1 << (HOUSE_RULES_SHIFT + index);
  });
  CONSTRAINT_CATEGORIES.forEach((category, index) => {
    if (preferences.categories[category]) bits |= 1 << (CATEGORIES_SHIFT + index);
  });
  return bits.toString(36).padStart(PREFERENCE_WIDTH, "0");
}

function decodePreferences(encoded: string): Preferences | undefined {
  const bits = parseInt(encoded, 36);
  if (bits >= 1 << PREFERENCE_BITS) return undefined;
  const objective = OBJECTIVES[(bits >> 2) & 0b11];
  if (objective === undefined) return undefined;

  return {
    difficulty: DIFFICULTIES[bits & 0b11]!,
    objective,
    includeDlc: ((bits >> 4) & 1) === 1,
    houseRules: Object.fromEntries(
      HOUSE_RULES.map((rule, index) => [
        rule,
        ((bits >> (HOUSE_RULES_SHIFT + index)) & 1) === 1,
      ]),
    ) as Preferences["houseRules"],
    categories: Object.fromEntries(
      CONSTRAINT_CATEGORIES.map((category, index) => [
        category,
        ((bits >> (CATEGORIES_SHIFT + index)) & 1) === 1,
      ]),
    ) as Preferences["categories"],
  };
}
