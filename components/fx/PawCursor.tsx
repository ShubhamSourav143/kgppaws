"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/** Elements that trigger the enlarged / highlighted paw state. */
const INTERACTIVE =
  'a,button,input,textarea,select,label,summary,[role="button"],[role="link"],.group,[data-cursor="hover"]';

/**
 * Regions that drop the cursor to a single paw without otherwise highlighting
 * it — site chrome (the fixed navbar, the mobile menu) rather than a target.
 * A walking pair tracking across the navbar reads as clutter over what is
 * really one thin strip, and the bar floats above whichever section happens to
 * be scrolling beneath it, so the section's formation is meaningless there.
 * Marked explicitly rather than by tag: pages here also open with a <header>
 * hero band, which is very much not chrome.
 */
const SOLO_ZONE = '[data-cursor="solo"]';

/** Paw silhouette — one pad + four toes. Shared by the cursor and the click stamp. */
const PAW_SHAPES = [
  { cx: 20, cy: 27, rx: 8.5, ry: 7, rot: 0 },
  { cx: 8.5, cy: 18.5, rx: 3.1, ry: 4.2, rot: -18 },
  { cx: 15.5, cy: 12.5, rx: 3.2, ry: 4.6, rot: -6 },
  { cx: 24.5, cy: 12.5, rx: 3.2, ry: 4.6, rot: 6 },
  { cx: 31.5, cy: 18.5, rx: 3.1, ry: 4.2, rot: 18 },
];

/** Same shapes as an HTML string, for the click stamp built outside React. */
const PAW_MARKUP = PAW_SHAPES.map(
  (s) =>
    `<ellipse cx="${s.cx}" cy="${s.cy}" rx="${s.rx}" ry="${s.ry}" fill="currentColor" transform="rotate(${s.rot} ${s.cx} ${s.cy})"/>`,
).join("");

/**
 * Paw size multiplier. Everything that has to stay in proportion with the
 * artwork — stride, track separation, how far the paws sit off the pointer —
 * is derived from this, so the cursor rescales from one number. The SVG is
 * vector, so it stays crisp at any value; only the CSS `--paw-size` and the
 * click-stamp size in globals.css need to move with it.
 */
const SCALE = 2;

// walk tuning
const EASE = 0.2; // body follow
const DIR_EASE = 0.15; // heading smoothing
/**
 * Single <-> double morph, as exponential-decay time constants in ms: the
 * formation covers ~95% of the change in 3x these. Unlike the per-frame
 * easing used for the follow, these are integrated against real elapsed time,
 * so the durations hold at 30, 60 or 120Hz instead of running twice as fast
 * on a high-refresh display.
 *
 * A section boundary can afford a leisurely change. The answer to "is this
 * clickable?" cannot — it has to land while the pointer is still arriving, so
 * the hover collapse settles in ~195ms, inside the 150–250ms the interaction
 * wants.
 */
const MORPH_TAU_SECTION = 177;
const MORPH_TAU_HOVER = 65;
/** Longest frame to integrate over, so a throttled tab doesn't snap on return. */
const MAX_FRAME_MS = 64;
const ALONG = 9 * SCALE; // stride length: fore/aft swing per paw (px)
const PERP = 11 * SCALE; // left/right track separation (px)
const AMP = 0.14; // per-step scale pulse
const SPLAY = 10; // resting toe-out (deg)
const WOBBLE = 6; // per-step rotation wobble (deg)
const LIFT = 0.16; // opacity dip on the foot that is trailing
const SOLO_GAIN = 0.14; // the lone paw runs slightly larger
const SOLO_STRIDE = 0.5; // ...and keeps half the stride so it still pads along

/**
 * How far the paw cluster sits down-right of the true pointer, in screen
 * space. At this size a centred paw would sit on top of whatever is being
 * pointed at, so the cluster is nudged clear and the pointer lands roughly at
 * its top-left corner — the same relationship a normal cursor hotspot has to
 * its arrow. Screen-space rather than along the heading, so it never swings
 * back over the target as the paws turn.
 */
const OFFSET_X = 18 * SCALE;
const OFFSET_Y = 20 * SCALE;

const BAND_MIN_H = 160; // a page band has to be at least this tall to count (px)
const BAND_MAX_DEPTH = 4; // how far to dig past layout wrappers looking for bands

