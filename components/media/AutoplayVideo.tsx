"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared decorative autoplay video: muted, looped, inline, and — the point of
 * this component — reduced-motion-aware and network-frugal.
 *
 *  • preload="metadata" (not the browser default of "auto") so the homepage and
 *    Our Work slideshow don't eagerly pull several MB of .mp4 on mobile data
 *    before the clip is even in view. The first frame still shows.
 *  • Pauses (and never auto-plays) under prefers-reduced-motion. useReducedMotion
 *    is null during SSR, so gating the `autoPlay` attribute alone would still let
 *    the video start before hydration corrected it; pausing via the ref runs the
 *    moment the element exists and can't be beaten by the browser.
 *  • `poster` renders instantly and avoids a black box while metadata loads.
 */
export function AutoplayVideo({
  src,
  poster,
  className,
  ariaLabel,
}: {
  src: string;
  poster?: string;
  className?: string;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.pause();
    }
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      autoPlay
      loop
      muted
      playsInline
      preload="metadata"
      aria-label={ariaLabel}
      className={cn("h-full w-full", className)}
    />
  );
}
