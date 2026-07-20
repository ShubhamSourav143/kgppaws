"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, BadgeCheck, MoveHorizontal } from "lucide-react";
import { AnimalPortrait } from "@/components/animals/Portrait";
import { Reveal } from "@/components/fx/Reveal";
import { TextReveal } from "@/components/fx/TextReveal";
import type { ContentSectionRow } from "@/services/content";
import type { Animal } from "@/types";

const AVAILABILITY: Record<Animal["adoption"], { label: string; cls: string }> = {
  available: { label: "Ready to adopt", cls: "bg-forest-bright/90 text-ivory" },
  foster_needed: { label: "Ready to adopt", cls: "bg-forest-bright/90 text-ivory" },
  adopted: { label: "Adopted ♥", cls: "bg-saffron/90 text-ivory" },
  not_available: { label: "Campus resident", cls: "bg-earth/85 text-ivory" },
};

function RescueCard({ animal, index }: { animal: Animal; index: number }) {
  const availability = AVAILABILITY[animal.adoption] ?? AVAILABILITY.not_available;
  const photo = animal.photos.find((p) => p.url)?.url;

  return (
    <motion.article
      className="group relative w-[78vw] max-w-xs shrink-0 snap-center sm:w-72 lg:w-80"
      initial={{ opacity: 0, y: 44 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: Math.min(index * 0.07, 0.35), ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        href={`/animal/${animal.slug}`}
        className="block overflow-hidden rounded-[2rem] bg-ivory shadow-card transition-shadow duration-300 hover:shadow-glow"
      >
        <div className="relative overflow-hidden">
          <AnimalPortrait
            animal={animal}
            photoUrl={photo}
            className="aspect-[4/5] w-full transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          />
          <span className={`absolute left-4 top-4 rounded-full px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide backdrop-blur ${availability.cls}`}>
            {availability.label}
          </span>
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-night/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <span className="absolute bottom-4 right-4 grid h-10 w-10 translate-y-3 place-items-center rounded-full bg-ivory text-forest opacity-0 shadow-soft transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
        <div className="space-y-1.5 p-5">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-display text-2xl font-bold text-forest-deep">{animal.name}</h3>
            <span className="text-xs font-semibold text-moss">{animal.ageLabel}</span>
          </div>
          <p className="line-clamp-2 text-sm leading-relaxed text-charcoal/70">{animal.tagline}</p>
          <div className="flex items-center gap-3 pt-2 text-[11px] font-semibold text-moss">
            {animal.vaccinated && (
              <span className="inline-flex items-center gap-1">
                <BadgeCheck className="h-3.5 w-3.5 text-forest-bright" aria-hidden="true" /> Vaccinated
              </span>
            )}
            {animal.sterilized && (
              <span className="inline-flex items-center gap-1">
                <BadgeCheck className="h-3.5 w-3.5 text-forest-bright" aria-hidden="true" /> Sterilized
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

/** Cinema-strip of adoptable and campus animals — swipe on touch, drag cue on desktop. */
export function FeaturedRescues({
  animals,
  cms,
}: {
  animals: Animal[];
  cms?: ContentSectionRow;
}) {
  const featured = [
    ...animals.filter((a) => a.adoption === "available"),
    ...animals.filter((a) => a.adoption !== "available"),
  ].slice(0, 8);

  return (
    <section aria-labelledby="featured-h" className="overflow-hidden bg-parchment py-24 sm:py-32">
      <div className="container-page flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-xl">
          <Reveal effect="fade">
            <p className="eyebrow mb-5 text-saffron-deep">{cms?.title || "Featured rescues"}</p>
          </Reveal>
          <TextReveal
            as="h2"
            text={cms?.subtitle || "Faces you'll never forget."}
            className="font-display text-3xl font-bold leading-tight text-forest-deep sm:text-4xl lg:text-5xl"
          />
        </div>
        <Reveal className="flex items-center gap-5">
          <span className="hidden items-center gap-2 text-xs font-bold uppercase tracking-widest text-moss sm:inline-flex">
            <MoveHorizontal className="h-4 w-4" aria-hidden="true" /> drag / swipe
          </span>
          <Link
            href="/adopt"
            className="group inline-flex items-center gap-2 rounded-full border-2 border-forest px-6 py-3 text-sm font-bold text-forest transition-colors hover:bg-forest hover:text-ivory"
          >
            All animals
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </Reveal>
      </div>

      <div className="scroller-x mt-12 gap-5 px-5 pb-4 sm:px-8 lg:px-[max(3rem,calc((100vw-80rem)/2+3rem))]">
        {featured.map((animal, i) => (
          <RescueCard key={animal.id} animal={animal} index={i} />
        ))}
        {/* end card */}
        <Link
          href="/adopt"
          className="group grid w-[60vw] max-w-[16rem] shrink-0 snap-center place-items-center rounded-[2rem] border-2 border-dashed border-forest/25 text-center transition-colors hover:border-saffron hover:bg-saffron/5"
        >
          <span className="space-y-3 p-8">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-saffron-deep to-saffron text-ivory shadow-ember transition-transform group-hover:scale-110">
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="block font-display text-xl font-bold text-forest-deep">
              Meet every paw
            </span>
          </span>
        </Link>
      </div>
    </section>
  );
}
