"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export function Progress({
  value,
  className,
  label,
}: {
  value: number; // 0–100
  className?: string;
  label?: string;
}) {
  const reduce = useReducedMotion();
  const v = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={v}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? "Progress"}
      className={cn("h-2.5 w-full overflow-hidden rounded-full bg-sand-light", className)}
    >
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-forest to-forest-bright"
        initial={reduce ? { width: `${v}%` } : { width: 0 }}
        whileInView={{ width: `${v}%` }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}
