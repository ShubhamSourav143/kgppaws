"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { ArrowDown, ArrowUpRight, HandCoins, QrCode, Users } from "lucide-react";
import { AnimalPortrait } from "@/components/animals/Portrait";
import { ParticleField } from "@/components/fx/ParticleField";
import { Magnetic } from "@/components/fx/Magnetic";
import { TextReveal } from "@/components/fx/TextReveal";
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

/* ————— scenery bits ————— */

function Bird({ delay, top, duration, scale }: { delay: number; top: string; duration: number; scale: number }) {
  return (
    <div
      className="anim-fly absolute left-0"
      style={{
        top,
        animationDelay: `${delay}s`,
        ["--fly-duration" as string]: `${duration}s`,
        ["--fly-scale" as string]: scale,
      }}
      aria-hidden="true"
    >
      <svg width="28" height="10" viewBox="0 0 28 10" fill="none" className="text-night/50">
        <path d="M0 6 Q 7 0 14 6 Q 21 0 28 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="anim-flap" />
      </svg>
    </div>
  );
}

function Leaf({ left, delay, duration, color }: { left: string; delay: number; duration: number; color: string }) {
  return (
    <div
      className="anim-leaf absolute -top-6"
      style={{ left, animationDelay: `${delay}s`, ["--leaf-duration" as string]: `${duration}s` }}
      aria-hidden="true"
    >
      <svg width="16" height="18" viewBox="0 0 16 18" fill={color} opacity="0.75">
        <path d="M8 0C12 4 16 8 14 13c-1.6 4-6 5-8 4.6C2.4 16.8-.6 12 .4 8 1.4 4 5 1.5 8 0Z" />
        <path d="M8 2v13" stroke="rgba(0,0,0,0.18)" strokeWidth="0.8" fill="none" />
      </svg>
    </div>
  );
}

function GrassTuft({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <svg
      viewBox="0 0 80 34"
      className={`anim-sway ${className ?? ""}`}
      style={{ animationDelay: `${delay}s` }}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M6 34C4 22 2 16 0 12c5 2 8 8 9 14C10 16 8 8 6 2c6 4 9 12 10 22C17 14 18 8 22 2c3 7 2 16 0 24 4-9 8-14 13-16-3 6-5 13-5 20 3-8 7-12 12-14-3 5-5 11-5 18h-31Z" />
      <path d="M46 34c-1-9-3-15-6-20 5 2 8 7 10 13 0-8-1-14-4-20 6 3 9 10 10 19 1-8 3-13 7-17 1 6 0 12-2 19 3-6 7-9 11-10-3 5-4 10-4 16H46Z" opacity="0.85" />
    </svg>
  );
}

/* ————— hero ————— */

