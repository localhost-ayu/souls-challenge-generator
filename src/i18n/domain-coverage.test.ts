import { describe, expect, it } from "vitest";
import {
  CONSTRAINT_CATEGORIES,
  DIFFICULTIES,
  getGameConstraints,
  OBJECTIVES,
} from "@/engine";
import { ATTRIBUTES, SPELL_SCHOOLS } from "@/engine/games/dsr/constraints";
import { regionSchema, weaponCategorySchema } from "@/engine/games/dsr/schema";
import { translate, type MessageKey } from "./translate";
import enUS from "./messages/en-US.json";
import ptBR from "./messages/pt-BR.json";

const keys: string[] = [
  ...getGameConstraints("dsr").flatMap(({ id }) => [
    `constraints.${id}.name`,
    `constraints.${id}.description`,
  ]),
  ...[
    ...DIFFICULTIES.map((id) => `difficulties.${id}`),
    ...OBJECTIVES.map((id) => `objectives.${id}`),
    ...CONSTRAINT_CATEGORIES.map((id) => `categories.${id}`),
  ].flatMap((prefix) => [`${prefix}.name`, `${prefix}.description`]),
  ...weaponCategorySchema.options.map((id) => `weaponCategories.${id}`),
  ...regionSchema.options.map((id) => `regions.${id}`),
  ...ATTRIBUTES.map((id) => `attributes.${id}`),
  ...SPELL_SCHOOLS.map((id) => `spellSchools.${id}`),
];

describe("domain translations", () => {
  // Engine ids are dynamic, so the typecheck cannot see these keys.
  it.each([
    ["en-US", enUS],
    ["pt-BR", ptBR],
  ])("cover every engine id in %s", (_, messages) => {
    for (const key of keys) {
      expect(translate(messages, key as MessageKey), key).not.toBe(key);
    }
  });
});
