import type { Metadata } from "next";
import { AboutContent } from "@/components/about/AboutContent";

// Metadata is static (en-US); the visible page follows the chosen locale.
export const metadata: Metadata = {
  title: "About",
  description:
    "What Souls Challenge Generator is, how its runs stay coherent, and the legal notice.",
};

export default function AboutPage() {
  return <AboutContent />;
}
