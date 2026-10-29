import { describe, expect, it } from "vitest";
import {
  createRng,
  hashString,
  nextFloat,
  nextInt,
  pick,
  shuffle,
  weightedPick,
} from "./rng";

function take(seed: number, count: number): number[] {
  const rng = createRng(seed);
  return Array.from({ length: count }, () => rng.nextUint32());
}

describe("createRng", () => {
  it("matches the reference mulberry32 sequence", () => {
    // Locks the algorithm: any change here silently changes every run.
    expect(take(0, 5)).toEqual([
      1144304738, 1416247, 958946056, 627933444, 2007157716,
    ]);
  });

  it("produces the same sequence for the same seed", () => {
    expect(take(42, 100)).toEqual(take(42, 100));
  });

  it("produces different sequences for different seeds", () => {
    expect(take(1, 10)).not.toEqual(take(2, 10));
  });
});

describe("hashString", () => {
  it("matches the reference FNV-1a values", () => {
    expect(hashString("")).toBe(0x811c9dc5);
    expect(hashString("a")).toBe(0xe40c292c);
  });

  it("is stable and sensitive to small changes", () => {
    expect(hashString("praise-the-sun")).toBe(hashString("praise-the-sun"));
    expect(hashString("praise-the-sun")).not.toBe(hashString("praise-the-suN"));
  });
});

describe("nextFloat", () => {
  it("stays within [0, 1)", () => {
    const rng = createRng(7);
    for (let i = 0; i < 10_000; i++) {
      const value = nextFloat(rng);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe("nextInt", () => {
  it("has no gross bias across buckets", () => {
    const rng = createRng(123);
    const buckets = 6;
    const samples = 60_000;
    const counts = new Array<number>(buckets).fill(0);

    for (let i = 0; i < samples; i++) {
      counts[nextInt(rng, buckets)]!++;
    }

    const expected = samples / buckets;
    for (const count of counts) {
      expect(Math.abs(count - expected) / expected).toBeLessThan(0.05);
    }
  });

  it("rejects non-positive or fractional bounds", () => {
    const rng = createRng(1);
    expect(() => nextInt(rng, 0)).toThrow(RangeError);
    expect(() => nextInt(rng, -3)).toThrow(RangeError);
    expect(() => nextInt(rng, 2.5)).toThrow(RangeError);
  });
});

describe("pick", () => {
  it("returns an element of the array", () => {
    const items = ["sl1", "no-armor", "no-estus"];
    expect(items).toContain(pick(createRng(5), items));
  });

  it("throws on an empty array", () => {
    expect(() => pick(createRng(5), [])).toThrow(RangeError);
  });
});

describe("shuffle", () => {
  it("returns a permutation without mutating the input", () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    const snapshot = [...items];

    const result = shuffle(createRng(9), items);

    expect(items).toEqual(snapshot);
    expect([...result].sort((a, b) => a - b)).toEqual(snapshot);
  });

  it("is deterministic for the same seed", () => {
    const items = ["a", "b", "c", "d", "e"];
    expect(shuffle(createRng(3), items)).toEqual(shuffle(createRng(3), items));
  });
});

describe("weightedPick", () => {
  it("never picks zero-weight items", () => {
    const rng = createRng(11);
    const weight = (item: string) => (item === "never" ? 0 : 1);
    for (let i = 0; i < 1_000; i++) {
      expect(weightedPick(rng, ["never", "always"], weight)).toBe("always");
    }
  });

  it("follows the weights roughly", () => {
    const rng = createRng(17);
    const weight = (item: string) => (item === "heavy" ? 3 : 1);
    const samples = 20_000;
    let heavy = 0;
    for (let i = 0; i < samples; i++) {
      if (weightedPick(rng, ["light", "heavy"], weight) === "heavy") heavy++;
    }
    expect(heavy / samples).toBeGreaterThan(0.72);
    expect(heavy / samples).toBeLessThan(0.78);
  });

  it("rejects negative weights and an all-zero total", () => {
    const rng = createRng(1);
    expect(() => weightedPick(rng, [1, 2], () => -1)).toThrow(RangeError);
    expect(() => weightedPick(rng, [1, 2], () => 0)).toThrow(RangeError);
  });
});
