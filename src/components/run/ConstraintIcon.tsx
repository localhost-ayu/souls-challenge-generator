import type { ConstraintCategory } from "@/engine";

/* Original line icons, one per rule category. */
const PATHS: Record<ConstraintCategory, string[]> = {
  // Climbing steps.
  level: ["M3 20h5v-5h5v-5h5V5h3", "M3 20h18"],
  // A blade.
  equipment: ["M20 4v3.5l-9 9L7.5 13l9-9z", "M5.5 11.5l7 7", "M8.5 15.5 4 20"],
  // Speed lines and an arrow.
  movement: ["M3 8h8", "M3 12h12", "M3 16h6", "M15 7l5 5-5 5"],
  // Crossed swords.
  combat: [
    "M4.5 4.5 15 15",
    "M19.5 4.5 9 15",
    "M13 17.5l4.5-4.5",
    "M6.5 13l4.5 4.5",
    "M16.5 16.5l3 3",
    "M7.5 16.5l-3 3",
  ],
  // A flask.
  resource: [
    "M9.5 3h5",
    "M10.5 3v5.5L6 16a3.5 3.5 0 0 0 3 5h6a3.5 3.5 0 0 0 3-5l-4.5-7.5V3",
    "M7.3 14.5h9.4",
  ],
  // A helm.
  style: ["M5 21v-8.5a7 7 0 0 1 14 0V21", "M5 15h14", "M12 15v6", "M8.5 11h7"],
  // A die; drawn separately below for its pips.
  absurd: [],
};

export function ConstraintIcon({
  category,
  className,
  size = 24,
}: {
  category: ConstraintCategory;
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {PATHS[category].map((d) => (
        <path key={d} d={d} />
      ))}
      {category === "absurd" && (
        <>
          <rect x="4" y="4" width="16" height="16" rx="3" />
          {[
            [9, 9],
            [15, 9],
            [12, 12],
            [9, 15],
            [15, 15],
          ].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="0.9" />
          ))}
        </>
      )}
    </svg>
  );
}
