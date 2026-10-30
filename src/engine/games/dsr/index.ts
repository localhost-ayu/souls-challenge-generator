import type { GameModule } from "../../core/types";
import { dsrConstraints, resolveDsrLoadout, type DsrPools } from "./constraints";
import { dsrData } from "./dataset";
import type { DsrData } from "./schema";

export const dsrModule: GameModule<DsrData, DsrPools> = {
  id: "dsr",
  rulesetVersion: 6,
  data: dsrData,
  catalog: {
    classes: dsrData.classes,
    weapons: dsrData.weapons,
    armorSets: dsrData.armorSets,
    bosses: dsrData.bosses,
  },
  constraints: dsrConstraints,
  objectives: [{ id: "main-bosses" }, { id: "all-bosses" }, { id: "min-bosses" }],
  // Missable armor is never offered: cosplay must not hinge on a set the
  // player may already have lost. Weapons are filtered in the resolver.
  createPools: (preferences) => ({
    classes: dsrData.classes,
    weapons: dsrData.weapons.filter((w) => preferences.includeDlc || !w.dlc),
    spells: dsrData.spells.filter((s) => preferences.includeDlc || !s.dlc),
    armorSets: dsrData.armorSets.filter(
      (s) => !s.missable && (preferences.includeDlc || !s.dlc),
    ),
  }),
  resolve: resolveDsrLoadout,
};
