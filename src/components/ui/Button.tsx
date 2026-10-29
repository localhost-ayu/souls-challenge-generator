import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "quiet";

const base =
  "inline-flex items-center justify-center gap-2 rounded-sm font-sans font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary:
    "bg-ember px-6 py-3 text-lg text-abyss hover:bg-ember-glow disabled:hover:bg-ember",
  secondary:
    "border border-stone-600 px-5 py-2.5 text-base text-bone hover:border-ember hover:text-ember-glow",
  quiet:
    "px-1 py-1 text-base text-parchment underline decoration-stone-600 underline-offset-4 hover:text-bone hover:decoration-ember",
};

export function buttonClass(variant: Variant = "secondary", extra = ""): string {
  return `${base} ${variants[variant]} ${extra}`.trim();
}

export function Button({
  variant,
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return <button type={type} className={buttonClass(variant, className)} {...props} />;
}

export function ButtonLink({
  variant,
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={buttonClass(variant, className)} {...props} />;
}
