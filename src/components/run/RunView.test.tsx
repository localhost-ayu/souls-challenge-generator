// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@/i18n/I18nProvider";
import { setLocale } from "@/i18n/locale-store";
import { RunView } from "./RunView";

const navigation = vi.hoisted(() => ({ seed: null as string | null }));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(navigation.seed ? { seed: navigation.seed } : {}),
  useRouter: () => ({ push: vi.fn() }),
}));

function renderView(seed: string | null) {
  navigation.seed = seed;
  return render(
    <I18nProvider>
      <RunView />
    </I18nProvider>,
  );
}

describe("RunView", () => {
  beforeEach(() => {
    localStorage.clear();
    act(() => setLocale("en-US"));
  });
  afterEach(cleanup);

  it("renders the run and records it in the history", () => {
    renderView("DSR-3-68U-PRAISETHESUN");

    expect(screen.getByRole("heading", { name: "Thief" })).toBeTruthy();
    expect(screen.getByText("dsr-3-68u-praisethesun")).toBeTruthy();
    expect(localStorage.getItem("scg:history")).toContain("dsr-3-68u-praisethesun");
  });

  it.each([
    [null, "This link has no seed"],
    ["garbage", "This seed isn't valid"],
    ["dsr-2-68u-abc", "This seed is from an earlier version"],
    ["dsr-9-68u-abc", "This seed is from a newer version"],
    ["dsr-3-000-abc", "No run fits these settings"],
  ])("explains why %s cannot be shown", (seed, title) => {
    renderView(seed);

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(title);
    expect(screen.getByRole("link", { name: "Open the generator" })).toBeTruthy();
  });
});
