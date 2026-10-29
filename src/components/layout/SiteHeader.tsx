"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { EmberMark } from "@/components/icons/EmberMark";
import { useTranslation } from "@/i18n/useTranslation";
import { LanguageSwitcher } from "./LanguageSwitcher";

const NAV_ITEMS = [
  { href: "/play", key: "nav.play" },
  { href: "/about", key: "nav.about" },
] as const;

export function SiteHeader() {
  const { t } = useTranslation();
  const pathname = usePathname();

  return (
    <>
      <a
        href="#content"
        className="sr-only z-20 rounded-sm bg-bone px-4 py-2 font-sans text-abyss focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {t("common.skipToContent")}
      </a>
      <header className="mx-auto flex w-full max-w-page flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-5 sm:px-8">
      <Link
        href="/"
        className="group flex items-center gap-3 text-bone"
        aria-label={`${t("common.appName")}, ${t("nav.home")}`}
      >
        <EmberMark className="size-8 text-ember transition-colors duration-300 group-hover:text-ember-glow" />
        <span className="font-display text-base font-medium tracking-wide sm:text-lg">
          {t("common.appName")}
        </span>
      </Link>

      <div className="flex items-center gap-5">
        <nav aria-label={t("nav.label")}>
          <ul className="flex gap-5 font-sans text-base">
            {NAV_ITEMS.map((item) => {
              const current = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={current ? "page" : undefined}
                    className={`underline-offset-8 transition-colors duration-200 hover:text-bone ${
                      current
                        ? "text-bone underline decoration-ember decoration-2"
                        : "text-parchment"
                    }`}
                  >
                    {t(item.key)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <LanguageSwitcher />
      </div>
      </header>
    </>
  );
}
