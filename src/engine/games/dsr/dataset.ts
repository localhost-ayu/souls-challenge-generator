import armorSets from "./data/armor-sets.json";
import bosses from "./data/bosses.json";
import classes from "./data/classes.json";
import spells from "./data/spells.json";
import weapons from "./data/weapons.json";
import { dsrDataSchema, type DsrData } from "./schema";

export const dsrData: DsrData = dsrDataSchema.parse({
  classes,
  weapons,
  spells,
  armorSets,
  bosses,
});
