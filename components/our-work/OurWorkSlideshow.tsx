"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SlidePhoto {
  src: string;
  alt: string;
  blurDataURL?: string;
}

export interface OurWorkSlideshowProps {
  photos: SlidePhoto[];
  aspect?: "video" | "wide" | "square" | "portrait";
  autoplayMs?: number;
  className?: string;
  rounded?: string;
}

const ASPECTS: Record<NonNullable<OurWorkSlideshowProps["aspect"]>, string> = {
  video: "aspect-[16/9]",
  wide: "aspect-[3/2]",
  square: "aspect-square",
  portrait: "aspect-[4/5]",
};

export function OurWorkSlideshow({
  photos,
  aspect = "wide",
  autoplayMs = 4500,
  className,
  rounded = "rounded-[1.75rem]",
}: OurWorkSlideshowProps) {
  const reduced = useReducedMotion() ?? false;
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
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

  useEffect(() => {
    if (reduced || hovered || !visible || fullscreen || len < 2) return;
    const t = window.setTimeout(() => go(index + 1, 1), autoplayMs);
    return () => window.clearTimeout(t);
  }, [index, reduced, hovered, visible, fullscreen, len, go, autoplayMs]);

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

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
      if (e.key === "ArrowRight") go(index + 1, 1);
      if (e.key === "ArrowLeft") go(index - 1, -1);
    };
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [fullscreen, index, go]);

  if (!len) {
    return (
      <div
        className={cn(
          "grid place-items-center bg-sand-light text-sm text-moss",
          ASPECTS[aspect],
          rounded,
          className
        )}
      >
        Photographs coming soon.
      </div>
    );
  }

  const active = photos[index];

  return (
    <>
      <div
        ref={frameRef}
        className={cn("group/reel relative", className)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocusCapture={() => setHovered(true)}
        onBlurCapture={() => setHovered(false)}
      >
        <div
          className={cn(
            "relative w-full touch-pan-y overflow-hidden bg-night shadow-lift ring-1 ring-line/50",
            ASPECTS[aspect],
            rounded
          )}
          role="group"
          aria-roledescription="carousel"
        >
          <AnimatePresence initial={false} custom={dir}>
            <motion.div
              key={index}
              custom={dir}
              className="absolute inset-0"
              initial={reduced ? { opacity: 0 } : { opacity: 0, x: dir > 0 ? 50 : -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, x: dir > 0 ? -50 : 50 }}
              transition={{ duration: reduced ? 0 : 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <Image
                src={active.src}
                alt={active.alt}
                fill
                sizes="(min-width: 1024px) 80vw, 100vw"
                placeholder={active.blurDataURL ? "blur" : undefined}
                blurDataURL={active.blurDataURL}
                className="object-cover"
              />
            </motion.div>
          </AnimatePresence>

          {/* swipe surface + fullscreen click */}
          <motion.button
            type="button"
            className="absolute inset-0 z-10 cursor-zoom-in"
            aria-label="Open image in fullscreen"
            onClick={() => setFullscreen(true)}
            onPanEnd={(e, info) => {
              const pt = (e as PointerEvent).pointerType;
              if (pt && pt !== "touch") return;
              if (info.offset.x < -60) go(index + 1, 1);
              else if (info.offset.x > 60) go(index - 1, -1);
            }}
          />

          {/* expand hint */}
          <span className="pointer-events-none absolute right-3 top-3 z-20 inline-flex items-center gap-1.5 rounded-full bg-night/45 px-2.5 py-1 text-[11px] font-semibold text-ivory opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover/reel:opacity-100">
            <Expand className="h-3.5 w-3.5" aria-hidden="true" />
            Click to expand
          </span>

          {len > 1 && (
            <>
              <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-between px-3 sm:px-4">
                <button
                  type="button"
                  aria-label="Previous photo"
                  onClick={(e) => {
                    e.stopPropagation();
                    go(index - 1, -1);
                  }}
                  className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full bg-night/50 text-ivory opacity-0 backdrop-blur-sm transition-all duration-300 hover:bg-night/75 focus-visible:opacity-100 group-hover/reel:opacity-100 max-sm:opacity-100"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="Next photo"
                  onClick={(e) => {
                    e.stopPropagation();
                    go(index + 1, 1);
                  }}
                  className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full bg-night/50 text-ivory opacity-0 backdrop-blur-sm transition-all duration-300 hover:bg-night/75 focus-visible:opacity-100 group-hover/reel:opacity-100 max-sm:opacity-100"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between gap-4 bg-gradient-to-t from-night/60 to-transparent p-3 sm:p-4">
                <span className="rounded-full bg-night/45 px-3 py-1 font-mono text-[11px] font-semibold text-ivory backdrop-blur-sm">
                  {index + 1} / {len}
                </span>
                <div className="flex items-center gap-1.5">
                  {photos.map((p, i) => (
                    <button
                      key={p.src + i}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        go(i, i > index ? 1 : -1);
                      }}
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
            </>
          )}
        </div>
      </div>

      {/* Fullscreen lightbox */}
      <AnimatePresence>
        {fullscreen && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-night/95 backdrop-blur"
            role="dialog"
            aria-modal="true"
            aria-label="Photo viewer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <button
              type="button"
              onClick={() => setFullscreen(false)}
              aria-label="Close fullscreen"
              className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full bg-ivory/10 text-ivory backdrop-blur-sm transition-colors hover:bg-ivory/20"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>

            {len > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous photo"
                  onClick={() => go(index - 1, -1)}
                  className="absolute left-4 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-ivory/10 text-ivory backdrop-blur-sm transition-colors hover:bg-ivory/20"
                >
                  <ChevronLeft className="h-6 w-6" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="Next photo"
                  onClick={() => go(index + 1, 1)}
                  className="absolute right-4 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-ivory/10 text-ivory backdrop-blur-sm transition-colors hover:bg-ivory/20"
                >
                  <ChevronRight className="h-6 w-6" aria-hidden="true" />
                </button>
              </>
            )}

            <motion.div
              key={index}
              className="relative h-[85vh] w-[92vw] max-w-6xl"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <Image
                src={active.src}
                alt={active.alt}
                fill
                sizes="92vw"
                placeholder={active.blurDataURL ? "blur" : undefined}
                blurDataURL={active.blurDataURL}
                className="object-contain"
              />
            </motion.div>

            <div className="absolute inset-x-0 bottom-6 z-10 mx-auto flex max-w-2xl items-center justify-center gap-3">
              <span className="rounded-full bg-ivory/10 px-3 py-1 font-mono text-xs font-semibold text-ivory backdrop-blur-sm">
                {index + 1} / {len}
              </span>
              {active.alt && (
                <p className="max-w-lg truncate text-sm text-ivory/80">{active.alt}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
