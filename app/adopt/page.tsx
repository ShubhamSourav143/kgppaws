import type { Metadata } from "next";
import Link from "next/link";
import { PawPrint, ArrowUpRight, ArrowDown } from "lucide-react";
import { listAnimals } from "@/services/animals";
import { getAdoptionContent } from "@/services/content";
import { listMedia } from "@/lib/media";
import { poolForSpecies } from "@/lib/demo/photo-pool";
import { AdoptExplorer } from "@/components/adopt/AdoptExplorer";
import { WhyAdopt, type WhyPhotos } from "@/components/adopt/WhyAdopt";
import {
  RescueStories,
  AdoptionProcess,
  FinalCta,
  type Covers,
} from "@/components/adopt/AdoptSections";
import { Reveal } from "@/components/fx/Reveal";
import { TextReveal } from "@/components/fx/TextReveal";
import type { Animal } from "@/types";

export const metadata: Metadata = {
  title: "Adopt, Don't Shop",
  description:
    "Every animal deserves a loving home. Meet the adoptable dogs and cats of IIT Kharagpur — vaccinated, health-assessed, and waiting for a forever family.",
  alternates: { canonical: "/adopt" },
};

export default async function AdoptPage() {
  const [animals, content, adoptMedia, gridMedia] = await Promise.all([
    listAnimals(),
    getAdoptionContent(),
    listMedia("adopt"),
    // the "Why Adoption Matters" bands also pull from the home collage pool
    // (public/images/hero-grid) for photo variety
    listMedia("hero-grid"),
  ]);

  const intro = content.find((c) => c.section === "intro");

  // Real photos drop into public/images/adopt/. The filename (before any
  // "--caption" suffix) is the key: simba.jpg → "simba", hero.jpg → "hero".
  // Everything falls back to the illustrated portrait until a photo exists.
  //
  // NOTE: the files currently in public/images/adopt/ are TEMPORARY
  // royalty-free stock placeholders (generic animals, not real KGP PAWS
  // rescues). Swap them file-for-file with official photos — no code change
  // needed. See public/images/adopt/README.md.
  const covers: Covers = {};
  for (const m of adoptMedia) {
    const file = m.src.split("/").pop() ?? "";
    const key = file.replace(/\.[^.]+$/, "").split("--")[0].toLowerCase();
    if (key && !(key in covers)) covers[key] = m.src;
  }

  // Richer map (src + blur placeholder + dimensions) for the "Why Adoption
  // Matters" bands, which render through next/image. Keyed by filename stem
  // across both the adopt photos and the hero-grid collage pool.
  const whyPhotos: WhyPhotos = {};
  for (const m of [...adoptMedia, ...gridMedia]) {
    const file = m.src.split("/").pop() ?? "";
    const key = file.replace(/\.[^.]+$/, "").split("--")[0].toLowerCase();
    if (key && !(key in whyPhotos)) {
      whyPhotos[key] = {
        src: m.src,
        blurDataURL: m.blurDataURL,
        width: m.width,
        height: m.height,
        alt: m.alt,
      };
    }
  }

  const heroPhoto = covers.hero;

  // Inject each animal's real cover photo (keyed by slug) so the existing
  // AnimalCard renders it automatically — no card changes required.
  //
  // The card cycles through the first three photos that have a URL. Until real
  // per-animal galleries are uploaded, we top the cover up with two stills from
  // the shared collage pool so every card has a full story. The pool is split
  // by species first — a dog's card never pads out with a cat — and each animal
  // draws a different pair. Once an animal has three real uploads of its own,
  // those win and this padding falls away on its own.
  const pool = gridMedia.map((m) => m.src);
  const drawn: Record<string, number> = { dog: 0, cat: 0 };
  const animalsWithPhotos: Animal[] = animals.map((a) => {
    if (!covers[a.slug]) return a;
    const matching = poolForSpecies(pool, a.species);
    // walk the species pool so no two cards of the same species share a still
    const at = drawn[a.species] ?? 0;
    drawn[a.species] = at + 2;
    const extras = matching.length
      ? [matching[at % matching.length], matching[(at + 1) % matching.length]]
      : [];
    return {
      ...a,
      photos: [
        { id: `cover-${a.slug}`, caption: a.name, date: "", url: covers[a.slug] },
        ...extras.map((url, n) => ({
          id: `pool-${a.slug}-${n}`,
          caption: "",
          date: "",
          url,
        })),
        ...a.photos,
      ],
    };
  });

  return (
    <div className="bg-cream">
      {/* 1 · Hero */}
      <header className="aurora relative -mt-16 overflow-hidden bg-night pb-20 pt-32 text-ivory md:-mt-20 md:pt-40">
        {heroPhoto && (
          <div className="absolute inset-0" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroPhoto} alt="" className="h-full w-full object-cover opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-b from-night/85 via-night/60 to-night" />
          </div>
        )}
        <div className="container-page relative z-10 max-w-3xl">
          <Reveal effect="fade">
            <p className="eyebrow mb-5 inline-flex items-center gap-2 text-marigold">
              <PawPrint className="h-4 w-4" aria-hidden="true" />
              Give a second chance
            </p>
          </Reveal>
          <h1 className="text-balance font-display text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
            <TextReveal as="span" text="Adopt, Don't Shop" />{" "}
            <span aria-hidden="true" className="text-terracotta">
              ❤️
            </span>
          </h1>
          <Reveal delay={0.2}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ivory/75">
              Every animal deserves a loving home, not a life of suffering. By
              adopting, you&apos;re not just bringing home a pet — you&apos;re
              giving a second chance to an innocent life.
            </p>
          </Reveal>
          <Reveal delay={0.32} className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              href="#animals"
              className="group inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-saffron-deep via-saffron to-marigold px-8 py-4 text-base font-bold text-ivory shadow-ember transition-all hover:brightness-105 active:scale-95"
            >
              Meet Our Animals
              <ArrowDown className="h-5 w-5 transition-transform group-hover:translate-y-0.5" aria-hidden="true" />
            </Link>
            <Link
              href="#how"
              className="glass-dark inline-flex items-center gap-2 rounded-full px-7 py-4 text-base font-semibold text-ivory transition-colors hover:bg-ivory/15"
            >
              Start Adoption
              <ArrowUpRight className="h-5 w-5 text-chakra-glow transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
            </Link>
          </Reveal>
        </div>
      </header>

      {/* 2 · Why adoption matters */}
      <WhyAdopt photos={whyPhotos} />

      {/* 3 · Adoptable animals */}
      <section id="animals" className="scroll-mt-24 bg-parchment py-20 sm:py-28">
        <div className="container-page">
          <div className="max-w-2xl">
            <Reveal effect="fade">
              <p className="eyebrow mb-4 text-saffron-deep">Meet the paws</p>
            </Reveal>
            <TextReveal
              as="h2"
              text={intro?.title || "Maybe your best friend is waiting."}
              className="font-display text-3xl font-bold leading-tight text-forest-deep sm:text-4xl lg:text-5xl"
            />
            <Reveal delay={0.2}>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-charcoal/70">
                {intro?.body ||
                  "Every adoptable paw here is vaccinated, temperament-assessed and cared for by volunteers who know them by name."}
              </p>
            </Reveal>
          </div>
          <AdoptExplorer animals={animalsWithPhotos} />
        </div>
      </section>

      {/* 4 · Adoption process */}
      <section id="how" className="scroll-mt-24">
        <AdoptionProcess />
      </section>

      {/* 5 · Real rescue stories */}
      <RescueStories animals={animalsWithPhotos} covers={covers} />

      {/* 6 · Final call to action */}
      <FinalCta animals={animalsWithPhotos} covers={covers} />
    </div>
  );
}
