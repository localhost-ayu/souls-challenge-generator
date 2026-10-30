import type { ReactNode, SVGProps } from "react";

/* Original line icons, 24×24 with a 1.5 stroke. */
const ICONS = {
  copy: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="1.5" />
      <path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8" />
    </>
  ),
  link: (
    <>
      <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" />
    </>
  ),
  share: (
    <>
      <path d="M12 15V3.5" />
      <path d="M8 7l4-4 4 4" />
      <path d="M6 11H5v9h14v-9h-1" />
    </>
  ),
  star: <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />,
  reroll: (
    <>
      <path d="M20 11a8 8 0 0 0-14.3-4.9L4 8" />
      <path d="M4 4v4h4" />
      <path d="M4 13a8 8 0 0 0 14.3 4.9L20 16" />
      <path d="M20 20v-4h-4" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </>
  ),
  flame: <path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-3.5 2.5-5 .5 2 1.5 3 2.5 3 0-3-1-5.5 0-8z" />,
  dice: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <circle cx="9" cy="9" r="0.9" />
      <circle cx="15" cy="15" r="0.9" />
      <circle cx="12" cy="12" r="0.9" />
    </>
  ),
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  chevron: <path d="M6 9l6 6 6-6" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="1.5" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  alert: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.5v.01" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  cross: <path d="M6 6l12 12M18 6 6 18" />,
  diamond: <path d="M12 3 21 12l-9 9-9-9z" />,
  objective: (
    <>
      <path d="M12 3v13" />
      <path d="M9 6.5h6" />
      <path d="M4 21c1.6-3 4.6-4.5 8-4.5s6.4 1.5 8 4.5" />
    </>
  ),
  bonfire: (
    <>
      <path d="M12 5v10" />
      <path d="M9.5 8h5" />
      <path d="M4 20c1.6-3 4.6-4.5 8-4.5s6.4 1.5 8 4.5" />
    </>
  ),
  embers: (
    <>
      <path d="M12 5v10" />
      <path d="M9.5 8h5" />
      <path d="M4 20c1.6-3 4.6-4.5 8-4.5s6.4 1.5 8 4.5" />
      <path d="M16.5 3c1.2 1.1-1.2 2.2 0 3.3" />
      <path d="M7.5 4.5c1 .9-1 1.8 0 2.7" />
    </>
  ),
  hourglass: (
    <>
      <path d="M7 3h10M7 21h10" />
      <path d="M8 3v3l4 6-4 6v3" />
      <path d="M16 3v3l-4 6 4 6v3" />
    </>
  ),
  cracked: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12.5 3.5 11 8.5l3 3-2.5 4 1 5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M9 7V4.5h6V7" />
      <path d="M6.5 7l1 13h9l1-13" />
      <path d="M10 11v5M14 11v5" />
    </>
  ),
  card: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="1.5" />
      <path d="M4 9h16" />
      <path d="M8 13h4" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z" />
      <path d="M12 8v5M12 16v.01" />
    </>
  ),
  code: <path d="M8 17l-5-5 5-5M16 7l5 5-5 5" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.5 2.5 3.5 5.5 3.5 8.5s-1 6-3.5 8.5c-2.5-2.5-3.5-5.5-3.5-8.5s1-6 3.5-8.5z" />
    </>
  ),
  external: <path d="M7 17 17 7M9 7h8v8" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof ICONS;

export function Icon({
  name,
  size = 20,
  filled = false,
  ...props
}: { name: IconName; size?: number; filled?: boolean } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {ICONS[name]}
    </svg>
  );
}
