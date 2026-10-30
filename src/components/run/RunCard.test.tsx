// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createSeed, generateRun, type Preferences } from "@/engine";
import { I18nProvider } from "@/i18n/I18nProvider";
import { setLocale } from "@/i18n/locale-store";
import { RunCard } from "./RunCard";

const preferences: Preferences = {
  difficulty: "chosen",
  objective: "all-bosses",
  includeDlc: true,
  houseRules: { buffs: true, summons: false, glitches: false },
  categories: {
    level: true,
    equipment: true,
    movement: true,
    combat: true,
    resource: true,
    style: true,
  },
};

// Locked by the engine snapshot: Sorcerer with no-blocking, boss-no-hit, no-estus, bow-only.
const run = generateRun(createSeed({ gameId: "dsr", preferences, key: "praisethesun" }));

function renderCard() {
  return render(
    <I18nProvider>
      <RunCard run={run} />
    </I18nProvider>,
  );
}

describe("RunCard", () => {
  beforeEach(() => act(() => setLocale("en-US")));
  afterEach(cleanup);

  it("shows the class, translated rules, objective and seed", () => {
    renderCard();

    expect(screen.getByRole("heading", { name: "Sorcerer" })).toBeTruthy();
    expect(screen.getByText("No blocking")).toBeTruthy();
    expect(screen.getByText("Never drink from the Estus Flask.")).toBeTruthy();
    expect(screen.getByText("Every boss")).toBeTruthy();
    expect(screen.getByText("Defeat all 26 bosses.")).toBeTruthy();
    expect(screen.getByText(run.seed)).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(run.constraints.length);
  });

  it("states the house rules so nothing is left to guess", () => {
    renderCard();

    expect(screen.getByRole("heading", { name: "House rules" })).toBeTruthy();
    expect(screen.getAllByText("Allowed")).toHaveLength(1);
    expect(screen.getAllByText("Forbidden")).toHaveLength(2);
  });

  it("shows the values drawn for parameterized rules", () => {
    render(
      <I18nProvider>
        <RunCard
          run={{
            ...run,
            constraints: [
              { id: "specific-weapon", params: { weapon: "claymore" } },
              { id: "weapon-category", params: { weaponCategory: "great-hammer" } },
            ],
          }}
        />
      </I18nProvider>,
    );

    expect(screen.getByText("Weapon").nextSibling?.textContent).toBe("Claymore");
    expect(screen.getByText("Weapon type").nextSibling?.textContent).toBe("Great hammer");
  });

  it("follows the language while keeping game names untranslated", () => {
    renderCard();

    act(() => setLocale("pt-BR"));

    expect(screen.getByText("Sem bloquear")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Regras da casa" })).toBeTruthy();
    expect(screen.getByText("Derrote todos os 26 bosses.")).toBeTruthy();
    expect(screen.getByText("Morto-vivo Escolhido")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Sorcerer" })).toBeTruthy();
  });
});
