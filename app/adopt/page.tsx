import type { Metadata } from "next";
import Link from "next/link";
import { PawPrint, ArrowUpRight, ArrowDown } from "lucide-react";
import { listAnimals } from "@/services/animals";
import { getAdoptionContent } from "@/services/content";
import { AdoptExplorer } from "@/components/adopt/AdoptExplorer";
import {
  WhyAdopt,
  RescueStories,
  AdoptionProcess,
  FinalCta,
} from "@/components/adopt/AdoptSections";
import { Reveal } from "@/components/fx/Reveal";
import { TextReveal } from "@/components/fx/TextReveal";

export const metadata: Metadata = {
  title: "Adopt, Don't Shop",
  description:
    "Every animal deserves a loving home. Meet the adoptable dogs and cats of IIT Kharagpur — vaccinated, health-assessed, and waiting for a forever family.",
  alternates: { canonical: "/adopt" },
};

export default async function AdoptPage() {
  const [animals, content] = await Promise.all([
    listAnimals(),
    getAdoptionContent(),
  ]);

  const intro = content.find((c) => c.section === "intro");

  return (
    <div className="bg-cream">
      {/* 1 · Hero */}
      <header className="aurora relative -mt-16 overflow-hidden bg-night pb-20 pt-32 text-ivory md:-mt-20 md:pt-40">
        <div className="container-page max-w-3xl">
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
      <WhyAdopt />

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
          <AdoptExplorer animals={animals} />
        </div>
      </section>

      {/* 4 · Adoption process */}
      <section id="how" className="scroll-mt-24">
        <AdoptionProcess />
      </section>

      {/* 5 · Real rescue stories */}
      <RescueStories animals={animals} />

      {/* 6 · Final call to action */}
      <FinalCta animals={animals} />
    </div>
  );
}
