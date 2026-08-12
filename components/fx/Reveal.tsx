"use client";

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useReveal } from "./use-reveal";

type Effect = "rise" | "fade" | "scale" | "blur" | "slide-left" | "slide-right";

/**
 * Scroll reveal. Rendered visible in SSR; the hidden pre-reveal state is CSS
 * gated on html[data-reveal-ready] (see app/globals.css and useReveal), so the
 * content is never invisible when JavaScript is absent or slow. Same effects,
 * durations and easing as the previous framer-motion version.
 */
export function Reveal({
  children,
  effect = "rise",
  delay = 0,
  duration = 0.7,
  once = true,
  amount = 0.25,
  className,
}: {
  children: ReactNode;
  effect?: Effect;
  delay?: number;
  duration?: number;
  once?: boolean;
  amount?: number;
  className?: string;
}) {
  const ref = useReveal<HTMLDivElement>({ once, amount });
  return (
    <div
      ref={ref}
      className={cn("reveal", className)}
      data-reveal={effect}
      style={
        { "--reveal-dur": `${duration}s`, "--reveal-delay": `${delay}s` } as CSSProperties
      }
    >
      {children}
    </div>
  );
}

/**
 * Staggers its direct children into view. The per-child delay is applied by
 * the `.reveal-stagger` CSS (nth-child transition delays), so `<Item>` can stay
 * a plain wrapper and no per-child JS is needed.
 */
export function Stagger({
  children,
  delay = 0,
  once = true,
  amount = 0.2,
  className,
}: {
  children: ReactNode;
  /** Retained for API compatibility; the visual gap is fixed in CSS. */
  gap?: number;
  delay?: number;
  once?: boolean;
  amount?: number;
  className?: string;
}) {
  const ref = useReveal<HTMLDivElement>({ once, amount });
  return (
    <div
      ref={ref}
      className={cn("reveal-stagger", className)}
      style={{ "--reveal-delay": `${delay}s` } as CSSProperties}
    >
      {children}
    </div>
  );
}

/**
 * A single staggered child. The motion comes from the parent `.reveal-stagger`
 * targeting its direct children, so this is just a styled wrapper. `effect` and
 * `duration` are kept in the signature for call-site compatibility.
 */
export function Item({
  children,
  className,
}: {
  children: ReactNode;
  effect?: Effect;
  duration?: number;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}
