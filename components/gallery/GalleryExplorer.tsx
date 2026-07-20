"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { SmartImage } from "@/components/media/SmartImage";
import { cn } from "@/lib/utils";

export interface GalleryItem {
  src: string;
  alt: string;
  width: number;
  height: number;
  blurDataURL?: string;
  category: string;
}

const PAGE = 24;

export function GalleryExplorer({
  items,
  categories,
}: {
  items: GalleryItem[];
  categories: string[];
}) {
  const reduced = useReducedMotion();
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (it) =>
        (category === "All" || it.category === category) &&
        (!q || it.alt.toLowerCase().includes(q) || it.category.toLowerCase().includes(q))
    );
  }, [items, category, query]);

  const visible = filtered.slice(0, limit);

  // infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setLimit((l) => Math.min(l + PAGE, filtered.length)),
      { rootMargin: "600px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [filtered.length]);

  const close = useCallback(() => {
    setLightbox(null);
    returnFocusRef.current?.focus();
  }, []);

  // lightbox keyboard
  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") setLightbox((i) => (i === null ? i : (i + 1) % filtered.length));
      if (e.key === "ArrowLeft") setLightbox((i) => (i === null ? i : (i - 1 + filtered.length) % filtered.length));
    };
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [lightbox !== null, filtered.length, close]);

  const current = lightbox !== null ? filtered[lightbox] : null;

  return (
    <div>
      {/* controls */}
      <div className="glass sticky top-16 z-30 -mx-1 rounded-3xl px-4 py-3 shadow-soft md:top-20">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-1 flex-wrap gap-2" role="tablist" aria-label="Photo categories">
            {["All", ...categories].map((c) => {
              const active = category === c;
              return (
                <button
                  key={c}
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setCategory(c);
                    setLimit(PAGE);
                  }}
                  className={cn(
                    "relative rounded-full px-4 py-2 text-sm font-bold transition-colors",
                    active ? "text-ivory" : "text-forest hover:bg-forest/5"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId={reduced ? undefined : "gallery-pill"}
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-saffron-deep to-saffron shadow-ember"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative">{c}</span>
                </button>
              );
            })}
          </div>
          <label className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-moss" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setLimit(PAGE);
              }}
              placeholder="Search photos…"
              aria-label="Search photos"
              className="w-40 rounded-full border border-forest/15 bg-ivory py-2.5 pl-10 pr-4 text-sm text-charcoal outline-none transition-all placeholder:text-moss/70 focus:w-56 focus:border-saffron sm:w-48 sm:focus:w-64"
            />
          </label>
        </div>
      </div>

      {/* masonry */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${category}-${query}`}
          initial={reduced ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? undefined : { opacity: 0, y: -10 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 columns-2 gap-4 md:columns-3 xl:columns-4 [&>*]:mb-4"
        >
          {visible.map((item, i) => (
            <figure key={item.src} className="break-inside-avoid">
              <button
                type="button"
                onClick={(e) => {
                  returnFocusRef.current = e.currentTarget;
                  setLightbox(i);
                }}
                className="group relative block w-full overflow-hidden rounded-2xl text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-saffron-deep"
                aria-label={`View photo: ${item.alt}`}
              >
                <SmartImage
                  src={item.src}
                  alt={item.alt}
                  width={item.width}
                  height={item.height}
                  placeholder={item.blurDataURL ? "blur" : undefined}
                  blurDataURL={item.blurDataURL}
                  sizes="(min-width: 1280px) 20rem, (min-width: 768px) 30vw, 45vw"
                  className="w-full"
                  imgClassName="w-full transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                />
                <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-night/75 to-transparent p-4 pt-10 text-sm font-semibold text-ivory opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  {item.alt}
                  <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-widest text-gold-soft/90">
                    {item.category}
                  </span>
                </figcaption>
              </button>
            </figure>
          ))}
        </motion.div>
      </AnimatePresence>

      {visible.length < filtered.length && <div ref={sentinelRef} className="h-12" aria-hidden="true" />}

      {filtered.length === 0 && (
        <div className="py-24 text-center">
          <p className="font-display text-2xl font-bold text-forest-deep">No photos match.</p>
          <p className="mt-2 text-moss">Try a different search or category.</p>
        </div>
      )}

      {/* lightbox */}
      <AnimatePresence>
        {current && lightbox !== null && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={current.alt}
            data-lenis-prevent
            className="fixed inset-0 z-[80] flex flex-col bg-night/95 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={close}
          >
            <div className="flex items-center justify-between p-4 text-ivory">
              <span className="text-sm font-semibold text-ivory/70">
                {lightbox + 1} / {filtered.length}
              </span>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                aria-label="Close viewer"
                className="grid h-11 w-11 place-items-center rounded-full bg-ivory/10 transition-colors hover:bg-ivory/20"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <motion.div
              key={current.src}
              className="relative mx-4 mb-4 flex-1"
              onClick={(e) => e.stopPropagation()}
              initial={reduced ? false : { opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              drag={reduced ? false : "x"}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              onDragEnd={(_, info) => {
                if (info.offset.x < -70) setLightbox((lightbox + 1) % filtered.length);
                else if (info.offset.x > 70) setLightbox((lightbox - 1 + filtered.length) % filtered.length);
              }}
            >
              <Image
                src={current.src}
                alt={current.alt}
                fill
                sizes="100vw"
                priority
                className="select-none object-contain"
                draggable={false}
              />
            </motion.div>

            <div className="flex items-center justify-between p-4 pt-0" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setLightbox((lightbox - 1 + filtered.length) % filtered.length)}
                aria-label="Previous photo"
                className="grid h-12 w-12 place-items-center rounded-full bg-ivory/10 text-ivory transition-colors hover:bg-ivory/20"
              >
                <ChevronLeft className="h-6 w-6" aria-hidden="true" />
              </button>
              <p className="mx-4 flex-1 truncate text-center text-sm text-ivory/85">
                {current.alt}
                <span className="ml-2 rounded-full bg-ivory/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold-soft">
                  {current.category}
                </span>
              </p>
              <button
                type="button"
                onClick={() => setLightbox((lightbox + 1) % filtered.length)}
                aria-label="Next photo"
                className="grid h-12 w-12 place-items-center rounded-full bg-ivory/10 text-ivory transition-colors hover:bg-ivory/20"
              >
                <ChevronRight className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
