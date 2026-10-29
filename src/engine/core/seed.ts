import { z } from "zod";
import {
  DIFFICULTIES,
  OBJECTIVES,
  preferencesSchema,
  type Preferences,
} from "./preferences";
import { CONSTRAINT_CATEGORIES, GAME_IDS, type GameId } from "./types";

/*
 * Seed format: <gameId>-<rulesetVersion>-<preferences>-<key>
 * e.g. dsr-1-e6-0k3j9x2
 *
 * - preferences: a 9-bit field written as 2 base36 chars
 *     bits 0-1 difficulty index, bit 2 objective, bit 3 include dlc,
 *     bits 4-8 allowed constraint categories (CONSTRAINT_CATEGORIES order)
 * - key: 1-16 base36 chars; the source of randomness. Any word works, so
 *   players can make memorable seeds such as dsr-1-e6-praisethesun.
 *
 * The bit layout is part of the ruleset: changing it requires bumping
 * rulesetVersion, which already invalidates older seeds.
 */

const KEY_PATTERN = /^[0-9a-z]{1,16}$/;
const SEED_PATTERN = /^([a-z0-9]+)-([1-9]\d{0,3})-([0-9a-z]{2})-([0-9a-z]{1,16})$/;
const PREFERENCE_BITS = 4 + CONSTRAINT_CATEGORIES.length;
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
  bits |= (preferences.includeDlc ? 1 : 0) << 3;
  CONSTRAINT_CATEGORIES.forEach((category, index) => {
    if (preferences.categories[category]) bits |= 1 << (4 + index);
  });
  return bits.toString(36).padStart(2, "0");
}

function decodePreferences(encoded: string): Preferences | undefined {
  const bits = parseInt(encoded, 36);
  if (bits >= 1 << PREFERENCE_BITS) return undefined;

  return {
    difficulty: DIFFICULTIES[bits & 0b11]!,
    objective: OBJECTIVES[(bits >> 2) & 1]!,
    includeDlc: ((bits >> 3) & 1) === 1,
    categories: Object.fromEntries(
      CONSTRAINT_CATEGORIES.map((category, index) => [
        category,
        ((bits >> (4 + index)) & 1) === 1,
      ]),
    ) as Preferences["categories"],
  };
}
