import { describe, expect, it } from "vitest";
import {
  generateFromModule,
  GenerationError,
  selectConstraints,
  type GenerationErrorReason,
} from "./generator";
import type { Preferences } from "./preferences";
import { createRng, pick } from "./rng";
import type { SeedParts } from "./seed";
import type { ConstraintDefinition, GameModule } from "./types";

// A tiny made-up game: the core must work without knowing Dark Souls.
interface Pools {
  classes: string[];
}

type Definition = ConstraintDefinition<Pools>;

const everything: Preferences["categories"] = {
  level: true,
  equipment: true,
  movement: true,
  resource: true,
  style: true,
};

function makeModule(constraints: Definition[]): GameModule<null, Pools> {
  return {
    id: "dsr",
    rulesetVersion: 1,
    data: null,
    constraints,
    objectives: [{ id: "main-bosses" }],
    createPools: () => ({ classes: ["knight", "thief", "cleric"] }),
    resolve: (pools, ctx) =>
      pools.classes.length === 0
        ? null
        : { startingClass: pick(ctx.rng, pools.classes) },
  };
}

function makeParts(
  overrides: Partial<Preferences> = {},
  key = "abc123",
): SeedParts {
  return {
    gameId: "dsr",
    rulesetVersion: 1,
    key,
    preferences: {
      difficulty: "undead",
      objective: "main-bosses",
      includeDlc: false,
      categories: everything,
      ...overrides,
    },
  };
}

const basic: Definition[] = [
  { id: "a", category: "style", difficulty: 1 },
  { id: "b", category: "style", difficulty: 1 },
  { id: "c", category: "movement", difficulty: 2 },
  { id: "d", category: "resource", difficulty: 3 },
];

function generationErrorReason(
  run: () => unknown,
): GenerationErrorReason | undefined {
  try {
    run();
  } catch (error) {
    if (error instanceof GenerationError) return error.reason;
    throw error;
  }
  return undefined;
}

describe("generateFromModule", () => {
  it("returns the same run for the same seed", () => {
    const game = makeModule(basic);

    expect(generateFromModule(game, makeParts())).toEqual(
      generateFromModule(game, makeParts()),
    );
  });

  it("returns the canonical seed and the preferences in the run", () => {
    const run = generateFromModule(
      makeModule(basic),
      makeParts({ includeDlc: true }),
    );

    expect(run.seed).toMatch(/^dsr-1-[0-9a-z]{2}-abc123$/);
    expect(run.objective).toBe("main-bosses");
    expect(run.includeDlc).toBe(true);
  });

  it("varies runs across keys", () => {
    const game = makeModule(basic);
    const runs = new Set(
      Array.from({ length: 50 }, (_, i) => {
        const run = generateFromModule(game, makeParts({}, `key${i}`));
        return JSON.stringify(run.constraints);
      }),
    );

    expect(runs.size).toBeGreaterThan(1);
  });

  it("only uses constraints from allowed categories", () => {
    const game = makeModule(basic);
    for (let i = 0; i < 200; i++) {
      const run = generateFromModule(
        game,
        makeParts({ categories: { ...everything, style: false } }, `k${i}`),
      );
      expect(run.constraints).not.toContain("a");
      expect(run.constraints).not.toContain("b");
    }
  });

  it("retries when a selection turns out infeasible", () => {
    const game = makeModule([
      { id: "possible", category: "style", difficulty: 1 },
      {
        id: "impossible",
        category: "style",
        difficulty: 1,
        narrow: () => ({ classes: [] }),
      },
    ]);
    for (let i = 0; i < 200; i++) {
      const parts = makeParts({ difficulty: "hollow" }, `k${i}`);
      const run = generateFromModule(game, parts);
      expect(run.constraints).toEqual(["possible"]);
    }
  });

  it("throws attempts-exhausted when nothing is ever feasible", () => {
    const game = makeModule([
      {
        id: "impossible",
        category: "style",
        difficulty: 1,
        narrow: () => ({ classes: [] }),
      },
    ]);
    const reason = generationErrorReason(() =>
      generateFromModule(game, makeParts()),
    );

    expect(reason).toBe("attempts-exhausted");
  });

  it("throws no-eligible-constraints when every category is off", () => {
    const categories = {
      level: false,
      equipment: false,
      movement: false,
      resource: false,
      style: false,
    };
    const reason = generationErrorReason(() =>
      generateFromModule(makeModule(basic), makeParts({ categories })),
    );

    expect(reason).toBe("no-eligible-constraints");
  });

  it("throws unknown-objective for objectives the game does not offer", () => {
    const reason = generationErrorReason(() =>
      generateFromModule(makeModule(basic), makeParts({ objective: "all-bosses" })),
    );

    expect(reason).toBe("unknown-objective");
  });
});

describe("selectConstraints", () => {
  const preferences = makeParts().preferences;

  it("never combines conflicting or same-group constraints", () => {
    const definitions: Definition[] = [
      { id: "x", category: "style", difficulty: 1, conflictsWith: ["y"] },
      { id: "y", category: "style", difficulty: 1 },
      { id: "g1", category: "style", difficulty: 1, exclusiveGroup: "g" },
      { id: "g2", category: "style", difficulty: 1, exclusiveGroup: "g" },
    ];
    const chosen = { ...preferences, difficulty: "chosen" } as const;
    const rng = createRng(1);
    for (let i = 0; i < 500; i++) {
      const ids = selectConstraints(definitions, chosen, rng).map((c) => c.id);
      expect(ids.includes("x") && ids.includes("y")).toBe(false);
      expect(ids.includes("g1") && ids.includes("g2")).toBe(false);
    }
  });

  it("pulls in required constraints together", () => {
    const definitions: Definition[] = [
      { id: "base", category: "style", difficulty: 1 },
      { id: "extra", category: "style", difficulty: 1, requires: ["base"] },
    ];
    const rng = createRng(2);
    for (let i = 0; i < 500; i++) {
      const ids = selectConstraints(definitions, preferences, rng).map((c) => c.id);
      if (ids.includes("extra")) expect(ids).toContain("base");
    }
  });

  it("skips constraints whose requirement is not eligible", () => {
    const definitions: Definition[] = [
      { id: "orphan", category: "style", difficulty: 1, requires: ["missing"] },
      { id: "ok", category: "style", difficulty: 1 },
    ];

    const selected = selectConstraints(definitions, preferences, createRng(3));

    expect(selected.map((c) => c.id)).toEqual(["ok"]);
  });

  it("returns constraints in definition order", () => {
    const chosen = { ...preferences, difficulty: "chosen" } as const;
    const rng = createRng(4);
    const order = basic.map((c) => c.id);
    for (let i = 0; i < 100; i++) {
      const ids = selectConstraints(basic, chosen, rng).map((c) => c.id);
      expect(ids).toEqual(order.filter((id) => ids.includes(id)));
    }
  });
});
