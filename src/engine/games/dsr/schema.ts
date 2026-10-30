import { z } from "zod";

const idSchema = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "ids must be kebab-case");

const statSchema = z.number().int().min(1).max(99);
const requirementSchema = z.number().int().min(0).max(99);

export const weaponCategorySchema = z.enum([
  "dagger",
  "straight-sword",
  "greatsword",
  "ultra-greatsword",
  "curved-sword",
  "curved-greatsword",
  "katana",
  "thrusting-sword",
  "axe",
  "great-axe",
  "hammer",
  "great-hammer",
  "spear",
  "halberd",
  "whip",
  "fist",
  "bow",
  "greatbow",
  "crossbow",
  "catalyst",
  "talisman",
  "pyromancy-flame",
]);

export const regionSchema = z.enum([
  "northern-undead-asylum",
  "firelink-shrine",
  "undead-burg",
  "undead-parish",
  "depths",
  "blighttown",
  "valley-of-drakes",
  "darkroot-garden",
  "darkroot-basin",
  "new-londo-ruins",
  "sens-fortress",
  "anor-londo",
  "painted-world-of-ariamis",
  "the-catacombs",
  "tomb-of-the-giants",
  "demon-ruins",
  "lost-izalith",
  "dukes-archives",
  "crystal-cave",
  "ash-lake",
  "sanctuary-garden",
  "royal-wood",
  "oolacile-township",
]);

/** Every way a weapon can be obtained in one playthrough. */
export const weaponSourceSchema = z.enum([
  "found",
  "merchant",
  "enemy-drop",
  // Ascended from a boss soul (or a golem core) at a blacksmith.
  "boss-soul",
  "tail-cut",
  // Given, dropped or traded by a named NPC, or tied to a questline.
  "npc",
]);

export const startingClassSchema = z.strictObject({
  id: idSchema,
  name: z.string().min(1),
  soulLevel: z.number().int().min(1),
  attributes: z.strictObject({
    vit: statSchema,
    att: statSchema,
    end: statSchema,
    str: statSchema,
    dex: statSchema,
    res: statSchema,
    int: statSchema,
    fai: statSchema,
  }),
  startingEquipment: z.strictObject({
    weapons: z.array(idSchema).min(1),
    // The set the class starts in, even if it starts without every piece.
    armorSet: idSchema.nullable(),
  }),
});

export const weaponSchema = z.strictObject({
  id: idSchema,
  name: z.string().min(1),
  category: weaponCategorySchema,
  requirements: z.strictObject({
    str: requirementSchema,
    dex: requirementSchema,
    int: requirementSchema,
    fai: requirementSchema,
  }),
  sources: z.array(weaponSourceSchema).min(1),
  // Highest reinforcement level: 15 on the regular path, 5 for unique, dragon
  // and boss weapons, 0 for what cannot be reinforced (catalysts, talismans).
  maxUpgrade: z.union([z.literal(0), z.literal(5), z.literal(15)]),
  // Approximate area where it is first obtainable; omitted for starting
  // items and drops spread across many areas.
  region: regionSchema.optional(),
  // Can be lost for good within one playthrough: tail cuts, boss soul
  // choices, NPC questlines.
  missable: z.boolean(),
  dlc: z.boolean(),
});

export const armorSetSchema = z.strictObject({
  id: idSchema,
  name: z.string().min(1),
  pieces: z
    .strictObject({
      head: z.string().min(1).optional(),
      chest: z.string().min(1).optional(),
      hands: z.string().min(1).optional(),
      legs: z.string().min(1).optional(),
    })
    .refine((pieces) => Object.keys(pieces).length > 0, {
      message: "an armor set needs at least one piece",
    }),
  missable: z.boolean(),
  dlc: z.boolean(),
});

export const bossSchema = z
  .strictObject({
    id: idSchema,
    name: z.string().min(1),
    // Must be defeated to finish the base game.
    required: z.boolean(),
    dlc: z.boolean(),
  })
  .refine((boss) => !(boss.required && boss.dlc), {
    message: "dlc bosses cannot be required to finish the base game",
  });

export const dsrDataSchema = z
  .strictObject({
    classes: z.array(startingClassSchema).min(1),
    weapons: z.array(weaponSchema).min(1),
    armorSets: z.array(armorSetSchema).min(1),
    bosses: z.array(bossSchema).min(1),
  })
  .superRefine((data, ctx) => {
    for (const key of ["classes", "weapons", "armorSets", "bosses"] as const) {
      const seen = new Set<string>();
      data[key].forEach((entry, index) => {
        if (seen.has(entry.id)) {
          ctx.addIssue({
            code: "custom",
            message: `duplicate id "${entry.id}"`,
            path: [key, index, "id"],
          });
        }
        seen.add(entry.id);
      });
    }

    const weaponIds = new Set(data.weapons.map((weapon) => weapon.id));
    const armorSetIds = new Set(data.armorSets.map((set) => set.id));

    data.classes.forEach((startingClass, index) => {
      const { weapons, armorSet } = startingClass.startingEquipment;
      weapons.forEach((weaponId, weaponIndex) => {
        if (!weaponIds.has(weaponId)) {
          ctx.addIssue({
            code: "custom",
            message: `unknown weapon "${weaponId}"`,
            path: ["classes", index, "startingEquipment", "weapons", weaponIndex],
          });
        }
      });
      if (armorSet !== null && !armorSetIds.has(armorSet)) {
        ctx.addIssue({
          code: "custom",
          message: `unknown armor set "${armorSet}"`,
          path: ["classes", index, "startingEquipment", "armorSet"],
        });
      }
    });
  });

export type StartingClass = z.infer<typeof startingClassSchema>;
export type Weapon = z.infer<typeof weaponSchema>;
export type WeaponCategory = z.infer<typeof weaponCategorySchema>;
export type ArmorSet = z.infer<typeof armorSetSchema>;
export type Boss = z.infer<typeof bossSchema>;
export type Region = z.infer<typeof regionSchema>;
export type WeaponSource = z.infer<typeof weaponSourceSchema>;
export type DsrData = z.infer<typeof dsrDataSchema>;
