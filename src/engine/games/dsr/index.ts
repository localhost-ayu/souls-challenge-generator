import type { GameModule } from "../../core/types";
import { dsrConstraints, resolveDsrLoadout, type DsrPools } from "./constraints";
import { dsrData } from "./dataset";
import type { DsrData } from "./schema";

export const dsrModule: GameModule<DsrData, DsrPools> = {
  id: "dsr",
  rulesetVersion: 1,
  data: dsrData,
  catalog: {
    classes: dsrData.classes,
    weapons: dsrData.weapons,
    armorSets: dsrData.armorSets,
    bosses: dsrData.bosses,
  },
  constraints: dsrConstraints,
  objectives: [{ id: "main-bosses" }, { id: "all-bosses" }],
  // Missable items are never offered: a run must not hinge on an item the
  // player may already have lost.
  createPools: (preferences) => ({
    classes: dsrData.classes,
    weapons: dsrData.weapons.filter(
      (w) => !w.missable && (preferences.includeDlc || !w.dlc),
    ),
    armorSets: dsrData.armorSets.filter(
      (s) => !s.missable && (preferences.includeDlc || !s.dlc),
    ),
  }),
  resolve: resolveDsrLoadout,
};
