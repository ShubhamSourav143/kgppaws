"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, HandHeart, HeartHandshake, PawPrint, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SlideshowPhoto {
  src: string;
  alt: string;
  blurDataURL?: string;
}

export interface StorySlideshowProps {
  title: string;
  subtitle: string;
  photos: SlideshowPhoto[];
  bullets: string[];
  /** Where clicking "Adopt this animal" should go — set only when the
   *  story is about an adoptable animal. When undefined the CTA becomes
   *  "Donate" / "Volunteer" instead. */
  adoptHref?: string;
  animalName?: string;
}

/**
 * Story slideshow — the primary way a rescue story is now told.
 *
 * A large photograph on top, four to five short bullet points describing
 * the journey underneath, and a support CTA at the bottom. Photos advance
 * automatically every five seconds; hover or focus pauses the reel, arrows
 * and dots let readers browse manually. Swipe works on touch.
 *
 * All the long-form prose the story was originally written as still lives
 * in a collapsed <details> block on the same page for readers who want to
 * go deeper. This component just changes what a visitor sees first.
 */
export function StorySlideshow({
  title,
  subtitle,
  photos,
  bullets,
  adoptHref,
  animalName,
}: StorySlideshowProps) {
  const reduced = useReducedMotion() ?? false;
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [hovered, setHovered] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  const len = photos.length;
  const go = useCallback(
    (next: number, direction: number) => {
      if (!len) return;
      setDir(direction);
      setIndex(((next % len) + len) % len);
    },
    [len]
  );

  // autoplay
  useEffect(() => {
    if (reduced || hovered || !visible || len < 2) return;
    const t = window.setTimeout(() => go(index + 1, 1), 5000);
    return () => window.clearTimeout(t);
  }, [index, reduced, hovered, visible, len, go]);

  // pause when scrolled off screen
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (!photos.length) return null;
  const active = photos[index];

  return (
    <section
      aria-label={`${title} slideshow`}
      className="bg-cream py-14 sm:py-20"
    >
      <div className="container-page">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-12">
          {/* photos */}
          <div
            ref={frameRef}
            className="group/reel relative"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onFocusCapture={() => setHovered(true)}
            onBlurCapture={() => setHovered(false)}
          >
            <div
              className="relative aspect-[4/5] w-full touch-pan-y overflow-hidden rounded-3xl bg-sand-light shadow-lift ring-1 ring-line/60 sm:aspect-[4/3] lg:aspect-[4/5]"
              role="group"
              aria-roledescription="carousel"
            >
              <AnimatePresence initial={false} custom={dir}>
                <motion.div
                  key={index}
                  custom={dir}
                  className="absolute inset-0"
                  initial={reduced ? { opacity: 0 } : { opacity: 0, x: dir > 0 ? 40 : -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, x: dir > 0 ? -40 : 40 }}
                  transition={{ duration: reduced ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Image
                    src={active.src}
                    alt={active.alt}
                    fill
                    sizes="(min-width: 1024px) 55vw, 92vw"
                    placeholder={active.blurDataURL ? "blur" : undefined}
                    blurDataURL={active.blurDataURL}
                    className="object-contain"
                  />
                </motion.div>
              </AnimatePresence>

              {/* swipe surface */}
              <motion.div
                className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing"
                aria-hidden="true"
                onPanEnd={(e, info) => {
                  const pt = (e as PointerEvent).pointerType;
                  if (pt && pt !== "touch") return;
                  if (info.offset.x < -60) go(index + 1, 1);
                  else if (info.offset.x > 60) go(index - 1, -1);
                }}
              />

              {/* arrows */}
              {len > 1 && (
                <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-between px-3 sm:px-4">
                  <button
                    type="button"
                    aria-label="Previous photo"
                    onClick={() => go(index - 1, -1)}
                    className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full bg-night/40 text-ivory opacity-0 backdrop-blur-sm transition-all duration-300 hover:bg-night/70 focus-visible:opacity-100 group-hover/reel:opacity-100 max-sm:opacity-100"
                  >
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next photo"
                    onClick={() => go(index + 1, 1)}
                    className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full bg-night/40 text-ivory opacity-0 backdrop-blur-sm transition-all duration-300 hover:bg-night/70 focus-visible:opacity-100 group-hover/reel:opacity-100 max-sm:opacity-100"
                  >
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              )}

              {/* counter + dots */}
              {len > 1 && (
                <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between gap-4 p-3 sm:p-4">
                  <span className="rounded-full bg-night/45 px-3 py-1 font-mono text-[11px] font-semibold text-ivory backdrop-blur-sm">
                    {index + 1} / {len}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {photos.map((p, i) => (
                      <button
                        key={p.src + i}
                        type="button"
                        onClick={() => go(i, i > index ? 1 : -1)}
                        aria-label={`Go to photo ${i + 1}`}
                        aria-current={i === index}
                        className={cn(
                          "h-1.5 rounded-full transition-all duration-300",
                          i === index ? "w-6 bg-ivory" : "w-1.5 bg-ivory/50 hover:bg-ivory/80"
                        )}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* bullets + CTA */}
          <div className="flex flex-col justify-center">
            <p className="eyebrow mb-3 text-saffron-deep">The journey</p>
            <h2 className="font-display text-2xl font-bold leading-tight text-forest-deep sm:text-3xl">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-2 text-sm leading-relaxed text-moss sm:text-base">
                {subtitle}
              </p>
            )}

            <ul className="mt-6 space-y-3">
              {bullets.map((point, i) => (
                <li key={`${i}-${point.slice(0, 20)}`} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-saffron/12 text-saffron-deep">
                    <PawPrint className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <span className="text-sm leading-relaxed text-charcoal/80 sm:text-[0.95rem]">
                    {point}
                  </span>
                </li>
              ))}
            </ul>

            {/* support CTA */}
            <div className="mt-7 rounded-3xl bg-forest p-5 text-cream sm:p-6">
              <p className="font-display text-lg font-bold leading-snug">
                {adoptHref && animalName
                  ? `Help write ${animalName}'s next chapter.`
                  : "Stories like this run on support like yours."}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-cream/80">
                Volunteer with our rescue team or donate to keep the next
                rescue possible.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {adoptHref && animalName && (
                  <Link
                    href={adoptHref}
                    className="inline-flex items-center gap-1.5 rounded-full bg-cream px-4 py-2 text-sm font-bold text-forest-deep transition-colors hover:bg-parchment"
                  >
                    <HandHeart className="h-4 w-4" aria-hidden="true" />
                    Adopt {animalName}
                  </Link>
                )}
                <Link
                  href="/donate#give"
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-saffron-deep to-saffron px-4 py-2 text-sm font-bold text-ivory shadow-ember transition-all hover:brightness-105"
                >
                  <HeartHandshake className="h-4 w-4" aria-hidden="true" />
                  Donate
                </Link>
                <Link
                  href="/volunteer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-cream/25 px-4 py-2 text-sm font-semibold text-cream transition-colors hover:bg-cream/10"
                >
                  <Users className="h-4 w-4" aria-hidden="true" />
                  Volunteer
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
