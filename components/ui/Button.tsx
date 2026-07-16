import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "accent" | "outline" | "ghost" | "light";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-forest text-cream hover:bg-forest-deep shadow-soft hover:-translate-y-px",
  accent:
    "bg-terracotta text-parchment hover:bg-terracotta-deep shadow-soft hover:-translate-y-px",
  outline:
    "border border-forest/25 text-forest hover:bg-mist",
  ghost: "text-forest hover:bg-mist",
  light: "bg-cream text-forest hover:bg-parchment shadow-soft hover:-translate-y-px",
};

const SIZES: Record<Size, string> = {
  sm: "px-4 py-2 text-sm gap-1.5",
  md: "px-5 py-2.5 text-sm gap-2",
  lg: "px-7 py-3.5 text-base gap-2.5",
};

const BASE =
  "inline-flex items-center justify-center rounded-full font-bold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50";

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
      {...props}
    />
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  href,
  children,
  ...props
}: ComponentProps<typeof Link> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
      {...props}
    >
      {children}
    </Link>
  );
}
