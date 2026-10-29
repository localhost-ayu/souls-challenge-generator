import type { SVGProps } from "react";

/** Original mark: a flame rising from a broken ring. */
export function EmberMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" {...props}>
      <path
        d="M9.5 25.5a10 10 0 1 1 13 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M16 7c1.2 3.4 4.8 5.6 4.8 10a4.8 4.8 0 0 1-9.6 0c0-2.3 1.1-3.6 2.2-4.8.3 1.6 1.1 2.6 2.1 2.9-.4-2.9.1-5.6.5-8.1Z"
        fill="currentColor"
      />
      <path d="M12 27h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
