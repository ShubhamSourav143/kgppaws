"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, PawPrint } from "lucide-react";
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
 * Home hero — a photo mosaic. A warm content panel holds the left half
 * (headline / description / CTA); the right half is a grid of real rescue
 * photographs that reveal on a stagger and lift on hover.
 *
 * The grid photos are temporary royalty-free placeholders in
 * public/images/hero-grid/ — swap the files (grid-01…grid-08) to replace
 * them with official KGP PAWS photography; no code change needed.
 * See public/images/hero-grid/README.md.
 */
const GRID_PHOTOS = Array.from(
  { length: 8 },
  (_, i) => `/images/hero-grid/grid-0${i + 1}.jpg`
);

// desktop placement: content fills the left 2×4; photos fill the right 2 cols.
const CELL_SPANS = [
  "lg:col-start-3 lg:row-start-1",
  "lg:col-start-4 lg:row-start-1",
  "lg:col-start-3 lg:row-start-2",
  "lg:col-start-4 lg:row-start-2",
  "lg:col-start-3 lg:row-start-3",
  "lg:col-start-4 lg:row-start-3",
  "lg:col-start-3 lg:row-start-4",
  "lg:col-start-4 lg:row-start-4",
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

  const cellReveal = {
    hidden: reduced ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 24 },
    show: { opacity: 1, scale: 1, y: 0 },
  };

  return (
    <section
      aria-label="Welcome"
      className="relative -mt-16 overflow-hidden bg-gradient-to-br from-chakra-ink via-night to-forest-deep pb-16 pt-24 md:-mt-20 md:pb-20 md:pt-28"
    >
      {/* ambient tricolour glows */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-1/3 h-96 w-96 rounded-full bg-saffron/25 blur-[120px]" />
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-chakra/30 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-forest-bright/20 blur-[120px]" />
      </div>

      <div className="container-page relative">
        <motion.div
          initial="hidden"
          animate="show"
          transition={{ staggerChildren: reduced ? 0 : 0.08, delayChildren: 0.1 }}
          className="grid grid-cols-2 gap-3 sm:gap-4 lg:h-[44rem] lg:grid-cols-4 lg:grid-rows-4"
        >
          {/* content panel — left 2×4 */}
          <motion.div
            variants={{
              hidden: reduced ? { opacity: 0 } : { opacity: 0, y: 28 },
              show: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative col-span-2 flex flex-col justify-center overflow-hidden rounded-[1.75rem] border border-ivory/50 bg-gradient-to-br from-ivory via-ivory to-saffron/15 p-7 shadow-lift sm:p-9 lg:col-span-2 lg:row-span-4 lg:p-11"
          >
            {/* corner paw watermark */}
            <PawPrint
              aria-hidden="true"
              className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rotate-12 text-saffron/10"
            />

            <span className="mb-6 inline-flex w-fit items-center gap-2.5 rounded-full bg-forest/10 py-1.5 pl-1.5 pr-4 text-[11px] font-bold uppercase tracking-[0.14em] text-forest-deep">
              <Seal size={24} className="h-6 w-6 shrink-0" />
              An IIT Kharagpur student initiative
            </span>

            <h1 className="text-balance font-display text-4xl font-bold leading-[1.03] text-forest-deep sm:text-5xl lg:text-6xl">
              {title}
            </h1>

            {/* tricolour rule */}
            <span
              aria-hidden="true"
              className="mt-6 flex h-1.5 w-40 overflow-hidden rounded-full"
            >
              <span className="flex-1 bg-saffron" />
              <span className="flex-1 bg-ivory ring-1 ring-inset ring-line" />
              <span className="flex-1 bg-forest-bright" />
            </span>

            <p className="mt-6 max-w-md text-base leading-relaxed text-charcoal/70 sm:text-lg">
              {sub}
            </p>

            <div className="mt-8">
              <Magnetic strength={0.3}>
                <Link
                  href={ctaUrl}
                  className="group inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-saffron-deep via-saffron to-marigold px-8 py-4 text-base font-bold text-ivory shadow-ember transition-all hover:brightness-105 active:scale-95"
                >
                  {ctaLabel}
                  <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                </Link>
              </Magnetic>
            </div>

            <p className="mt-6 text-xs font-semibold text-moss">
              Adopt a friend for life · together, we heal and grow.
            </p>
          </motion.div>

          {/* photo cells — right 2 columns */}
          {GRID_PHOTOS.map((src, i) => (
            <motion.div
              key={src}
              variants={cellReveal}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className={`group relative aspect-square overflow-hidden rounded-[1.25rem] ring-1 ring-ivory/10 lg:aspect-auto lg:h-full ${CELL_SPANS[i]}`}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="(min-width: 1024px) 22vw, 45vw"
                className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110"
              />
              <span
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-night/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
              <span
                aria-hidden="true"
                className="absolute inset-0 rounded-[1.25rem] ring-0 ring-inset ring-saffron/0 transition-all duration-300 group-hover:ring-2 group-hover:ring-saffron/70"
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
