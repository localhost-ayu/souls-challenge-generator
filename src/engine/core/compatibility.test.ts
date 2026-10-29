import { describe, expect, it } from "vitest";
import { conflicts, isCompatible } from "./compatibility";

const noArmor = { id: "no-armor", conflictsWith: ["cosplay"] };
const cosplay = { id: "cosplay" };
const bowOnly = { id: "bow-only", exclusiveGroup: "weapon-rule" };
const specificWeapon = { id: "specific-weapon", exclusiveGroup: "weapon-rule" };
const sl1 = { id: "sl1" };
const dependent = { id: "dependent", requires: ["sl1"] };

describe("conflicts", () => {
  it("is symmetric even when declared on one side only", () => {
    expect(conflicts(noArmor, cosplay)).toBe(true);
    expect(conflicts(cosplay, noArmor)).toBe(true);
  });

  it("is false for unrelated constraints", () => {
    expect(conflicts(sl1, cosplay)).toBe(false);
  });
});

describe("isCompatible", () => {
  it("accepts the empty set and unrelated constraints", () => {
    expect(isCompatible([])).toBe(true);
    expect(isCompatible([sl1, cosplay, bowOnly])).toBe(true);
  });

  it("rejects conflicting constraints", () => {
    expect(isCompatible([cosplay, sl1, noArmor])).toBe(false);
  });

  it("rejects two constraints from the same exclusive group", () => {
    expect(isCompatible([bowOnly, specificWeapon])).toBe(false);
  });

  it("rejects missing requirements and accepts them once present", () => {
    expect(isCompatible([dependent])).toBe(false);
    expect(isCompatible([dependent, sl1])).toBe(true);
  });

  it("rejects duplicates", () => {
    expect(isCompatible([sl1, sl1])).toBe(false);
  });
});
