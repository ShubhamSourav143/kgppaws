"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Magnetic } from "@/components/fx/Magnetic";
import { Seal } from "@/components/brand/Logo";
import type { ContentSectionRow } from "@/services/content";
import type { Animal } from "@/types";

type HeroAnimal = Pick<Animal, "name" | "species" | "portrait" | "slug" | "tagline"> & {
  photoUrl?: string;
};

export interface HeroMediaItem {
  src: string;
  alt: string;
  blurDataURL?: string;
}

/**
 * Home hero — a seamless, full-viewport editorial collage. Sixteen real
 * rescue photographs tile the screen edge-to-edge with no gaps; the left
 * half carries the message over the underlying photos through a dark
 * gradient, so the collage never breaks.
 *
 * Every cell runs its own slow Ken Burns drift (desynced via negative
 * delays), which is the hero's primary motion; hover adds only a whisper
 * of light. All photos are temporary royalty-free placeholders in
 * public/images/hero-grid/ (grid-01…grid-16) — swap files to replace,
 * no code change. See public/images/hero-grid/README.md.
 */

interface Cell {
  src: string;
  type?: "image" | "video";
  /** desktop grid placement (left half sits under the text overlay) */
  pos: string;
  /** desktop-only cells collapse away on mobile */
  desktopOnly?: boolean;
  /** ken burns timing — desynced per cell (images only) */
  duration: number;
  delay: number;
}

const g = (n: number, ext = "jpg") =>
  `/images/hero-grid/grid-${String(n).padStart(2, "0")}.${ext}`;

const CELLS: Cell[] = [
  // right half — always visible (these 8 form the mobile collage)
  { src: g(1, "mp4"), type: "video", pos: "lg:col-start-3 lg:row-start-1", duration: 17, delay: -3 },
  { src: g(2), pos: "lg:col-start-4 lg:row-start-1", duration: 21, delay: -11 },
  { src: g(3), pos: "lg:col-start-3 lg:row-start-2", duration: 15, delay: -7 },
  { src: g(4), pos: "lg:col-start-4 lg:row-start-2", duration: 19, delay: -1 },
  { src: g(5), pos: "lg:col-start-3 lg:row-start-3", duration: 22, delay: -14 },
  { src: g(6), pos: "lg:col-start-4 lg:row-start-3", duration: 16, delay: -5 },
  { src: g(7, "mp4"), type: "video", pos: "lg:col-start-3 lg:row-start-4", duration: 20, delay: -9 },
  { src: g(8), pos: "lg:col-start-4 lg:row-start-4", duration: 18, delay: -13 },
  // left half — under the text overlay, desktop only
  { src: g(9),  pos: "lg:col-start-1 lg:row-start-1", desktopOnly: true, duration: 19, delay: -6 },
  { src: g(10), pos: "lg:col-start-2 lg:row-start-1", desktopOnly: true, duration: 16, delay: -12 },
  { src: g(11), pos: "lg:col-start-1 lg:row-start-2", desktopOnly: true, duration: 21, delay: -2 },
  { src: g(12), pos: "lg:col-start-2 lg:row-start-2", desktopOnly: true, duration: 17, delay: -8 },
  { src: g(13), pos: "lg:col-start-1 lg:row-start-3", desktopOnly: true, duration: 20, delay: -15 },
  { src: g(14), pos: "lg:col-start-2 lg:row-start-3", desktopOnly: true, duration: 15, delay: -4 },
  { src: g(15), pos: "lg:col-start-1 lg:row-start-4", desktopOnly: true, duration: 22, delay: -10 },
  { src: g(16), pos: "lg:col-start-2 lg:row-start-4", desktopOnly: true, duration: 18, delay: -1.5 },
];

