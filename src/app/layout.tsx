import type { Metadata, Viewport } from "next";
import { Cinzel, EB_Garamond, Inter } from "next/font/google";
import { Atmosphere } from "@/components/layout/Atmosphere";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { I18nProvider } from "@/i18n/I18nProvider";
import { SITE_URL } from "@/lib/site-url";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const garamond = EB_Garamond({
  variable: "--font-garamond",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const description =
  "Generate coherent, reproducible challenge runs for Dark Souls Remastered and share them with a seed.";

export const metadata: Metadata = {
  metadataBase: SITE_URL,
  applicationName: "Souls Challenge Generator",
  title: {
    default: "Souls Challenge Generator",
    template: "%s | Souls Challenge Generator",
  },
  description,
  openGraph: {
    type: "website",
    siteName: "Souls Challenge Generator",
    title: "Souls Challenge Generator",
    description,
    locale: "en_US",
    alternateLocale: ["pt_BR"],
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Souls Challenge Generator: coherent challenge runs for Dark Souls Remastered, shared with a single seed.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-image.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0c0b0a",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-US"
      className={`${cinzel.variable} ${garamond.variable} ${inter.variable} h-full antialiased`}
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
