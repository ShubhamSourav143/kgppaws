"use client";

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useReveal } from "@/components/fx/use-reveal";

/**
 * Fade-up scroll reveal. Rendered visible in SSR; the hidden pre-reveal state
 * is CSS gated on html[data-reveal-ready], so content is never invisible when
 * JavaScript is absent or slow (the framer-motion version server-rendered
 * opacity:0). Reduced motion is honoured by the CSS, not a JS branch.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  y = 28,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  const ref = useReveal<HTMLDivElement>({ once: true, amount: 0.2 });
  return (
    <div
      ref={ref}
      className={cn("reveal", className)}
      data-reveal="rise"
      style={
        { "--reveal-y": `${y}px`, "--reveal-delay": `${delay}s` } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
