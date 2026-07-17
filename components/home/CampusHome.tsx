import { Reveal } from "@/components/motion/Reveal";
import { AnimalPortrait } from "@/components/animals/Portrait";
import type { Animal } from "@/types";
import type { ContentSectionRow } from "@/services/content";

/** “Our Campus. Their Home.” — large editorial statement. */
export function CampusHome({ animals, cms }: { animals: Animal[], cms?: ContentSectionRow }) {
  const [a, b] = animals;
  return (
    <section className="bg-forest py-20 text-cream sm:py-28" aria-labelledby="campushome-h">
      <div className="container-page grid items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
        <Reveal>
          <div>
            <p className="eyebrow mb-4 text-sand">{cms?.subtitle}</p>
            <h2
              id="campushome-h"
              className="text-balance font-display text-4xl font-bold leading-[1.08] sm:text-5xl"
            >
              {cms?.title}
            </h2>
            <div className="mt-6 max-w-xl text-lg leading-relaxed text-cream/85 space-y-4 whitespace-pre-line">
              {cms?.body}
            </div>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 gap-4">
          {a && (
            <Reveal delay={0.1} className="mt-10">
              <figure>
                <AnimalPortrait animal={a} frame="arch" className="aspect-[3/4]" />
                <figcaption className="mt-2 text-center text-xs text-sand">
                  {a.name} · {a.tagline}
                </figcaption>
              </figure>
            </Reveal>
          )}
          {b && (
            <Reveal delay={0.22}>
              <figure>
                <AnimalPortrait animal={b} frame="arch" className="aspect-[3/4]" />
                <figcaption className="mt-2 text-center text-xs text-sand">
                  {b.name} · {b.tagline}
                </figcaption>
              </figure>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}
