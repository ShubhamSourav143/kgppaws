"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

type Effect = "rise" | "fade" | "scale" | "blur" | "slide-left" | "slide-right";

const EFFECTS: Record<Effect, Variants> = {
  rise: {
    hidden: { opacity: 0, y: 36 },
    show: { opacity: 1, y: 0 },
  },
  fade: {
    hidden: { opacity: 0 },
    show: { opacity: 1 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.92 },
    show: { opacity: 1, scale: 1 },
  },
  blur: {
    hidden: { opacity: 0, filter: "blur(12px)", y: 18 },
    show: { opacity: 1, filter: "blur(0px)", y: 0 },
  },
  "slide-left": {
    hidden: { opacity: 0, x: 48 },
    show: { opacity: 1, x: 0 },
  },
  "slide-right": {
    hidden: { opacity: 0, x: -48 },
    show: { opacity: 1, x: 0 },
  },
};

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
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      variants={EFFECTS[effect]}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Parent that staggers any nested `<Item>`s when scrolled into view. */
export function Stagger({
  children,
  gap = 0.09,
  delay = 0,
  once = true,
  amount = 0.2,
  className,
}: {
  children: ReactNode;
  gap?: number;
  delay?: number;
  once?: boolean;
  amount?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount }}
      transition={{ staggerChildren: gap, delayChildren: delay }}
    >
      {children}
    </motion.div>
  );
}

export function Item({
  children,
  effect = "rise",
  duration = 0.65,
  className,
}: {
  children: ReactNode;
  effect?: Effect;
  duration?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={EFFECTS[effect]}
      transition={{ duration, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