/** Authored as one band, so never split apart — unlike anonymous wrappers. */
const SEMANTIC_BAND = new Set(["SECTION", "HEADER", "ARTICLE", "ASIDE", "FOOTER", "NAV", "FORM"]);

/**
 * Document-space top of `el`, by layout rather than by painted position.
 * The site runs entrance animations that translate bands into place, and a
 * `getBoundingClientRect()` taken mid-flight would bake that offset into the
 * band boundary; `offsetTop` ignores transforms, so boundaries stay put.
 */
const layoutTop = (el: HTMLElement) => {
  let y = 0;
  let node: HTMLElement | null = el;
  while (node) {
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return y;
};

/**
 * Sections alternate single-paw / double-paw down the page: index 0 (hero) is
 * a single paw, index 1 a pair, index 2 single again, and so on.
 */
const modeFor = (index: number) => (index % 2 === 0 ? "single" : "double");

/**
 * A "section" is any full-width band the page stacks vertically — usually a
 * `<section>`, but pages here also open with a `<header>` band or group
 * content in plain wrappers, so this goes by shape rather than tag name:
 * in-flow, visible, and tall enough to read as its own stretch of page.
 */
const isBand = (el: Element): el is HTMLElement => {
  if (!(el instanceof HTMLElement)) return false;
  if (el.tagName === "SCRIPT" || el.tagName === "STYLE" || el.tagName === "TEMPLATE") return false;
  const cs = getComputedStyle(el);
  // pinned decoration (glows, rails, overlays) rides over bands, it isn't one
  if (cs.position === "fixed" || cs.position === "absolute" || cs.display === "none") return false;
  return el.offsetHeight >= BAND_MIN_H;
};

const Paw = ({ variant }: { variant: "a" | "b" }) => (
  <span className={`paw2 paw2--${variant}`}>
    <span className="paw2__fx">
      <svg viewBox="0 0 40 40" className="paw2__svg" aria-hidden="true">
        {PAW_SHAPES.map((s, i) => (
          <ellipse
            key={i}
            cx={s.cx}
            cy={s.cy}
            rx={s.rx}
            ry={s.ry}
            fill="currentColor"
            transform={`rotate(${s.rot} ${s.cx} ${s.cy})`}
          />
        ))}
      </svg>
    </span>
  </span>
);

/**
 * KGP PAWS custom cursor — paw prints that walk alongside the pointer, and
 * change formation section by section.
 *
 * Odd-numbered sections show a single paw; even-numbered ones show a walking
 * pair. Crossing a section boundary morphs between the two: the second paw
 * slides out from under the first and fades in (or tucks back under and
 * fades out), so nothing pops. In pair mode the two paws swing in antiphase
 * on fixed left/right tracks, trading lead and trail like real footfalls.
 *
 * Hovering anything clickable overrides the section entirely and collapses to
 * a single paw — enlarged, brand-green, with a bounce — so "this is
 * interactive" reads identically everywhere; leaving restores the section's
 * own formation. Clicking stamps a rotated paw print plus a ripple.
 *
 * Desktop only ((hover: hover) and (pointer: fine)); touch keeps the native
 * cursor. Reduced motion → paws follow instantly, no stepping, no stamp, and
 * formation changes snap. Everything is pointer-events:none + aria-hidden,
 * and the native cursor is hidden only after the first real move.
 */
export function PawCursor() {
  const [enabled, setEnabled] = useState(false);
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const pawARef = useRef<HTMLSpanElement | null>(null);
  const pawBRef = useRef<HTMLSpanElement | null>(null);
  const rippleRef = useRef<HTMLDivElement | null>(null);
  /** Bumped on route change so the effect re-indexes the new page's sections. */
  const rescanRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const apply = () => setEnabled(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  // a new route means a new set of sections — re-index so parity restarts at 0
  useEffect(() => {
    rescanRef.current?.();
  }, [pathname]);

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

    // formation: 0 = single paw, 1 = walking pair. `spread` eases toward it.
    let target = 0;
    let spread = 0;
    let placed = false; // first resolve snaps instead of animating
    let stampSide = 1; // click stamps alternate left/right like footsteps

    // The section's own formation, before hover has a say.
    let bandMode = 0;
    // Hovering anything clickable overrides the section and collapses to one
    // paw, so "this is interactive" always reads the same way regardless of
    // which formation the surrounding section happens to use.
    let hovering = false;
    // over site chrome: same collapse to one paw, but no highlight
    let solo = false;
    // whether the in-flight morph was triggered by hover (fast) or by
    // crossing a section boundary (slow)
    let morphFast = false;

    /** Fold the section's formation and both overrides into one target. */
    const applyTarget = () => {
      const next = hovering || solo ? 0 : bandMode;
      if (next === target && placed) return;
      target = next;
      if (!placed || reduced) spread = target; // first placement never animates
      placed = true;
    };

    /* ————— section bands ————— */

    // Where each band starts, in document coordinates. Resolution is
    // geometric rather than a DOM hit-test: it costs one comparison per
    // frame, ignores absolutely-positioned overlays sitting on top of a
    // band, and leaves no uncovered gaps between bands.
    let bandTops: number[] = [];
    let scrollY = window.scrollY;

    /**
     * Adopt the mode of the last band the pointer has scrolled past. Points
     * above the first band take the first band's mode and points below the
     * last (the footer) keep the last, so the whole page is covered.
     */
    const resolve = () => {
      if (!bandTops.length) return;
      const y = ty + scrollY;
      let index = 0;
      for (let i = 1; i < bandTops.length && y >= bandTops[i]; i++) index = i;

      const mode = modeFor(index);
      const next = mode === "double" ? 1 : 0;
      if (next !== bandMode) {
        bandMode = next;
        morphFast = false; // a section change gets the slower, scenic morph
      }
      root.dataset.mode = mode;
      applyTarget();
    };

    // Find the current page's bands in document order. Pages wrap their
    // content differently (a bare fragment, the route template's motion div,
    // one themed shell <div>), so dig past single-child wrappers until
    // reaching the element that actually stacks the page, then split any
    // anonymous wrapper that is really several bands in a trench coat.
    // `data-cursor-section` opts out of the guesswork entirely.
    const scan = () => {
      const main = document.querySelector("main");
      if (!main) return;

      for (const stale of document.querySelectorAll<HTMLElement>("[data-paw-index]")) {
        delete stale.dataset.pawIndex;
      }

      let bands = Array.from(main.querySelectorAll<HTMLElement>("[data-cursor-section]")).filter(
        (el) => !el.parentElement?.closest("[data-cursor-section]"),
      );

      if (!bands.length) {
        bands = Array.from(main.children).filter(isBand);
        for (let depth = 0; depth < BAND_MAX_DEPTH && bands.length === 1; depth++) {
          const kids = Array.from(bands[0].children).filter(isBand);
          if (!kids.length) break; // nothing below: the wrapper is the band
          bands = kids;
        }
        for (let pass = 0; pass < BAND_MAX_DEPTH; pass++) {
          let split = false;
          bands = bands.flatMap((el) => {
            if (SEMANTIC_BAND.has(el.tagName)) return [el];
            const kids = Array.from(el.children).filter(isBand);
            if (kids.length < 2) return [el];
            split = true;
            return kids;
          });
          if (!split) break;
        }
      }

      scrollY = window.scrollY;
      bandTops = bands.map((el, i) => {
        el.dataset.pawIndex = String(i); // not read back; kept for tests/devtools
        return layoutTop(el);
      });

      // boundaries just moved under a possibly stationary pointer
      if (started) resolve();
    };

    // Re-measure whenever the page can have moved under the pointer: a new
    // route, a resize, images landing, an accordion opening. Coalesced into
    // one pass per frame so a burst of mutations still only measures once.
    let pendingScan = 0;
    const queueScan = () => {
      if (pendingScan) return;
      pendingScan = requestAnimationFrame(() => {
        pendingScan = 0;
        scan();
      });
    };
    rescanRef.current = queueScan;

    scan();
    queueScan(); // again next frame, once first layout has settled
    window.addEventListener("load", queueScan);
    const ro = new ResizeObserver(queueScan);
    const mainEl = document.querySelector("main");
    if (mainEl) ro.observe(mainEl);

    // scrolling slides a new band under a stationary pointer
    const onScroll = () => {
      scrollY = window.scrollY;
      if (started) resolve();
    };

    /* ————— pointer ————— */

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
      resolve();
    };
    const onEnter = () => started && root.classList.add("is-visible");
    const onLeave = () => root.classList.remove("is-visible");
    const onOver = (e: Event) => {
      const t = e.target as Element | null;
      const nextHover = !!t?.closest?.(INTERACTIVE);
      const nextSolo = !!t?.closest?.(SOLO_ZONE);
      // fires for every node crossed; only act on an actual change
      if (nextHover === hovering && nextSolo === solo) return;
      hovering = nextHover;
      solo = nextSolo;
      root.classList.toggle("is-hover", hovering);
      morphFast = true;
      applyTarget();
    };
    const onDown = () => {
      root.classList.add("is-down");
      if (reduced) return;

      const heading = (Math.atan2(diry, dirx) * 180) / Math.PI + 90;
      // land the effect under the paws rather than the bare pointer, so the
      // print still reads as the paw pressing down now that they sit offset
      const hx = tx + OFFSET_X;
      const hy = ty + OFFSET_Y;

      // a paw print pressed into the page, tilted like the next footfall...
      const stamp = document.createElement("span");
      stamp.className = "paw-stamp";
      stamp.style.left = `${hx}px`;
      stamp.style.top = `${hy}px`;
      stamp.style.setProperty("--stamp-rot", `${heading + stampSide * SPLAY}deg`);
      stamp.innerHTML = `<svg viewBox="0 0 40 40" aria-hidden="true">${PAW_MARKUP}</svg>`;
      stampSide *= -1;

      // ...and the ripple it knocks outward
      const ripple = document.createElement("span");
      ripple.className = "paw-ripple";
      ripple.style.left = `${hx}px`;
      ripple.style.top = `${hy}px`;

      rippleLayer.append(stamp, ripple);
      for (const node of [stamp, ripple]) {
        node.addEventListener("animationend", () => node.remove());
        window.setTimeout(() => node.remove(), 900);
      }
    };
    const onUp = () => root.classList.remove("is-down");

    /* ————— frame ————— */

    const writePaw = (
      slot: HTMLElement,
      side: 1 | -1,
      phase: number,
      angle: number,
      activity: number,
    ) => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      // antiphase swing — while one paw reaches forward the other is trailing
      const swing = Math.sin(walk + phase);
      const along = ALONG * swing * (SOLO_STRIDE + (1 - SOLO_STRIDE) * spread);
      const perp = PERP * side * spread;

      const px = cx + OFFSET_X + cos * along - sin * perp;
      const py = cy + OFFSET_Y + sin * along + cos * perp;

      const solo = side === 1 ? 1 + SOLO_GAIN * (1 - spread) : 1;
      const step = (1 + AMP * activity * swing) * solo;
      const wob = WOBBLE * activity * swing;
      const rot = (angle * 180) / Math.PI + 90 + side * SPLAY * spread + wob;

      slot.style.transform = `translate3d(${px}px, ${py}px, 0) translate(-50%, -50%) rotate(${rot}deg) scale(${step})`;

      // the trailing foot sits back in depth; paw B also fades with the morph
      const depth = 1 - LIFT * activity * (1 - swing) * 0.5;
      const paw = slot.firstElementChild as HTMLElement | null;
      if (paw) paw.style.opacity = `${side === 1 ? depth : depth * Math.min(1, spread * 1.15)}`;
    };

    let prevT = 0;
    const loop = (now: number) => {
      const dt = prevT ? Math.min(now - prevT, MAX_FRAME_MS) : 16.7;
      prevT = now;

      const ease = reduced ? 1 : EASE;
      cx += (tx - cx) * ease;
      cy += (ty - cy) * ease;

      const tau = morphFast ? MORPH_TAU_HOVER : MORPH_TAU_SECTION;
      spread += (target - spread) * (reduced ? 1 : 1 - Math.exp(-dt / tau));
      if (morphFast && Math.abs(target - spread) < 0.001) {
        spread = target;
        morphFast = false;
      }

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
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("mouseover", onOver, { passive: true });
    window.addEventListener("mousedown", onDown, { passive: true });
    window.addEventListener("mouseup", onUp, { passive: true });
    document.addEventListener("mouseenter", onEnter);
    document.addEventListener("mouseleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      if (pendingScan) cancelAnimationFrame(pendingScan);
      ro.disconnect();
      rescanRef.current = null;
      reduceMq.removeEventListener?.("change", onReduce);
      window.removeEventListener("load", queueScan);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", onScroll);
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
      <div ref={rootRef} aria-hidden className="paw-cursor2" data-mode="single">
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
