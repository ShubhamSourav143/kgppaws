"use client";

import { motion, useReducedMotion } from "framer-motion";

const MOTION_TAGS = {
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  p: motion.p,
  span: motion.span,
} as const;

/**
 * Editorial word-by-word reveal for display headlines.
 * Renders a plain element for reduced-motion users.
 */
export function TextReveal({
  text,
  as: Tag = "h2",
  className,
  delay = 0,
  once = true,
}: {
  text: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
  delay?: number;
  once?: boolean;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <Tag className={className}>{text}</Tag>;

  const words = text.split(" ");
  const MotionTag = MOTION_TAGS[Tag];

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount: 0.6 }}
      transition={{ staggerChildren: 0.055, delayChildren: delay }}
      aria-label={text}
    >
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom" aria-hidden="true">
          <motion.span
            className="inline-block"
            variants={{
              hidden: { y: "110%", rotate: 4 },
              show: { y: 0, rotate: 0 },
            }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            {word}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </MotionTag>
  );
}
