import type { Metadata } from "next";
import { HistoryView } from "@/components/history/HistoryView";

export const metadata: Metadata = {
  title: "Your runs",
  description: "Runs you opened and runs you marked as favorite, saved in this browser.",
  robots: { index: false },
};

export default function HistoryPage() {
  return <HistoryView />;
}
