import type { Metadata } from "next";
import { Alegreya_Sans, Cinzel, EB_Garamond } from "next/font/google";
import { Atmosphere } from "@/components/layout/Atmosphere";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { I18nProvider } from "@/i18n/I18nProvider";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const garamond = EB_Garamond({
  variable: "--font-garamond",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const alegreyaSans = Alegreya_Sans({
  variable: "--font-alegreya-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Souls Challenge Generator",
    template: "%s | Souls Challenge Generator",
  },
  description:
    "Generate coherent, reproducible challenge runs for Dark Souls Remastered and share them with a seed.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-US"
      className={`${cinzel.variable} ${garamond.variable} ${alegreyaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <I18nProvider>
          <Atmosphere />
          <div className="relative z-10 flex min-h-dvh flex-col">
            <SiteHeader />
            <main id="content" className="flex-1">
              {children}
            </main>
            <SiteFooter />
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}
