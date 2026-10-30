import type { GameId } from "@/engine";

/** Community wikis a player can open to see an item; neither is affiliated with this project. */
export const WIKI_SOURCES = ["fextralife", "wikidot"] as const;
export type WikiSource = (typeof WIKI_SOURCES)[number];

export const WIKI_NAMES: Readonly<Record<WikiSource, string>> = {
  fextralife: "Fextralife",
  wikidot: "Wikidot",
};

const BASE_URLS: Readonly<Record<GameId, Record<WikiSource, string>>> = {
  dsr: {
    fextralife: "https://darksouls.wiki.fextralife.com/",
    wikidot: "https://darksouls.wikidot.com/",
  },
};

// Wikidot pages whose address does not follow the item's name.
const WIKIDOT_SLUGS: Readonly<Record<string, string>> = {
  Iaito: "iaito-sword",
  "Artorias' Set": "set-of-artorias",
};

/**
 * Page for an item, built from its in-game name: Fextralife keeps the name
 * with "+" for spaces ("Priscilla's+Dagger"), Wikidot slugs it
 * ("priscilla-s-dagger").
 */
export function wikiUrl(gameId: GameId, source: WikiSource, name: string): string {
  const path =
    source === "fextralife"
      ? name.split(" ").map(encodeURIComponent).join("+")
      : (WIKIDOT_SLUGS[name] ??
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""));
  return BASE_URLS[gameId][source] + path;
}