export function Hero({
  cms,
  media = [],
  dog,
  cat,
}: {
  cms?: ContentSectionRow;
  media?: HeroMediaItem[];
  dog?: HeroAnimal;
  cat?: HeroAnimal;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);

  // pointer-driven camera
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const cx = useSpring(px, { stiffness: 60, damping: 18, mass: 0.6 });
  const cy = useSpring(py, { stiffness: 60, damping: 18, mass: 0.6 });
  const skyX = useTransform(cx, (v) => v * -10);
  const hillsX = useTransform(cx, (v) => v * -22);
  const hillsY = useTransform(cy, (v) => v * -8);
  const cardsX = useTransform(cx, (v) => v * 26);
  const cardsY = useTransform(cy, (v) => v * 14);
  const grassX = useTransform(cx, (v) => v * 38);

  // scroll choreography
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const sceneScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const sceneY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const contentY = useTransform(scrollYProgress, [0, 0.7], [0, -80]);
  const fade = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  const title = cms?.title || "Every paw has a story.";
  const sub =
    cms?.subtitle ||
    cms?.body ||
    "Rescue, healing and a digital identity for every animal that calls IIT Kharagpur home.";
  const ctaLabel = cms?.ctaLabel || "Meet the paws";
  const ctaUrl = cms?.ctaUrl || "/adopt";
  const heroPhoto = media[0];

  return (
    <section
      ref={ref}
      aria-label="Welcome"
      className="relative -mt-16 flex min-h-[100svh] flex-col justify-center overflow-hidden bg-night md:-mt-20"
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse" || reduced) return;
        const r = e.currentTarget.getBoundingClientRect();
        px.set((e.clientX - r.left) / r.width - 0.5);
        py.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onPointerLeave={() => {
        px.set(0);
        py.set(0);
      }}
    >
      {/* — scene — */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-0"
        style={reduced ? undefined : { scale: sceneScale, y: sceneY }}
      >
        {/* sky */}
        <motion.div
          className="absolute inset-[-4%]"
          style={{
            x: reduced ? 0 : skyX,
            background:
              "linear-gradient(180deg, #12233f 0%, #274d7e 26%, #b06a3f 52%, #e8983f 64%, #f3dda6 78%, #faf5ea 100%)",
          }}
        />
        {/* photographic backdrop (activates automatically once hero photos exist) */}
        {heroPhoto && (
          <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroPhoto.src}
              alt=""
              className="anim-kenburns h-full w-full object-cover opacity-55"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-night/70 via-night/20 to-cream" />
          </div>
        )}

        {/* sun */}
        <div className="anim-pulse-soft absolute left-[16%] top-[46%] h-56 w-56 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(245,163,91,0.9),rgba(245,163,91,0.25)_45%,transparent_70%)] blur-[2px] sm:h-80 sm:w-80" />
        {/* light rays */}
        <div className="anim-ray absolute left-[16%] top-[38%] h-[60vh] w-[70vw] -translate-x-1/2 bg-[conic-gradient(from_180deg_at_50%_0%,transparent_38%,rgba(245,163,91,0.16)_44%,transparent_50%,rgba(243,221,166,0.2)_56%,transparent_62%)]" />

        {/* clouds */}
        <div className="anim-drift absolute left-[8%] top-[12%] h-14 w-64 rounded-full bg-ivory/25 blur-2xl" />
        <div className="anim-drift absolute right-[14%] top-[20%] h-16 w-80 rounded-full bg-ivory/20 blur-2xl" style={{ animationDelay: "-6s", animationDuration: "24s" }} />
        <div className="anim-drift absolute left-[38%] top-[6%] h-10 w-48 rounded-full bg-ivory/15 blur-xl" style={{ animationDelay: "-12s", animationDuration: "30s" }} />

        {/* birds */}
        {!reduced && (
          <>
            <Bird delay={0} top="18%" duration={38} scale={1} />
            <Bird delay={-14} top="12%" duration={46} scale={0.7} />
            <Bird delay={-26} top="24%" duration={42} scale={0.85} />
          </>
        )}

        {/* hills + campus silhouette */}
        <motion.div className="absolute inset-x-[-6%] bottom-0" style={reduced ? undefined : { x: hillsX, y: hillsY }}>
          <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="block h-[38vh] w-full">
            <path d="M0 210 Q 240 130 480 180 T 900 170 T 1440 190 V 320 H 0 Z" fill="#7fa08c" opacity="0.5" />
            {/* campus silhouette */}
            <g fill="#14402f" opacity="0.35">
              <rect x="620" y="118" width="14" height="70" />
              <rect x="600" y="150" width="120" height="44" />
              <rect x="560" y="168" width="40" height="26" />
              <rect x="720" y="168" width="40" height="26" />
              <circle cx="627" cy="112" r="7" />
              <rect x="820" y="158" width="60" height="36" rx="3" />
              <rect x="480" y="160" width="52" height="34" rx="3" />
            </g>
            <path d="M0 250 Q 300 180 620 230 T 1440 240 V 320 H 0 Z" fill="#2c5c43" opacity="0.8" />
            <path d="M0 292 Q 360 236 760 276 T 1440 282 V 320 H 0 Z" fill="#14402f" />
          </svg>
        </motion.div>

        {/* falling leaves */}
        {!reduced && (
          <>
            <Leaf left="12%" delay={0} duration={14} color="#e9b84c" />
            <Leaf left="28%" delay={-5} duration={17} color="#c25f1e" />
            <Leaf left="55%" delay={-9} duration={15} color="#7fa08c" />
            <Leaf left="72%" delay={-3} duration={19} color="#e8813a" />
            <Leaf left="88%" delay={-11} duration={16} color="#e9b84c" />
          </>
        )}

        {/* particles / fireflies */}
        <ParticleField className="absolute inset-0" />
      </motion.div>

      {/* — floating animal cards — */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden lg:block"
        style={reduced ? undefined : { x: cardsX, y: cardsY, opacity: fade }}
      >
        {dog && (
          <div className="anim-float absolute right-[9%] top-[24%] w-64 rotate-3 xl:w-72">
            <div className="rounded-[1.75rem] bg-ivory/80 p-3 shadow-lift backdrop-blur-sm">
              <AnimalPortrait animal={dog} photoUrl={dog.photoUrl} idle className="aspect-[4/5] w-full overflow-hidden rounded-3xl" />
              <div className="flex items-center justify-between px-2 pb-1 pt-3">
                <p className="font-display text-lg font-bold text-forest-deep">{dog.name}</p>
                <QrCode className="h-4 w-4 text-moss" aria-hidden="true" />
              </div>
            </div>
          </div>
        )}
        {cat && (
          <div className="anim-float absolute right-[32%] top-[56%] w-44 -rotate-6 xl:w-52" style={{ animationDelay: "-2.2s" }}>
            <div className="rounded-[1.5rem] bg-ivory/80 p-2.5 shadow-lift backdrop-blur-sm">
              <AnimalPortrait animal={cat} photoUrl={cat.photoUrl} idle className="aspect-square w-full overflow-hidden rounded-2xl" />
              <p className="px-2 pb-1 pt-2.5 font-display text-base font-bold text-forest-deep">{cat.name}</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* — content — */}
      <motion.div
        className="container-page relative z-10 pt-24 pb-36 md:pb-28"
        style={reduced ? undefined : { y: contentY, opacity: fade }}
      >
        <div className="max-w-2xl">
          <motion.p
            initial={reduced ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="glass-dark mb-6 inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-gold-soft"
          >
            <Seal variant="light" size={22} className="h-5 w-5" />
            Animal Welfare Society · IIT Kharagpur
          </motion.p>

          <TextReveal
            as="h1"
            text={title}
            className="text-balance font-display text-5xl font-bold leading-[1.02] text-ivory drop-shadow-[0_2px_24px_rgba(10,18,14,0.35)] sm:text-6xl lg:text-7xl xl:text-[5.2rem]"
          />

          <motion.p
            initial={reduced ? false : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 max-w-lg text-lg leading-relaxed text-ivory/85 sm:text-xl"
          >
            {sub}
          </motion.p>

          <motion.div
            initial={reduced ? false : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <Magnetic strength={0.3}>
              <Link
                href={ctaUrl}
                className="group inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-saffron-deep via-saffron to-marigold px-8 py-4 text-base font-bold text-ivory shadow-ember transition-all hover:brightness-105 active:scale-95"
              >
                {ctaLabel}
                <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
              </Link>
            </Magnetic>
            <Magnetic strength={0.25}>
              <Link
                href="/donate"
                className="glass-dark inline-flex items-center gap-2 rounded-full px-7 py-4 text-base font-semibold text-ivory transition-colors hover:bg-ivory/15"
              >
                <HandCoins className="h-5 w-5 text-chakra-glow" aria-hidden="true" />
                Donate
              </Link>
            </Magnetic>
            <Magnetic strength={0.25}>
              <Link
                href="/volunteer"
                className="glass-dark inline-flex items-center gap-2 rounded-full px-7 py-4 text-base font-semibold text-ivory transition-colors hover:bg-ivory/15"
              >
                <Users className="h-5 w-5 text-forest-bright" aria-hidden="true" />
                Volunteer
              </Link>
            </Magnetic>
          </motion.div>
        </div>
      </motion.div>

      {/* grass foreground */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-10">
        <motion.div style={reduced ? undefined : { x: grassX }} className="relative h-10">
          <GrassTuft className="absolute -bottom-1 left-[2%] h-10 w-24 text-forest-deep" />
          <GrassTuft className="absolute -bottom-1 left-[30%] h-8 w-20 text-forest" delay={-2} />
          <GrassTuft className="absolute -bottom-1 left-[58%] h-11 w-24 text-forest-deep" delay={-4} />
          <GrassTuft className="absolute -bottom-1 left-[84%] h-9 w-20 text-forest" delay={-1.4} />
        </motion.div>
      </div>

      {/* scroll cue */}
      <motion.div
        aria-hidden="true"
        style={reduced ? undefined : { opacity: fade }}
        className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-ivory/80 md:flex"
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Scroll</span>
        <span className="flex h-9 w-5 items-start justify-center rounded-full border border-ivory/40 p-1">
          <ArrowDown className="anim-scroll-hint h-3 w-3" />
        </span>
      </motion.div>
    </section>
  );
}