export function Hero({
  cms,
}: {
  cms?: ContentSectionRow;
  media?: HeroMediaItem[];
  dog?: HeroAnimal;
  cat?: HeroAnimal;
}) {
  const reduced = useReducedMotion();

  const title = cms?.title || "Every paw deserves a loving home.";
  const sub =
    cms?.subtitle ||
    cms?.body ||
    "Rescue, healing and a forever home for every dog and cat that shares the IIT Kharagpur campus.";
  const ctaLabel = cms?.ctaLabel || "Meet our paws";
  const ctaUrl = cms?.ctaUrl || "/adopt";

  return (
    <section
      aria-label="Welcome"
      className="relative -mt-16 h-[100svh] min-h-[36rem] overflow-hidden bg-night md:-mt-20"
    >
      {/* — seamless 4×4 collage, edge to edge — */}
      {/*
        Entrance fade is CSS (.hero-tile), not framer-motion. The collage holds
        the hero's LCP image; framer-motion's initial="hidden" shipped every
        tile at opacity:0 and only faded them in AFTER hydration, so on a slow
        phone the whole hero stayed blank until the bundle ran — a poor LCP.
        A CSS animation paints from the first frame and needs no JS.
      */}
      <div
        aria-hidden="true"
        className="grid h-full w-full grid-cols-2 grid-rows-4 lg:grid-cols-4"
      >
        {CELLS.map((cell, cellIndex) => (
          <div
            key={cell.src}
            className={`hero-tile group relative overflow-hidden ${cell.pos} ${
              cell.desktopOnly ? "hidden lg:block" : ""
            }`}
            style={{ "--i": cellIndex } as CSSProperties}
          >
            {cell.type === "video" ? (
              /**
               * Autoplay is gated on prefers-reduced-motion: an looping video
               * a user cannot pause is exactly what that setting exists to
               * suppress, and skipping the fetch also spares a few MB of
               * mobile data. `preload="metadata"` keeps the first frame
               * available without pulling the whole file up front.
               */
              <video
                src={cell.src}
                /**
                 * autoPlay is unconditional in the markup on purpose:
                 * useReducedMotion() returns null during SSR and on the first
                 * client render, so `autoPlay={!reduced}` would still emit
                 * autoplay to a reduced-motion user and only correct itself
                 * after hydration — by which point the video is already
                 * playing. Pausing through the ref runs as soon as the element
                 * exists and does not depend on an attribute the browser has
                 * already acted on.
                 */
                ref={(el) => {
                  if (el && reduced) el.pause();
                }}
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
            ) : (
              <Image
                src={cell.src}
                alt=""
                fill
                sizes="(min-width: 1024px) 25vw, 50vw"
                /**
                 * Only the first two tiles are preloaded. `priority` on every
                 * mobile-visible cell emitted eight competing
                 * <link rel=preload> hints, and the browser reported most of
                 * them as "preloaded but not used within a few seconds of
                 * load" — they were fighting each other and the LCP for
                 * bandwidth. The rest are in the initial HTML, so they are
                 * still discovered immediately, just not prioritised.
                 */
                priority={cellIndex < 2}
                className="anim-kenburns object-cover object-center"
                style={{
                  animationDuration: `${cell.duration}s`,
                  animationDelay: `${cell.delay}s`,
                }}
              />
            )}
            {/* subtle hover: a whisper of warm light, nothing card-like */}
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-saffron/0 transition-colors duration-500 group-hover:bg-saffron/10"
            />
          </div>
        ))}
      </div>

      {/* — legibility scrims: header strip + text panel over the collage — */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-night/80 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-night/95 via-night/55 to-night/20 lg:w-1/2 lg:bg-gradient-to-r lg:from-night/95 lg:via-night/80 lg:to-transparent"
      />

      {/* — the message, living on the collage itself — */}
      <div className="absolute inset-0 flex flex-col justify-end lg:w-1/2 lg:justify-center">
        {/* CSS entrance (.hero-enter) — paints the headline without waiting for
            hydration; the h1 is a mobile LCP candidate. */}
        <div className="hero-enter px-6 pb-24 sm:px-10 md:pb-20 lg:px-14 lg:pb-0 xl:px-20">
          <span className="mb-6 inline-flex w-fit items-center gap-2.5 rounded-full border border-ivory/20 bg-night/40 py-1.5 pl-1.5 pr-4 text-[11px] font-bold uppercase tracking-[0.16em] text-gold-soft backdrop-blur-sm">
            <Seal variant="light" size={24} className="h-6 w-6 shrink-0" />
            An IIT Kharagpur student initiative
          </span>

          <h1 className="max-w-xl text-balance font-display text-5xl font-bold leading-[1.0] text-ivory drop-shadow-[0_4px_28px_rgba(6,12,9,0.7)] sm:text-6xl xl:text-7xl">
            {title}
          </h1>

          {/* tricolour rule — saffron · white · green */}
          <span aria-hidden="true" className="mt-7 flex h-1.5 w-44 overflow-hidden rounded-full">
            <span className="flex-1 bg-saffron" />
            <span className="flex-1 bg-ivory" />
            <span className="flex-1 bg-forest-bright" />
          </span>

          <p className="mt-6 max-w-md text-lg leading-relaxed text-ivory/85 drop-shadow-[0_2px_12px_rgba(6,12,9,0.6)] sm:text-xl">
            {sub}
          </p>

          <div className="mt-9">
            <Magnetic strength={0.3}>
              <Link
                href={ctaUrl}
                className="group inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-saffron-deep via-saffron to-marigold px-9 py-4.5 text-lg font-bold text-ivory shadow-ember transition-all hover:brightness-105 active:scale-95"
              >
                {ctaLabel}
                <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
              </Link>
            </Magnetic>
          </div>

          <p className="mt-6 text-sm font-semibold text-ivory/60">
            Adopt a friend for life · together, we heal and grow.
          </p>
        </div>
      </div>
    </section>
  );
}
