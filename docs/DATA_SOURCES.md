# Data sources

The Dark Souls Remastered dataset in `src/engine/games/dsr/data/` holds facts only:
names, numbers, categories and flags. No descriptions or lore are copied.
Each value was checked against at least two of the sources below.

## Sources

- Fextralife Dark Souls Wiki — https://darksouls.wiki.fextralife.com/
  - Classes: https://darksouls.wiki.fextralife.com/Classes and each class page
  - Bosses: https://darksouls.wiki.fextralife.com/Bosses
  - Weapon category pages (Daggers, Straight Swords, Greatswords, Ultra Greatswords, Curved Swords,
    Curved Greatswords, Katanas, Piercing Swords, Axes, Great Axes, Hammers, Great Hammers, Spears,
    Halberds, Whips, Fist Weapons, Bows, Greatbows, Crossbows, Catalysts, Talismans, Pyromancy Flame)
  - Armor set pages (Elite Knight, Black Iron, Catarina, Havel's, Giant, Silver Knight, Artorias',
    Gold-Hemmed Black, Big Hat's, Smough's, Xanthous, Painting Guardian, Holy)
  - Weapon sources and reinforcement: the same category pages, which list how each weapon is
    obtained and its scaling at maximum reinforcement
- Dark Souls Wikidot — https://darksouls.wikidot.com/
  - Classes: https://darksouls.wikidot.com/classes
  - Bosses: https://darksouls.wikidot.com/bosses
  - Weapons: https://darksouls.wikidot.com/weapons and the category pages (daggers, straightswords,
    greatswords, ultra-greatswords, katanas, axes, hammers, spears, halberds, bows, crossbows,
    catalysts, talismans, pyromancy-flame)
  - Upgrade paths: https://darksouls.wikidot.com/unique, https://darksouls.wikidot.com/dragon,
    https://darksouls.wikidot.com/demon
  - Boss soul items: https://darksouls.wikidot.com/boss-soul-items

## Judgement calls

- **Required bosses**: Fextralife lists Ceaseless Discharge as required; Wikidot lists it as
  optional. It can be avoided entirely, so the dataset marks it optional (12 required bosses).
- **Missable**: an item is `missable` when it can be lost for good within one playthrough through
  normal play: cutting a tail, spending a boss soul on something else, or an NPC questline.
- **Region**: the approximate area where an item is first obtainable. It is left out for starting
  items and for drops spread across many areas.
- **Sources**: `found` (picked up in the world), `merchant`, `enemy-drop`, `boss-soul` (ascended
  from a boss soul or golem core), `tail-cut`, and `npc` (dropped, given or traded by a named NPC,
  including invaders such as Maneater Mildred). A weapon lists every source that applies.
- **Max reinforcement**: 15 for the regular path, 5 for unique (twinkling titanite), dragon (dragon
  scale) and boss (demon titanite) weapons, 0 for catalysts and talismans, which cannot be
  reinforced. The Pyromancy Flame counts as 15; its ascended form is not modelled.
- **Excluded weapons**: items that only exist after the final boss (Great Lord Greatsword) or that
  come from covenant ranks are not part of the dataset.
- **Armor set names** follow the wiki convention (e.g. "Warrior Set"), since sets are not named
  in-game. Piece names follow the in-game names as listed by the sources.
