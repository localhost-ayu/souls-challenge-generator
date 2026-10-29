import type { Metadata } from "next";
import { PlayView } from "@/components/play/PlayView";

export const metadata: Metadata = {
  title: "Start a challenge",
  description: "Pick a difficulty and the kinds of rules you want, then generate a run.",
};

export default function PlayPage() {
  return <PlayView />;
}
