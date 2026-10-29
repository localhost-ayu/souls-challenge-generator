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
  categories: {
    level: true,
    equipment: true,
    movement: true,
    resource: true,
    style: true,
  },
};

// Locked by the engine snapshot: Wanderer with sl1, no-rolling, no-estus, no-magic.
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

    expect(screen.getByRole("heading", { name: "Wanderer" })).toBeTruthy();
    expect(screen.getByText("Soul Level 1")).toBeTruthy();
    expect(screen.getByText("Never drink from the Estus Flask.")).toBeTruthy();
    expect(screen.getByText("Every boss")).toBeTruthy();
    expect(screen.getByText("Defeat all 26 bosses.")).toBeTruthy();
    expect(screen.getByText(run.seed)).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(run.constraints.length);
  });

  it("follows the language while keeping game names untranslated", () => {
    renderCard();

    act(() => setLocale("pt-BR"));

    expect(screen.getByText("Sem rolar")).toBeTruthy();
    expect(screen.getByText("Derrote todos os 26 bosses.")).toBeTruthy();
    expect(screen.getByText("Morto-vivo Escolhido")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Wanderer" })).toBeTruthy();
  });
});
