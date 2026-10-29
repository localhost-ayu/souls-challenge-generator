import { describe, expect, it } from "vitest";
import { dsrData } from "./dataset";
import { dsrDataSchema, weaponCategorySchema, type DsrData } from "./schema";

function cloneData(): DsrData {
  return structuredClone(dsrData);
}

describe("dsr dataset", () => {
  it("has all ten starting classes", () => {
    expect(dsrData.classes.map((c) => c.id)).toEqual([
      "warrior",
      "knight",
      "wanderer",
      "thief",
      "bandit",
      "hunter",
      "sorcerer",
      "pyromancer",
      "cleric",
      "deprived",
    ]);
  });

  it("has every base game and dlc boss", () => {
    const base = dsrData.bosses.filter((b) => !b.dlc);
    const dlc = dsrData.bosses.filter((b) => b.dlc);

    expect(base).toHaveLength(22);
    expect(base.filter((b) => b.required)).toHaveLength(12);
    expect(dlc).toHaveLength(4);
  });

  it("covers every weapon category", () => {
    const categories = new Set(dsrData.weapons.map((w) => w.category));

    expect([...categories].sort()).toEqual(
      [...weaponCategorySchema.options].sort(),
    );
  });

  it("lets every class wield its own starting weapons one-handed", () => {
    const weaponsById = new Map(dsrData.weapons.map((w) => [w.id, w]));

    for (const startingClass of dsrData.classes) {
      for (const weaponId of startingClass.startingEquipment.weapons) {
        const { requirements } = weaponsById.get(weaponId)!;

        for (const stat of ["str", "dex", "int", "fai"] as const) {
          expect(
            startingClass.attributes[stat],
            `${startingClass.id} / ${weaponId} / ${stat}`,
          ).toBeGreaterThanOrEqual(requirements[stat]);
        }
      }
    }
  });
});

describe("dsr dataset schema", () => {
  it("rejects duplicate ids", () => {
    const data = cloneData();
    data.weapons.push({ ...data.weapons[0]! });

    const result = dsrDataSchema.safeParse(data);

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/duplicate id/);
  });

  it("rejects starting weapons that do not exist", () => {
    const data = cloneData();
    data.classes[0]!.startingEquipment.weapons = ["moonlight-katana"];

    const result = dsrDataSchema.safeParse(data);

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/unknown weapon/);
  });

  it("rejects starting armor sets that do not exist", () => {
    const data = cloneData();
    data.classes[0]!.startingEquipment.armorSet = "solaire-set";

    const result = dsrDataSchema.safeParse(data);

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/unknown armor set/);
  });

  it("rejects dlc bosses marked as required", () => {
    const data = cloneData();
    data.bosses.push({
      id: "test-boss",
      name: "Test Boss",
      required: true,
      dlc: true,
    });

    expect(dsrDataSchema.safeParse(data).success).toBe(false);
  });

  it("rejects unknown fields so typos in the json fail loudly", () => {
    const data = cloneData();
    Object.assign(data.weapons[0]!, { missible: true });

    expect(dsrDataSchema.safeParse(data).success).toBe(false);
  });

  it("rejects non kebab-case ids", () => {
    const data = cloneData();
    data.bosses[0]!.id = "Asylum Demon";

    expect(dsrDataSchema.safeParse(data).success).toBe(false);
  });
});
