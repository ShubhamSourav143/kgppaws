"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

/** Animated impact counter — counts up when scrolled into view. */
export function Counter({
  value,
  suffix = "",
  duration = 1.6,
}: {
  value: number;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView || reduce) return;
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / (duration * 1000));
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * value));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration, reduce]);

  // reduced motion skips the rAF loop entirely — show the final value as
  // soon as it's in view, computed during render instead of via setState
  const shown = inView && reduce ? value : display;

  return (
    <span ref={ref}>
      {shown.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}
