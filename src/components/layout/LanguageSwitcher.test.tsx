// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { I18nProvider } from "@/i18n/I18nProvider";
import { setLocale } from "@/i18n/locale-store";
import { useTranslation } from "@/i18n/useTranslation";
import { LanguageSwitcher } from "./LanguageSwitcher";

function AboutLink() {
  const { t } = useTranslation();
  return <a href="/about">{t("nav.about")}</a>;
}

function renderSwitcher() {
  return render(
    <I18nProvider>
      <LanguageSwitcher />
      <AboutLink />
    </I18nProvider>,
  );
}

describe("LanguageSwitcher", () => {
  beforeEach(() => act(() => setLocale("en-US")));
  afterEach(cleanup);

  it("switches the language in place and remembers it", () => {
    renderSwitcher();
    const portuguese = screen.getByRole("button", { name: /Português/ });
    expect(screen.getByRole("link").textContent).toBe("About");

    fireEvent.click(portuguese);

    expect(screen.getByRole("link").textContent).toBe("Sobre");
    expect(portuguese.getAttribute("aria-pressed")).toBe("true");
    expect(document.documentElement.lang).toBe("pt-BR");
    expect(localStorage.getItem("scg:locale")).toBe('{"v":1,"data":"pt-BR"}');
  });

  it("labels the group and keeps the visible code in each name", () => {
    renderSwitcher();

    expect(screen.getByRole("group", { name: "Language" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "English (EN)" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Português (PT)" })).toBeTruthy();
  });
});
