import type { ConstraintCategory } from "@/engine";

/* Original line icons, one per rule category. */
const PATHS: Record<ConstraintCategory, string> = {
  // A single upward notch, struck through: no leveling.
  level: "M6 18h12M12 15V6m0 0-4 4m4-4 4 4M5 5l14 14",
  // A blade.
  equipment: "M14.5 4.5 19.5 4.5 19.5 9.5 10 19 5 19 5 14ZM8 16l-3 3",
  // Footsteps.
  movement:
    "M8 5c1.4 0 2 1.4 2 3.2S9.2 12 8 12s-2-1.6-2-3.8S6.6 5 8 5Zm8 6c1.4 0 2 1.4 2 3.2S17.2 18 16 18s-2-1.6-2-3.8.6-3.2 2-3.2ZM7 14.5h2M15 20.5h2",
  // Two crossed blades.
  combat: "M5 5l14 14M19 5 5 19M5 5h3M5 5v3M19 5h-3M19 5v3M8 19l-3-3M16 19l3-3",
  // A flask.
  resource: "M10 3h4M10.5 3v5L6.5 15a4 4 0 0 0 3.5 6h4a4 4 0 0 0 3.5-6l-4-7V3M8 15h8",
  // A spiral.
  absurd: "M12 12a1 1 0 0 1 2 0 3 3 0 0 1-6 0 5 5 0 0 1 10 0 7 7 0 0 1-14 0",
  // A mask.
  style:
    "M5 6c4.5-1.5 9.5-1.5 14 0 0 7-3 12-7 12S5 13 5 6Zm3.5 4.5h2.5M13 10.5h2.5M10 14.5c1.3.8 2.7.8 4 0",
};

export function ConstraintIcon({
  category,
  className,
}: {
  category: ConstraintCategory;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={PATHS[category]} />
    </svg>
  );
}
