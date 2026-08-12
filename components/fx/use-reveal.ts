"use client";

import { useEffect, useRef } from "react";

/**
 * Scroll-reveal primitive shared by fx/Reveal, motion/Reveal and fx/TextReveal.
 *
 * The element is rendered VISIBLE in the server HTML. The hidden pre-reveal
 * state lives in CSS gated behind `html[data-reveal-ready]`, an attribute set
 * synchronously by the boot script in app/layout.tsx before first paint. So:
 *
 *   • JavaScript disabled / bundle fails  → attribute never set → visible.
 *   • JavaScript delayed (slow hydration) → CSS `reveal-floor` fallback reveals
 *     everything after ~2.6s even if this observer never attaches.
 *   • JavaScript healthy                  → this observer adds `.reveal-in` as
 *     the element scrolls into view, exactly as before.
 *
 * That is the whole point of the rewrite: framer-motion used to server-render
 * these wrappers as opacity:0, so a failed or slow bundle left the page blank.
 */
export function useReveal<T extends HTMLElement>(
  { once = true, amount = 0.2 }: { once?: boolean; amount?: number } = {}
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // No IntersectionObserver (very old browser) → just show it.
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("reveal-in");
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-in");
            if (once) io.unobserve(entry.target);
          } else if (!once) {
            entry.target.classList.remove("reveal-in");
          }
        }
      },
      // -8% bottom margin so a reveal fires a touch before its top edge is
      // fully on screen, matching the previous framer-motion viewport feel.
      { threshold: amount, rootMargin: "0px 0px -8% 0px" }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [once, amount]);

  return ref;
}
