"use client";

import { useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { AnimalCard } from "@/components/animals/AnimalCard";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/ui/Section";
import { ButtonLink } from "@/components/ui/Button";
import type { Animal } from "@/types";

/** Horizontal snap carousel of animal cards. */
export function MeetThePaws({ animals }: { animals: Animal[] }) {
  const trackRef = useRef<HTMLUListElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    trackRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  return (
    <section className="overflow-hidden bg-parchment py-20 sm:py-28" aria-labelledby="meet-h">
      <div className="container-page">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              eyebrow="Meet the Paws"
              title="The residents, in person."
              sub="Every card is a real profile — health record, personality, and all."
            />
            <div className="hidden gap-2 md:flex">
              <button
                type="button"
                onClick={() => scrollBy(-1)}
                aria-label="Scroll to previous animals"
                className="grid h-12 w-12 place-items-center rounded-full border border-forest/20 text-forest transition-colors hover:bg-mist"
              >
                <ArrowLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => scrollBy(1)}
                aria-label="Scroll to more animals"
                className="grid h-12 w-12 place-items-center rounded-full border border-forest/20 text-forest transition-colors hover:bg-mist"
              >
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </Reveal>
      </div>

      <div className="container-page mt-10">
        <ul
          ref={trackRef}
          className="-mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 [scrollbar-width:none] sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12 [&::-webkit-scrollbar]:hidden"
        >
          {animals.map((animal, i) => (
            <li
              key={animal.slug}
              className="w-[280px] shrink-0 snap-start sm:w-[300px]"
            >
              <Reveal delay={Math.min(i * 0.07, 0.35)} className="h-full">
                <AnimalCard animal={animal} tilt />
              </Reveal>
            </li>
          ))}
        </ul>
        <div className="mt-8 text-center">
          <ButtonLink href="/adopt" variant="outline" size="lg">
            See everyone
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
