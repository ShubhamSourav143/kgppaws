import { Reveal } from "@/components/motion/Reveal";
import { AnimalPortrait } from "@/components/animals/Portrait";
import type { Animal } from "@/types";

/** “Our Campus. Their Home.” — large editorial statement. */
export function CampusHome({ animals }: { animals: Animal[] }) {
  const [a, b] = animals;
  return (
    <section className="bg-forest py-20 text-cream sm:py-28" aria-labelledby="campushome-h">
      <div className="container-page grid items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
        <Reveal>
          <div>
            <p className="eyebrow mb-4 text-sand">Our Campus. Their Home.</p>
            <h2
              id="campushome-h"
              className="text-balance font-display text-4xl font-bold leading-[1.08] sm:text-5xl"
            >
              Before it was ours, it was theirs too.
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-cream/85">
              The animals of IIT Kharagpur share this campus with students,
              faculty, staff and visitors — the same lanes, the same monsoons,
              the same 2&nbsp;AM chai runs. They are not strays passing
              through. They are residents.
            </p>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-cream/85">
              KGP PAWS exists so that sharing a home means sharing its care:
              food that arrives on time, treatment that arrives faster, and a
              name — a real, recorded identity — for every paw on campus.
            </p>
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
