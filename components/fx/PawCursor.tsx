"use client";

import { useEffect, useRef, useState } from "react";

/** Elements that should trigger the enlarged / highlighted paw state. */
const INTERACTIVE =
  'a,button,input,textarea,select,label,summary,[role="button"],[role="link"],.group,[data-cursor="hover"]';

/**
 * KGP PAWS custom cursor — a paw print that trails the pointer with easing,
 * pops + highlights over interactive elements, and stamps a ripple on click.
 *
 * - Desktop only: activates solely for a fine pointer with hover
 *   ((hover: hover) and (pointer: fine)); touch/coarse devices keep the
 *   native cursor and this renders nothing.
 * - Reduced motion: the paw still shows but follows instantly and the
 *   bounce/ripple are suppressed (the global reduced-motion rule in
 *   globals.css also neutralises any transitions).
 * - Never blocks input: everything is pointer-events:none and aria-hidden;
 *   the native cursor is only hidden after the first real mouse move.
 */
export function PawCursor() {
  const [enabled, setEnabled] = useState(false);
  const pawRef = useRef<HTMLDivElement | null>(null);
  const rippleRef = useRef<HTMLDivElement | null>(null);

  // Eligibility — precise pointer with hover (i.e. a real mouse).
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const apply = () => setEnabled(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const paw = pawRef.current;
    const rippleLayer = rippleRef.current;
    if (!paw || !rippleLayer) return;

    const reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = reduceMq.matches;
    const onReduce = () => (reduced = reduceMq.matches);
    reduceMq.addEventListener?.("change", onReduce);

    let tx = -100;
    let ty = -100;
    let cx = -100;
    let cy = -100;
    let started = false;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!started) {
        started = true;
        // Only now hide the native cursor — guarantees the paw is placed first.
        document.documentElement.classList.add("paw-cursor-active");
        if (reduced) {
          cx = tx;
          cy = ty;
        }
        paw.style.opacity = "1";
      }
    };

    const onEnter = () => {
      if (started) paw.style.opacity = "1";
    };
    const onLeave = () => {
      paw.style.opacity = "0";
    };

    const onOver = (e: Event) => {
      const target = e.target as Element | null;
      paw.classList.toggle("is-hover", !!target?.closest?.(INTERACTIVE));
    };

    const onDown = () => {
      paw.classList.add("is-down");
      if (reduced) return;
      const ripple = document.createElement("span");
      ripple.className = "paw-ripple";
      ripple.style.left = `${tx}px`;
      ripple.style.top = `${ty}px`;
      rippleLayer.appendChild(ripple);
      ripple.addEventListener("animationend", () => ripple.remove());
      window.setTimeout(() => ripple.remove(), 800);
    };
    const onUp = () => paw.classList.remove("is-down");

    const loop = () => {
      const ease = reduced ? 1 : 0.22;
      cx += (tx - cx) * ease;
      cy += (ty - cy) * ease;
      paw.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseover", onOver, { passive: true });
    window.addEventListener("mousedown", onDown, { passive: true });
    window.addEventListener("mouseup", onUp, { passive: true });
    document.addEventListener("mouseenter", onEnter);
    document.addEventListener("mouseleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      reduceMq.removeEventListener?.("change", onReduce);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.removeEventListener("mouseenter", onEnter);
      document.removeEventListener("mouseleave", onLeave);
      document.documentElement.classList.remove("paw-cursor-active");
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div ref={rippleRef} aria-hidden className="paw-ripple-layer" />
      <div ref={pawRef} aria-hidden className="paw-cursor">
        <span className="paw-cursor__center">
          <span className="paw-cursor__pop">
            <svg viewBox="0 0 40 40" className="paw-cursor__svg" aria-hidden="true">
              {/* main pad */}
              <ellipse cx="20" cy="27" rx="8.5" ry="7" fill="currentColor" />
              {/* toe beans */}
              <ellipse cx="8.5" cy="18.5" rx="3.1" ry="4.2" fill="currentColor" transform="rotate(-18 8.5 18.5)" />
              <ellipse cx="15.5" cy="12.5" rx="3.2" ry="4.6" fill="currentColor" transform="rotate(-6 15.5 12.5)" />
              <ellipse cx="24.5" cy="12.5" rx="3.2" ry="4.6" fill="currentColor" transform="rotate(6 24.5 12.5)" />
              <ellipse cx="31.5" cy="18.5" rx="3.1" ry="4.2" fill="currentColor" transform="rotate(18 31.5 18.5)" />
            </svg>
          </span>
        </span>
      </div>
    </>
  );
}
