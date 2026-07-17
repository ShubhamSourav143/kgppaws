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
import { ChevronDown, QrCode, Siren } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import type { ContentSectionRow } from "@/services/content";

/* ————————————————————————————————————————————————————————————————
   Illustrated campus dog scene.
   Layered SVG with idle animation (breathing, blinking, ear + tail
   movement), cursor parallax and gentle eye tracking. Serves as the
   graceful, always-available visual; a React Three Fiber GLB scene can
   be mounted in its place later (see README — 3D upgrade path).
   ———————————————————————————————————————————————————————————————— */

function DogScene({
  mx,
  my,
  idle,
}: {
  mx: ReturnType<typeof useSpring>;
  my: ReturnType<typeof useSpring>;
  idle: boolean;
}) {
  // parallax offsets per layer
  const farX = useTransform(mx, [-1, 1], [6, -6]);
  const midX = useTransform(mx, [-1, 1], [12, -12]);
  const headRot = useTransform(mx, [-1, 1], [-2.5, 2.5]);
  const pupilX = useTransform(mx, [-1, 1], [-2.2, 2.2]);
  const pupilY = useTransform(my, [-1, 1], [-1.4, 1.8]);

  return (
    <svg
      viewBox="0 0 520 520"
      role="img"
      aria-label="Illustration of a campus dog wearing a KGP PAWS collar with a QR identity tag, in front of the IIT Kharagpur Main Building"
      className="block h-full w-full"
    >
      {/* sky wash */}
      <defs>
        <linearGradient id="hero-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F1E8D8" />
          <stop offset="100%" stopColor="#F7F1E7" />
        </linearGradient>
        <linearGradient id="hero-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E3D9BE" />
          <stop offset="100%" stopColor="#D9CCA9" />
        </linearGradient>
      </defs>
      <circle cx="260" cy="250" r="230" fill="url(#hero-sky)" />

      {/* far layer: sun + Main Building silhouette */}
      <motion.g style={{ x: farX }}>
        <circle cx="150" cy="120" r="46" fill="#DCC9A3" opacity="0.65" />
        <g fill="#173F35" opacity="0.1">
          {/* simplified Main Building: wings + central tower */}
          <rect x="120" y="208" width="290" height="52" rx="3" />
          <rect x="215" y="168" width="100" height="92" rx="3" />
          <rect x="243" y="128" width="44" height="60" rx="3" />
          <path d="M243 128 L265 108 L287 128 Z" />
          <rect x="150" y="222" width="14" height="24" rx="2" fill="#F7F1E7" />
          <rect x="180" y="222" width="14" height="24" rx="2" fill="#F7F1E7" />
          <rect x="340" y="222" width="14" height="24" rx="2" fill="#F7F1E7" />
          <rect x="370" y="222" width="14" height="24" rx="2" fill="#F7F1E7" />
          <rect x="256" y="140" width="18" height="30" rx="2" fill="#F7F1E7" />
        </g>
      </motion.g>

      {/* mid layer: trees */}
      <motion.g style={{ x: midX }}>
        <g opacity="0.85">
          <rect x="78" y="230" width="9" height="46" rx="4" fill="#8C6A4F" />
          <circle cx="82" cy="212" r="34" fill="#2E6B56" opacity="0.35" />
          <circle cx="64" cy="228" r="24" fill="#2E6B56" opacity="0.28" />
          <rect x="428" y="222" width="10" height="56" rx="5" fill="#8C6A4F" />
          <circle cx="433" cy="200" r="40" fill="#2E6B56" opacity="0.35" />
          <circle cx="458" cy="222" r="26" fill="#2E6B56" opacity="0.28" />
        </g>
      </motion.g>

      {/* ground */}
      <ellipse cx="260" cy="468" rx="235" ry="52" fill="url(#hero-ground)" />
      <ellipse cx="268" cy="474" rx="150" ry="28" fill="#20242112" />

      {/* ——— the dog ——— */}
      <g className={idle ? "anim-breathe" : undefined} style={{ transformBox: "fill-box" }}>
        {/* tail */}
        <g
          className={idle ? "anim-tail" : undefined}
          style={{ transformBox: "fill-box", transformOrigin: "85% 30%" }}
        >
          <path
            d="M148 400 Q96 396 84 350 Q80 336 92 334 Q104 333 108 346 Q116 378 156 380 Z"
            fill="#A96F35"
          />
        </g>

        {/* haunch */}
        <ellipse cx="205" cy="402" rx="92" ry="72" fill="#D9A05B" />
        <ellipse cx="180" cy="440" rx="40" ry="22" fill="#C4883F" />
        {/* hind paw */}
        <ellipse cx="168" cy="466" rx="30" ry="13" fill="#E8C88F" />

        {/* body + chest */}
        <ellipse cx="292" cy="366" rx="88" ry="102" fill="#D9A05B" />
        <ellipse cx="306" cy="398" rx="50" ry="68" fill="#F2E3C9" />

        {/* front legs */}
        <rect x="262" y="360" width="34" height="110" rx="17" fill="#D9A05B" />
        <rect x="318" y="360" width="34" height="110" rx="17" fill="#CE9349" />
        <ellipse cx="279" cy="468" rx="24" ry="12" fill="#E8C88F" />
        <ellipse cx="335" cy="468" rx="24" ry="12" fill="#E8C88F" />

        {/* head group — reacts subtly to cursor */}
        <motion.g style={{ rotate: headRot, transformBox: "fill-box", transformOrigin: "50% 85%" }}>
          {/* ears — indie half-pricked */}
          <g
            className={idle ? "anim-ear" : undefined}
            style={{ transformBox: "fill-box", transformOrigin: "60% 90%" }}
          >
            <path d="M248 148 L252 84 L300 118 Z" fill="#A96F35" />
            <path d="M252 84 L278 90 L270 108 Z" fill="#D9A05B" />
          </g>
          <path d="M372 148 L368 84 L320 118 Z" fill="#A96F35" />
          <path d="M368 84 L342 90 L350 108 Z" fill="#D9A05B" />

          {/* head */}
          <ellipse cx="310" cy="176" rx="66" ry="60" fill="#D9A05B" />
          {/* eye patch marking */}
          <circle cx="285" cy="166" r="20" fill="#B37B41" opacity="0.8" />

          {/* muzzle */}
          <ellipse cx="310" cy="206" rx="32" ry="23" fill="#F2E3C9" />

          {/* eyes with tracking pupils */}
          <g className={idle ? "anim-blink" : undefined} style={{ transformBox: "fill-box" }}>
            <ellipse cx="286" cy="168" rx="8" ry="9" fill="#FCF8F0" />
            <ellipse cx="334" cy="168" rx="8" ry="9" fill="#FCF8F0" />
            <motion.g style={{ x: pupilX, y: pupilY }}>
              <circle cx="287" cy="169" r="5" fill="#202421" />
              <circle cx="335" cy="169" r="5" fill="#202421" />
              <circle cx="289" cy="167" r="1.6" fill="#FCF8F0" />
              <circle cx="337" cy="167" r="1.6" fill="#FCF8F0" />
            </motion.g>
          </g>

          {/* nose + mouth */}
          <path
            d="M301 196 L319 196 Q322 196 320 199.5 L313 209 Q310 213 307 209 L300 199.5 Q298 196 301 196 Z"
            fill="#202421"
          />
          <g stroke="#202421" strokeWidth="2.4" strokeLinecap="round" fill="none">
            <path d="M310 212 v6" />
            <path d="M310 218 q-8 8 -16 3" />
            <path d="M310 218 q8 8 16 3" />
          </g>
          <path d="M302 224 q8 -3 16 0 q0 13 -8 13 q-8 0 -8 -13 Z" fill="#E2917B" />
        </motion.g>

        {/* collar */}
        <path
          d="M258 252 Q310 278 362 250"
          stroke="#C96745"
          strokeWidth="16"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="312" cy="268" r="5" fill="#E8C77D" />

        {/* QR tag — the scroll zoom target */}
        <g
          id="hero-qr-tag"
          className={idle ? "anim-swing" : undefined}
          style={{ transformBox: "fill-box", transformOrigin: "50% 0%" }}
        >
          <rect x="296" y="272" width="32" height="38" rx="7" fill="#FCF8F0" stroke="#DCC9A3" strokeWidth="2.5" />
          <circle cx="312" cy="278" r="2.2" fill="#DCC9A3" />
          <g fill="#173F35">
            <rect x="302" y="283" width="6" height="6" rx="1" />
            <rect x="316" y="283" width="6" height="6" rx="1" />
            <rect x="302" y="297" width="6" height="6" rx="1" />
            <rect x="311" y="291" width="3" height="3" />
            <rect x="316" y="295" width="3" height="3" />
            <rect x="319" y="299" width="3" height="3" />
            <rect x="311" y="299" width="3" height="3" />
          </g>
        </g>
      </g>
    </svg>
  );
}

