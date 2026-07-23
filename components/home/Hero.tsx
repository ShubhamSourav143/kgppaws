"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { ArrowDown, ArrowUpRight, HandCoins, PawPrint, Users } from "lucide-react";
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

/** Backdrop is a CC BY 3.0 photo — attribution is required while it is in use.
 *  Set to null once an official KGP PAWS photograph replaces the file.
 *  See public/images/hero/README.md. */
const PHOTO_CREDIT = "Main Building photo: Biswarup Ganguly · CC BY 3.0";

const FALLBACK_BACKDROP = "/images/hero/iit-kgp-main-building.jpg";

/**
 * Home hero — the IIT Kharagpur Main Building carries the full screen while
 * real rescue photography floats in the foreground. Three depth layers move
 * at different rates on scroll and pointer, under a saffron→green→Ashoka-blue
 * scrim that keeps the type legible over any replacement photograph.
 */
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
  const bgX = useTransform(cx, (v) => v * -18);
  const bgY = useTransform(cy, (v) => v * -10);
  const dogX = useTransform(cx, (v) => v * 34);
  const dogY = useTransform(cy, (v) => v * 20);
  const catX = useTransform(cx, (v) => v * 52);
  const catY = useTransform(cy, (v) => v * 30);

  // scroll choreography — background drifts slowest, foreground fastest
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.14]);
  const bgShift = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const contentY = useTransform(scrollYProgress, [0, 0.8], [0, -90]);
  const cardsY = useTransform(scrollYProgress, [0, 1], [0, -190]);
  const fade = useTransform(scrollYProgress, [0, 0.72], [1, 0]);

  const backdrop = media[0]?.src ?? FALLBACK_BACKDROP;
  const backdropBlur = media[0]?.blurDataURL;
  const showCredit = backdrop === FALLBACK_BACKDROP;

  const title = cms?.title || "Every paw has a story.";
  const sub =
    cms?.subtitle ||
    cms?.body ||
    "Rescue, healing and a digital identity for every animal that calls IIT Kharagpur home.";
  const ctaLabel = cms?.ctaLabel || "Meet our paws";
  const ctaUrl = cms?.ctaUrl || "/adopt";

  const photos = [
    { animal: dog, className: "right-[7%] top-[20%] w-56 rotate-3 xl:w-64", depth: { x: dogX, y: dogY }, delay: 0.5 },
    { animal: cat, className: "right-[30%] top-[56%] w-40 -rotate-6 xl:w-48", depth: { x: catX, y: catY }, delay: 0.66 },
  ].filter((p) => p.animal?.photoUrl);

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
      {/* — layer 1: the campus itself — */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-[-6%]"
        style={reduced ? undefined : { scale: bgScale, y: bgShift, x: bgX, translateY: bgY }}
      >
        <Image
          src={backdrop}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
          {...(backdropBlur ? { placeholder: "blur" as const, blurDataURL: backdropBlur } : {})}
        />
      </motion.div>

      {/* — layer 2: tricolour scrim — saffron warmth, green depth, Ashoka blue sky — */}
      <div aria-hidden="true" className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-chakra-ink/75 via-night/45 to-forest-deep/90" />
        {/* legibility scrim — keeps the headline crisp over the bright façade */}
        <div className="absolute inset-0 bg-gradient-to-r from-night/90 via-night/55 to-transparent lg:via-night/35" />
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_15%_85%,rgba(194,95,30,0.55),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(90%_60%_at_85%_5%,rgba(37,99,168,0.45),transparent_65%)]" />
        <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-cream via-cream/45 to-transparent" />
        <ParticleField count={30} className="absolute inset-0 opacity-50" />
      </div>

      {/* — layer 3: real rescue photography, floating — */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden lg:block"
        style={reduced ? undefined : { y: cardsY, opacity: fade }}
      >
        {photos.map((p, i) => (
          <motion.div
            key={i}
            className={`absolute ${p.className}`}
            style={reduced ? undefined : { x: p.depth.x, translateY: p.depth.y }}
            initial={reduced ? false : { opacity: 0, y: 48, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: p.delay, type: "spring", stiffness: 120, damping: 18 }}
          >
            <div className="anim-float rounded-[1.75rem] border border-ivory/25 bg-ivory/10 p-2.5 shadow-lift backdrop-blur-md">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[1.35rem]">
                <Image
                  src={p.animal!.photoUrl!}
                  alt=""
                  fill
                  sizes="(min-width: 1280px) 16rem, 14rem"
                  className="object-cover"
                />
                <span className="absolute inset-0 rounded-[1.35rem] ring-1 ring-inset ring-ivory/20" />
              </div>
              <span className="mt-2.5 flex items-center justify-center gap-1.5 pb-0.5 text-[11px] font-bold uppercase tracking-[0.16em] text-ivory/80">
                <PawPrint className="h-3.5 w-3.5 text-saffron-glow" />
                KGP PAWS
              </span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* — layer 4: the message — */}
      <motion.div
        className="container-page relative z-10 pb-36 pt-28 md:pb-32"
        style={reduced ? undefined : { y: contentY, opacity: fade }}
      >
        <div className="max-w-2xl">
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="glass-dark mb-7 inline-flex items-center gap-3 rounded-full py-2 pl-2 pr-5 text-xs font-bold uppercase tracking-[0.16em] text-gold-soft"
          >
            <Seal variant="light" size={26} className="h-6 w-6 shrink-0" />
            <span className="leading-tight">
              An IIT Kharagpur student initiative
            </span>
          </motion.div>

          <TextReveal
            as="h1"
            text={title}
            className="text-balance font-display text-5xl font-bold leading-[1.02] text-ivory drop-shadow-[0_4px_28px_rgba(6,12,9,0.6)] sm:text-6xl lg:text-7xl"
          />

          <motion.p
            initial={reduced ? false : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-ivory/85 drop-shadow-[0_2px_12px_rgba(6,12,9,0.5)] sm:text-xl"
          >
            {sub}
          </motion.p>

          {/* tricolour rule — saffron · white · green */}
          <motion.div
            aria-hidden="true"
            initial={reduced ? false : { opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.6, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 flex h-1 w-44 origin-left overflow-hidden rounded-full"
          >
            <span className="flex-1 bg-saffron" />
            <span className="flex-1 bg-ivory" />
            <span className="flex-1 bg-forest-bright" />
          </motion.div>

          <motion.div
            initial={reduced ? false : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.72, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 flex flex-wrap items-center gap-4"
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

          {/* compact rescue photography for small screens */}
          {photos.length > 0 && (
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.88, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="mt-9 flex items-center gap-3 lg:hidden"
            >
              {photos.map((p, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-ivory/25 bg-ivory/10 p-1.5 shadow-lift backdrop-blur-md"
                >
                  <div className="relative h-16 w-16 overflow-hidden rounded-xl">
                    <Image
                      src={p.animal!.photoUrl!}
                      alt=""
                      fill
                      sizes="4rem"
                      className="object-cover"
                    />
                  </div>
                </div>
              ))}
              <PawPrint className="h-5 w-5 text-saffron-glow" aria-hidden="true" />
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* scroll cue */}
      <motion.div
        aria-hidden="true"
        style={reduced ? undefined : { opacity: fade }}
        className="absolute bottom-7 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-forest-deep/70 md:flex"
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Scroll</span>
        <span className="flex h-9 w-5 items-start justify-center rounded-full border border-forest-deep/35 p-1">
          <ArrowDown className="anim-scroll-hint h-3 w-3" />
        </span>
      </motion.div>

      {showCredit && (
        <p className="absolute bottom-3 right-4 z-10 text-[10px] text-forest-deep/45">
          {PHOTO_CREDIT}
        </p>
      )}
    </section>
  );
}
