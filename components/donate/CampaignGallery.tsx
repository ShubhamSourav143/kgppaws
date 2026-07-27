"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GalleryPhoto {
  src: string;
  alt: string;
  blurDataURL?: string;
}

const INTERVAL = 4000;

/**
 * Cinematic campaign gallery — one large photograph at a time, cross-fading
 * every four seconds while the active frame drifts in a slow Ken Burns push.
 *
 * Advancing is deliberately time-based rather than a per-frame counter, so the
 * cadence holds on any refresh rate. The reel pauses while hovered, while the
 * lightbox is open and whenever it scrolls out of view, so a page carrying
 * four of these is never animating photographs nobody is looking at.
 *
 * Arrows and swipe drive it manually; clicking opens a full-screen viewer with
 * arrow-key and Escape support. Only the neighbouring frames are eagerly
 * fetched — the rest stay lazy.
 */
export function CampaignGallery({
  photos,
  title,
}: {
  photos: GalleryPhoto[];
  title: string;
}) {
  const reduced = useReducedMotion() ?? false;
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [lightbox, setLightbox] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(true);

  const frameRef = useRef<HTMLDivElement>(null);
  const len = photos.length;

  const go = useCallback(
    (next: number, direction: number) => {
      if (!len) return;
      setDir(direction);
      setIndex(((next % len) + len) % len);
    },
    [len]
  );

  // Autoplay. Restarting the timer on `index` keeps a manual advance from
  // being cut short by whatever was left of the previous tick.
  useEffect(() => {
    if (reduced || hovered || lightbox || !visible || len < 2) return;
    const t = window.setTimeout(() => go(index + 1, 1), INTERVAL);
    return () => window.clearTimeout(t);
  }, [index, reduced, hovered, lightbox, visible, len, go]);

  // Don't animate a reel that has scrolled off screen.
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Lightbox keyboard controls.
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight") go(index + 1, 1);
      if (e.key === "ArrowLeft") go(index - 1, -1);
    };
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [lightbox, index, go]);

  if (!len) return null;
  const active = photos[index];
  const near = (i: number) =>
    i === index || i === (index + 1) % len || i === (index - 1 + len) % len;

  return (
    <>
      <div
        ref={frameRef}
        className="group/gal relative"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          className="relative aspect-[4/3] w-full touch-pan-y overflow-hidden rounded-3xl bg-sand-light shadow-lift ring-1 ring-line/60 sm:aspect-[3/2]"
          role="group"
          aria-roledescription="carousel"
          aria-label={`${title} photo gallery`}
        >
          <AnimatePresence initial={false}>
            <motion.div
              key={index}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.9, ease: "easeInOut" }}
            >
              {/* Ken Burns lives on an inner layer so the cross-fade above
                  never fights the zoom transform. */}
              <motion.div
                className="absolute inset-0"
                initial={reduced ? false : { scale: 1.02 }}
                animate={reduced ? undefined : { scale: 1.14 }}
                transition={{ duration: 9, ease: "linear" }}
              >
                <Image
                  src={active.src}
                  alt={active.alt}
                  fill
                  sizes="(min-width: 1024px) 60vw, 92vw"
                  placeholder={active.blurDataURL ? "blur" : undefined}
                  blurDataURL={active.blurDataURL}
                  className="object-contain"
                />
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* swipe surface + click-to-expand */}
          <motion.button
            type="button"
            className="absolute inset-0 z-10 cursor-zoom-in"
            aria-label={`Open ${title} gallery full screen`}
            onClick={() => setLightbox(true)}
            onPanEnd={(e, info) => {
              const pt = (e as PointerEvent).pointerType;
              if (pt && pt !== "touch") return;
              if (info.offset.x < -60) go(index + 1, 1);
              else if (info.offset.x > 60) go(index - 1, -1);
            }}
          />

          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-night/55 to-transparent"
          />

          {/* arrows */}
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-between px-3 sm:px-4">
            <Arrow
              side="prev"
              label="Previous photo"
              onClick={() => go(index - 1, -1)}
            />
            <Arrow side="next" label="Next photo" onClick={() => go(index + 1, 1)} />
          </div>

          <button
            type="button"
            onClick={() => setLightbox(true)}
            aria-label="View full screen"
            className="absolute right-3 top-3 z-20 grid h-10 w-10 place-items-center rounded-full bg-night/45 text-ivory backdrop-blur-sm transition-all hover:bg-night/70 sm:right-4 sm:top-4"
          >
            <Expand className="h-4 w-4" aria-hidden="true" />
          </button>

          {/* counter + dots */}
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
        </div>

        {/* preload only the neighbours; everything else stays lazy */}
        <div className="hidden" aria-hidden="true">
          {photos.map((p, i) =>
            near(i) && i !== index ? (
              <Image
                key={p.src + i}
                src={p.src}
                alt=""
                width={16}
                height={12}
                sizes="16px"
                placeholder={p.blurDataURL ? "blur" : undefined}
                blurDataURL={p.blurDataURL}
              />
            ) : null
          )}
        </div>
      </div>

      {/* ——— full-screen viewer ——— */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-night/95 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            role="dialog"
            aria-modal="true"
            aria-label={`${title} gallery, photo ${index + 1} of ${len}`}
          >
            <button
              type="button"
              onClick={() => setLightbox(false)}
              aria-label="Close gallery"
              className="absolute right-4 top-4 z-10 grid h-12 w-12 place-items-center rounded-full bg-ivory/10 text-ivory transition-colors hover:bg-ivory/25"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>

            <motion.div
              key={index}
              className="relative h-full max-h-[82vh] w-full max-w-6xl"
              initial={{ opacity: 0, x: dir > 0 ? 40 : -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: reduced ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <Image
                src={active.src}
                alt={active.alt}
                fill
                sizes="100vw"
                placeholder={active.blurDataURL ? "blur" : undefined}
                blurDataURL={active.blurDataURL}
                className="object-contain"
              />
            </motion.div>

            <div className="absolute inset-x-0 bottom-6 flex flex-col items-center gap-3 px-4">
              <p className="max-w-2xl text-center text-sm text-ivory/80">{active.alt}</p>
              <div className="flex items-center gap-4">
                <LightboxArrow label="Previous photo" onClick={() => go(index - 1, -1)}>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </LightboxArrow>
                <span className="font-mono text-xs text-ivory/70">
                  {index + 1} / {len}
                </span>
                <LightboxArrow label="Next photo" onClick={() => go(index + 1, 1)}>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </LightboxArrow>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Arrow({
  side,
  label,
  onClick,
}: {
  side: "prev" | "next";
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full bg-night/40 text-ivory opacity-0 backdrop-blur-sm transition-all duration-300 hover:bg-night/70 focus-visible:opacity-100 group-hover/gal:opacity-100 max-sm:opacity-100"
    >
      {side === "prev" ? (
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
      ) : (
        <ChevronRight className="h-5 w-5" aria-hidden="true" />
      )}
    </button>
  );
}

function LightboxArrow({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid h-11 w-11 place-items-center rounded-full bg-ivory/10 text-ivory transition-colors hover:bg-ivory/25"
    >
      {children}
    </button>
  );
}
