"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { EmberMark } from "@/components/icons/EmberMark";
import { useTranslation } from "@/i18n/useTranslation";
import { LanguageSwitcher } from "./LanguageSwitcher";

const NAV_ITEMS = [
  { href: "/", key: "nav.home" },
  { href: "/play", key: "nav.play" },
  { href: "/history", key: "nav.history" },
  { href: "/about", key: "nav.about" },
] as const;

export function SiteHeader() {
  const { t } = useTranslation();
  const pathname = usePathname();

  return (
    <>
      <a href="#content" className="skip-link">
        {t("common.skipToContent")}
      </a>
      <header className="site-header">
        <div className="page">
          <Link href="/" className="logo" aria-label={`${t("common.appName")}, ${t("nav.home")}`}>
            <EmberMark width={30} height={30} />
            <span>
              Souls Challenge<small>Generator</small>
            </span>
          </Link>

          <div className="nav">
            <nav aria-label={t("nav.label")}>
              <ul>
                {NAV_ITEMS.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={pathname === item.href ? "page" : undefined}
                    >
                      {t(item.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <LanguageSwitcher />
          </div>
        </div>
      </header>
    </>
  );
}
