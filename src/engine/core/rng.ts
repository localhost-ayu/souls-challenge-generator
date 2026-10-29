/**
 * Seeded pseudo-random number generator. Every helper takes the rng
 * explicitly so generation stays a pure function of the seed.
 */
export interface Rng {
  /** Next unsigned 32-bit integer in the sequence. */
  nextUint32(): number;
}

/** mulberry32: tiny, fast and well distributed enough for picking options. */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  return {
    nextUint32() {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return (t ^ (t >>> 14)) >>> 0;
    },
  };
}

/** FNV-1a: turns arbitrary text into a 32-bit rng seed. */
export function hashString(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Float in [0, 1). */
export function nextFloat(rng: Rng): number {
  return rng.nextUint32() / 0x1_0000_0000;
}

/** Integer in [0, max). */
export function nextInt(rng: Rng, max: number): number {
  if (!Number.isInteger(max) || max <= 0) {
    throw new RangeError(`max must be a positive integer, got ${max}`);
  }
  return Math.floor(nextFloat(rng) * max);
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  if (items.length === 0) {
    throw new RangeError("cannot pick from an empty array");
  }
  return items[nextInt(rng, items.length)]!;
}

/** Fisher–Yates on a copy; the input is left untouched. */
export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = nextInt(rng, i + 1);
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

export function weightedPick<T>(
  rng: Rng,
  items: readonly T[],
  weight: (item: T) => number,
): T {
  const weights = items.map((item) => {
    const w = weight(item);
    if (!Number.isFinite(w) || w < 0) {
      throw new RangeError(`weights must be finite and non-negative, got ${w}`);
    }
    return w;
  });
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (total <= 0) {
    throw new RangeError("at least one item needs a positive weight");
  }

  let target = nextFloat(rng) * total;
  for (let i = 0; i < items.length; i++) {
    target -= weights[i]!;
    if (target < 0) return items[i]!;
  }
  // Floating point rounding can leave target at ~0 after the last item.
  return items.findLast((_, i) => weights[i]! > 0)!;
}
