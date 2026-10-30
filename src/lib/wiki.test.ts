import { describe, expect, it } from "vitest";
import { wikiUrl } from "./wiki";

describe("wikiUrl", () => {
  it("keeps names readable on Fextralife", () => {
    expect(wikiUrl("dsr", "fextralife", "Priscilla's Dagger")).toBe(
      "https://darksouls.wiki.fextralife.com/Priscilla's+Dagger",
    );
    expect(wikiUrl("dsr", "fextralife", "Elite Knight Set")).toBe(
      "https://darksouls.wiki.fextralife.com/Elite+Knight+Set",
    );
  });

  it("slugs names on Wikidot", () => {
    expect(wikiUrl("dsr", "wikidot", "Priscilla's Dagger")).toBe(
      "https://darksouls.wikidot.com/priscilla-s-dagger",
    );
    expect(wikiUrl("dsr", "wikidot", "Black Knight Sword")).toBe(
      "https://darksouls.wikidot.com/black-knight-sword",
    );
  });

  it("uses known Wikidot addresses that differ from the name", () => {
    expect(wikiUrl("dsr", "wikidot", "Artorias' Set")).toBe(
      "https://darksouls.wikidot.com/set-of-artorias",
    );
    expect(wikiUrl("dsr", "wikidot", "Iaito")).toBe("https://darksouls.wikidot.com/iaito-sword");
  });
});
