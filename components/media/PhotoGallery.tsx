"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Camera, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

export interface GalleryPhoto {
  id: string;
  url?: string;
  caption: string;
  date?: string;
}

/**
 * Real-photo gallery with a keyboard-accessible lightbox. Photos without a
 * `url` (demo entries with no Storage upload) fall back to a decorative
 * gradient tile rather than a broken image — never silently blank.
 */
export function PhotoGallery({
  photos,
  fallbackPalette = ["#B08968", "#7C5233"],
}: {
  photos: GalleryPhoto[];
  fallbackPalette?: [string, string];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenIndex(null);
      if (e.key === "ArrowRight") setOpenIndex((i) => (i === null ? i : (i + 1) % photos.length));
      if (e.key === "ArrowLeft") setOpenIndex((i) => (i === null ? i : (i - 1 + photos.length) % photos.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex, photos.length]);

  if (photos.length === 0) return null;

  return (
    <>
      <ul className="flex snap-x gap-4 overflow-x-auto pb-3">
        {photos.map((photo, i) => (
          <li key={photo.id} className="w-60 shrink-0 snap-start">
            <Reveal delay={i * 0.06}>
              <button
                type="button"
                onClick={() => setOpenIndex(i)}
                className="group block w-full overflow-hidden rounded-2xl border border-line bg-parchment text-left shadow-soft transition-shadow hover:shadow-lift"
                aria-label={`View photo: ${photo.caption || "untitled"}`}
              >
                <div className="relative aspect-square overflow-hidden">
                  {photo.url ? (
                    <Image
                      src={photo.url}
                      alt={photo.caption}
                      fill
                      sizes="240px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className="grain grid h-full w-full place-items-center"
                      style={{
                        background: `linear-gradient(${140 + i * 40}deg, ${fallbackPalette[0]}, ${fallbackPalette[1]})`,
                      }}
                    >
                      <Camera className="h-8 w-8 text-parchment/70" aria-hidden="true" />
                      <span className="absolute bottom-2 right-3 text-[10px] font-bold text-parchment/70">
                        photo via CMS
                      </span>
                    </div>
                  )}
                </div>
                {(photo.caption || photo.date) && (
                  <div className="p-3">
                    {photo.caption && (
                      <p className="text-sm font-semibold text-forest-deep">{photo.caption}</p>
                    )}
                    {photo.date && <p className="mt-0.5 text-xs text-moss">{photo.date}</p>}
                  </div>
                )}
              </button>
            </Reveal>
          </li>
        ))}
      </ul>

      <AnimatePresence>
        {openIndex !== null && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Photo viewer"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-charcoal/90 p-4 backdrop-blur-sm"
            initial={reduce ? undefined : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpenIndex(null)}
          >
            <button
              type="button"
              onClick={() => setOpenIndex(null)}
              aria-label="Close photo viewer"
              className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-cream/10 text-cream transition-colors hover:bg-cream/20"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>

            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenIndex((i) => (i === null ? i : (i - 1 + photos.length) % photos.length));
                  }}
                  aria-label="Previous photo"
                  className="absolute left-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-cream/10 text-cream transition-colors hover:bg-cream/20 sm:left-4"
                >
                  <ChevronLeft className="h-6 w-6" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenIndex((i) => (i === null ? i : (i + 1) % photos.length));
                  }}
                  aria-label="Next photo"
                  className="absolute right-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-cream/10 text-cream transition-colors hover:bg-cream/20 sm:right-4"
                >
                  <ChevronRight className="h-6 w-6" aria-hidden="true" />
                </button>
              </>
            )}

            <motion.figure
              key={openIndex}
              className="flex max-h-full max-w-3xl flex-col items-center"
              initial={reduce ? undefined : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              {photos[openIndex].url ? (
                <div className="relative max-h-[75vh] w-full">
                  <Image
                    src={photos[openIndex].url!}
                    alt={photos[openIndex].caption}
                    width={1200}
                    height={1200}
                    sizes="90vw"
                    className={cn("max-h-[75vh] w-auto rounded-2xl object-contain")}
                  />
                </div>
              ) : (
                <div
                  className="grain grid aspect-square w-full max-w-md place-items-center rounded-2xl"
                  style={{
                    background: `linear-gradient(150deg, ${fallbackPalette[0]}, ${fallbackPalette[1]})`,
                  }}
                >
                  <Camera className="h-12 w-12 text-parchment/70" aria-hidden="true" />
                </div>
              )}
              {photos[openIndex].caption && (
                <figcaption className="mt-4 max-w-lg text-center text-sm font-semibold text-cream/90">
                  {photos[openIndex].caption}
                </figcaption>
              )}
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
