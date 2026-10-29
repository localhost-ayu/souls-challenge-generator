import type { Metadata } from "next";
import { Suspense } from "react";
import { RunLoading, RunView } from "@/components/run/RunView";

export const metadata: Metadata = {
  title: "Your run",
  description: "A Dark Souls Remastered challenge run, rebuilt from its seed.",
};

// The seed lives in the query string, which only exists in the browser for
// a static export, so the run renders behind a Suspense boundary.
export default function RunPage() {
  return (
    <Suspense fallback={<RunLoading />}>
      <RunView />
    </Suspense>
  );
}