/* ————————————————————————————————————————————————————————————————
   Hero — 220vh scroll stage:
   phase 1: copy + idle dog · phase 2: camera zooms toward the collar
   tag · phase 3: “One Scan. Their Entire Story.” takes over.
   ———————————————————————————————————————————————————————————————— */

export function Hero({ cms }: { cms?: ContentSectionRow }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ["start start", "end end"],
  });

  // cursor parallax (mouse only)
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const mx = useSpring(rawX, { stiffness: 60, damping: 18 });
  const my = useSpring(rawY, { stiffness: 60, damping: 18 });

  // choreography
  const copyOpacity = useTransform(scrollYProgress, [0, 0.22], [1, 0]);
  const copyY = useTransform(scrollYProgress, [0, 0.22], [0, -36]);
  const sceneScale = useTransform(scrollYProgress, [0.15, 0.75], [1, 2.6]);
  const sceneX = useTransform(scrollYProgress, [0.15, 0.75], ["0%", "-14%"]);
  const sceneY = useTransform(scrollYProgress, [0.15, 0.75], ["0%", "-6%"]);
  const scanOpacity = useTransform(scrollYProgress, [0.55, 0.8], [0, 1]);
  const scanY = useTransform(scrollYProgress, [0.55, 0.8], [40, 0]);
  const hintOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0]);

  return (
    <section
      ref={stageRef}
      className={reduce ? "relative" : "relative h-[220vh]"}
      aria-label="KGP PAWS — every paw has a story"
      onMouseMove={(e) => {
        if (reduce) return;
        const r = stageRef.current?.getBoundingClientRect();
        if (!r) return;
        rawX.set(((e.clientX - r.left) / r.width) * 2 - 1);
        rawY.set(((e.clientY - Math.max(r.top, 0)) / Math.min(r.height, window.innerHeight)) * 2 - 1);
      }}
    >
      <div
        className={
          reduce
            ? "relative overflow-hidden"
            : "sticky top-0 h-screen overflow-hidden"
        }
      >
        <div className="container-page grid min-h-[calc(100vh-5rem)] items-center gap-8 py-10 lg:grid-cols-[1.05fr_1fr] lg:gap-4">
          {/* copy */}
          <motion.div
            style={reduce ? undefined : { opacity: copyOpacity, y: copyY }}
            className="relative z-10 order-2 max-w-xl lg:order-1"
          >
            <p className="eyebrow mb-4 text-terracotta-deep">
              Animal Welfare Society · IIT Kharagpur
            </p>
            <h1 className="text-balance font-display text-5xl font-bold leading-[1.02] text-forest-deep sm:text-6xl xl:text-7xl">
              {cms?.title}
            </h1>
            <p className="mt-5 font-display text-xl italic text-terracotta-deep sm:text-2xl">
              {cms?.subtitle}
            </p>
            <p className="mt-4 max-w-md text-base leading-relaxed text-moss sm:text-lg">
              {cms?.body}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ButtonLink href={cms?.ctaUrl ?? "/adopt"} size="lg">
                {cms?.ctaLabel}
              </ButtonLink>
              <ButtonLink href="/report" variant="accent" size="lg">
                <Siren className="h-4 w-4" aria-hidden="true" />
                Help an Animal
              </ButtonLink>
              <ButtonLink href="/donate" variant="outline" size="lg">
                Donate
              </ButtonLink>
            </div>
          </motion.div>

          {/* scene */}
          <div className="order-1 lg:order-2">
            <motion.div
              style={
                reduce
                  ? undefined
                  : { scale: sceneScale, x: sceneX, y: sceneY }
              }
              className="mx-auto aspect-square w-full max-w-[300px] sm:max-w-[420px] lg:max-w-[560px] [transform-origin:61%_56%]"
            >
              <DogScene mx={mx} my={my} idle={!reduce} />
            </motion.div>
          </div>
        </div>

        {/* scan takeover */}
        {!reduce && (
          <motion.div
            style={{ opacity: scanOpacity, y: scanY }}
            className="pointer-events-none absolute inset-x-0 bottom-14 z-20 text-center"
            aria-hidden="true"
          >
            <p className="inline-flex items-center gap-2 rounded-full bg-forest px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-cream shadow-lift">
              <QrCode className="h-3.5 w-3.5" />
              Paws digital identity
            </p>
            <p className="mt-4 text-balance px-6 font-display text-4xl font-bold text-forest-deep sm:text-5xl">
              One Scan. Their Entire Story.
            </p>
          </motion.div>
        )}

        {/* scroll hint */}
        {!reduce && (
          <motion.div
            style={{ opacity: hintOpacity }}
            className="absolute bottom-5 left-1/2 -translate-x-1/2 text-moss"
            aria-hidden="true"
          >
            <ChevronDown className="anim-float h-6 w-6" />
          </motion.div>
        )}
      </div>

      {/* static heading for reduced-motion users (choreography text otherwise) */}
      {reduce && (
        <div className="container-page pb-16 text-center">
          <p className="font-display text-3xl font-bold text-forest-deep">
            One Scan. Their Entire Story.
          </p>
          <Link href="/animal/simba" className="mt-2 inline-block text-sm font-semibold text-terracotta-deep underline">
            See a live animal profile
          </Link>
        </div>
      )}
    </section>
  );
}
