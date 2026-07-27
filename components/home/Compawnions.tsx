import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { AnimalPortrait } from "@/components/animals/Portrait";
import { Reveal, Stagger, Item } from "@/components/fx/Reveal";
import { TextReveal } from "@/components/fx/TextReveal";
import type { Animal } from "@/types";

const TILTS = ["-rotate-3", "rotate-2", "-rotate-1", "rotate-3", "-rotate-2", "rotate-1"];
const TAPES = ["bg-gold-soft/80", "bg-sage/60", "bg-clay", "bg-gold-soft/80", "bg-sage/60", "bg-clay"];

/** Campus Com-Paw-Nions — a scrapbook wall of the residents everyone knows. */
export function Compawnions({ animals }: { animals: Animal[] }) {
  // Only the animals who genuinely aren't up for adoption — this section is
  // about the residents who already own the campus. Topping the row up with
  // adoptable animals repeated the cards from Featured Rescues above.
  const residents = animals
    .filter((a) => a.adoption === "not_available")
    .slice(0, 6);
  if (residents.length === 0) return null;

  return (
    <section aria-labelledby="compaw-h" className="paper overflow-hidden py-24 sm:py-32">
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <Reveal effect="fade">
              <p className="eyebrow mb-5 text-chakra">Campus Com-Paw-Nions</p>
            </Reveal>
            <TextReveal
              as="h2"
              text="The seniors, the guards, the biscuit inspectors."
              className="text-balance font-display text-3xl font-bold leading-[1.1] text-forest-deep sm:text-4xl lg:text-5xl"
            />
            <Reveal delay={0.15}>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-charcoal/75">
                Not every paw is looking for a home — some already own the whole
                campus. These are the residents every batch inherits and every
                batch falls in love with.
              </p>
            </Reveal>
          </div>
          <Reveal>
            <Link
              href="/map"
              className="group inline-flex items-center gap-2 rounded-full border-2 border-chakra px-6 py-3 text-sm font-bold text-chakra transition-colors hover:bg-chakra hover:text-ivory"
            >
              <MapPin className="h-4 w-4" aria-hidden="true" />
              Find them on the campus map
            </Link>
          </Reveal>
        </div>

        <Stagger className="mt-14 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:gap-x-8" gap={0.08}>
          {residents.map((animal, i) => (
            <Item key={animal.id} effect="scale">
              <Link
                href={`/animal/${animal.slug}`}
                className={`group relative block bg-ivory p-2.5 pb-10 shadow-card transition-all duration-300 hover:z-10 hover:scale-[1.04] hover:shadow-lift sm:p-3 sm:pb-12 ${TILTS[i % TILTS.length]}`}
              >
                <span
                  aria-hidden="true"
                  className={`absolute -top-2.5 left-1/2 z-10 h-5 w-16 -translate-x-1/2 rounded-sm ${TAPES[i % TAPES.length]} shadow-sm`}
                  style={{ rotate: `${((i * 7) % 10) - 5}deg` }}
                />
                <AnimalPortrait
                  animal={animal}
                  photoUrl={animal.photos.find((p) => p.url)?.url}
                  className="aspect-square w-full overflow-hidden"
                />
                <div className="absolute inset-x-0 bottom-2 px-3 text-center sm:bottom-3">
                  <p className="truncate font-display text-base italic leading-tight text-charcoal/80 sm:text-lg">
                    {animal.name}
                    <span className="not-italic text-xs text-moss"> · {animal.zoneId.replace(/-/g, " ")}</span>
                  </p>
                </div>
                <ArrowUpRight
                  className="absolute right-3 top-3 h-4 w-4 text-forest opacity-0 transition-opacity group-hover:opacity-60"
                  aria-hidden="true"
                />
              </Link>
            </Item>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
