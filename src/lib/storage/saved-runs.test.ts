import { describe, expect, it } from "vitest";
import { HISTORY_LIMIT } from "./items";
import {
  addToHistory,
  isFavorite,
  removeSeed,
  setFavoriteLabel,
  toggleFavorite,
} from "./saved-runs";

describe("addToHistory", () => {
  it("puts the newest run first", () => {
    const history = addToHistory([{ seed: "a", savedAt: 1 }], "b", 2);
    expect(history.map((e) => e.seed)).toEqual(["b", "a"]);
  });

  it("moves a repeated seed to the top instead of duplicating it", () => {
    const history = addToHistory(
      [
        { seed: "a", savedAt: 1 },
        { seed: "b", savedAt: 2 },
      ],
      "b",
      3,
    );
    expect(history).toEqual([
      { seed: "b", savedAt: 3 },
      { seed: "a", savedAt: 1 },
    ]);
  });

  it(`keeps only the last ${HISTORY_LIMIT} runs`, () => {
    let history = addToHistory([], "seed-0", 0);
    for (let i = 1; i <= HISTORY_LIMIT + 5; i++) {
      history = addToHistory(history, `seed-${i}`, i);
    }
    expect(history).toHaveLength(HISTORY_LIMIT);
    expect(history[0]?.seed).toBe(`seed-${HISTORY_LIMIT + 5}`);
  });
});

describe("favorites", () => {
  it("toggles a seed in and out", () => {
    const added = toggleFavorite([], "a", 1);
    expect(isFavorite(added, "a")).toBe(true);
    expect(isFavorite(toggleFavorite(added, "a", 2), "a")).toBe(false);
  });

  it("sets, trims and clears labels", () => {
    const favorites = [{ seed: "a", savedAt: 1 }];

    const labelled = setFavoriteLabel(favorites, "a", "  My SL1 run  ");
    expect(labelled[0]?.label).toBe("My SL1 run");

    expect(setFavoriteLabel(labelled, "a", "   ")[0]).toEqual({ seed: "a", savedAt: 1 });
    expect(setFavoriteLabel(favorites, "a", "x".repeat(100))[0]?.label).toHaveLength(60);
  });

  it("removes a single seed", () => {
    const list = [
      { seed: "a", savedAt: 1 },
      { seed: "b", savedAt: 2 },
    ];
    expect(removeSeed(list, "a")).toEqual([{ seed: "b", savedAt: 2 }]);
  });
});
