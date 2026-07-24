"use client";

import { useEffect, useRef, useState } from "react";

/** Elements that trigger the enlarged / highlighted paw state. */
const INTERACTIVE =
  'a,button,input,textarea,select,label,summary,[role="button"],[role="link"],.group,[data-cursor="hover"]';

// walk tuning
const EASE = 0.2; // body follow
const DIR_EASE = 0.15; // heading smoothing
const ALONG = 8; // front/back stagger (px)
const PERP = 10; // left/right footprint separation (px)
const AMP = 0.14; // per-step scale pulse
const SPLAY = 10; // resting toe-out (deg)
const WOBBLE = 6; // per-step rotation wobble (deg)

const Paw = ({ variant }: { variant: "a" | "b" }) => (
  <span className={`paw2 paw2--${variant}`}>
    <span className="paw2__fx">
      <svg viewBox="0 0 40 40" className="paw2__svg" aria-hidden="true">
        <ellipse cx="20" cy="27" rx="8.5" ry="7" fill="currentColor" />
        <ellipse cx="8.5" cy="18.5" rx="3.1" ry="4.2" fill="currentColor" transform="rotate(-18 8.5 18.5)" />
        <ellipse cx="15.5" cy="12.5" rx="3.2" ry="4.6" fill="currentColor" transform="rotate(-6 15.5 12.5)" />
        <ellipse cx="24.5" cy="12.5" rx="3.2" ry="4.6" fill="currentColor" transform="rotate(6 24.5 12.5)" />
        <ellipse cx="31.5" cy="18.5" rx="3.1" ry="4.2" fill="currentColor" transform="rotate(18 31.5 18.5)" />
      </svg>
    </span>
  </span>
);

/**
 * KGP PAWS custom cursor — a pair of paw prints that walk alongside the
 * pointer. Both trail the mouse with easing; one leads and one trails
 * (staggered along the travel line), and they alternate a stepping
 * scale/rotation pulse so it reads as an animal padding along. They enlarge
 * and turn brand-green over interactive elements, and stamp a ripple on
 * click.
 *
 * Desktop only ((hover: hover) and (pointer: fine)); touch keeps the native
 * cursor. Reduced motion → paws follow instantly with no stepping/ripple.
 * Everything is pointer-events:none + aria-hidden, and the native cursor is
 * hidden only after the first real move.
 */
export function PawCursor() {
  const [enabled, setEnabled] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const pawARef = useRef<HTMLSpanElement | null>(null);
  const pawBRef = useRef<HTMLSpanElement | null>(null);
  const rippleRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const apply = () => setEnabled(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const root = rootRef.current;
    const pawA = pawARef.current;
    const pawB = pawBRef.current;
    const rippleLayer = rippleRef.current;
    if (!root || !pawA || !pawB || !rippleLayer) return;

    const reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = reduceMq.matches;
    const onReduce = () => (reduced = reduceMq.matches);
    reduceMq.addEventListener?.("change", onReduce);

    let tx = -100;
    let ty = -100;
    let cx = -100;
    let cy = -100;
    let lcx = -100;
    let lcy = -100;
    let dirx = 0;
    let diry = -1; // idle heading: up
    let walk = 0;
    let started = false;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!started) {
        started = true;
        document.documentElement.classList.add("paw-cursor-active");
        root.classList.add("is-visible");
        if (reduced) {
          cx = lcx = tx;
          cy = lcy = ty;
        }
      }
    };
    const onEnter = () => started && root.classList.add("is-visible");
    const onLeave = () => root.classList.remove("is-visible");
    const onOver = (e: Event) => {
      const t = e.target as Element | null;
      root.classList.toggle("is-hover", !!t?.closest?.(INTERACTIVE));
    };
    const onDown = () => {
      root.classList.add("is-down");
      if (reduced) return;
      const ripple = document.createElement("span");
      ripple.className = "paw-ripple";
      ripple.style.left = `${tx}px`;
      ripple.style.top = `${ty}px`;
      rippleLayer.appendChild(ripple);
      ripple.addEventListener("animationend", () => ripple.remove());
      window.setTimeout(() => ripple.remove(), 800);
    };
    const onUp = () => root.classList.remove("is-down");

    const writePaw = (el: HTMLElement, side: number, phase: number, angle: number, activity: number) => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const along = side * ALONG;
      const perp = side * PERP;
      const px = cx + cos * along - sin * perp;
      const py = cy + sin * along + cos * perp;
      const step = 1 + AMP * activity * Math.sin(walk + phase);
      const wob = WOBBLE * activity * Math.sin(walk + phase);
      const rot = (angle * 180) / Math.PI + 90 + side * SPLAY + wob;
      el.style.transform = `translate3d(${px}px, ${py}px, 0) translate(-50%, -50%) rotate(${rot}deg) scale(${step})`;
    };

    const loop = () => {
      const ease = reduced ? 1 : EASE;
      cx += (tx - cx) * ease;
      cy += (ty - cy) * ease;

      const mvx = cx - lcx;
      const mvy = cy - lcy;
      const speed = Math.hypot(mvx, mvy);

      if (!reduced && speed > 0.35) {
        const nx = mvx / speed;
        const ny = mvy / speed;
        dirx += (nx - dirx) * DIR_EASE;
        diry += (ny - diry) * DIR_EASE;
      }
      const angle = reduced ? -Math.PI / 2 : Math.atan2(diry, dirx);
      const activity = reduced ? 0 : Math.min(1, speed / 5);
      walk += reduced ? 0 : speed * 0.09;

      writePaw(pawA, 1, 0, angle, activity);
      writePaw(pawB, -1, Math.PI, angle, activity);

      lcx = cx;
      lcy = cy;
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
      <div ref={rootRef} aria-hidden className="paw-cursor2">
        <span ref={pawARef} className="paw2-slot">
          <Paw variant="a" />
        </span>
        <span ref={pawBRef} className="paw2-slot">
          <Paw variant="b" />
        </span>
      </div>
    </>
  );
}
