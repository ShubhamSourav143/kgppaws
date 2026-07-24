import Image from "next/image";
import { HeartCrack, Ban, HeartHandshake, type LucideIcon } from "lucide-react";
import { Reveal, Stagger, Item } from "@/components/fx/Reveal";
import { TextReveal } from "@/components/fx/TextReveal";
import { cn } from "@/lib/utils";

/** A resolved photo (built server-side from the media manifest: src + blur). */
export interface WhyPhoto {
  src: string;
  blurDataURL?: string;
  width?: number;
  height?: number;
  alt?: string;
}

/** Keyed by filename stem — adopt/*.jpg and hero-grid/grid-NN.jpg. */
export type WhyPhotos = Record<string, WhyPhoto>;

interface Shot {
  key: string;
  alt: string;
}

interface Band {
  n: string;
  icon: LucideIcon;
  title: string;
  body: string;
  shots: [Shot, Shot, Shot, Shot];
}

/**
 * "Why Adoption Matters" — three titled bands, each a short message followed
 * by a row of four photographs. Photos are keyed by filename stem and resolved
 * to real files (with blur placeholders) by the Adopt page; a missing key
 * degrades to a soft gradient tile so the grid never breaks.
 */
const BANDS: Band[] = [
  {
    n: "01",
    icon: HeartCrack,
    title: "Thousands abandoned every year",
    body: "Countless healthy dogs and cats are left behind each year — not because anything is wrong with them, but because homes ran out before love did. Born on the roadside, many never survive their first months.",
    shots: [
      { key: "romi", alt: "A rescued dog waiting quietly for a home" },
      { key: "grid-15", alt: "A street puppy with a soulful gaze" },
      { key: "grid-05", alt: "A street cat looking up from the roadside" },
      { key: "grid-12", alt: "A young dog with a wistful expression" },
    ],
  },
  {
    n: "02",
    icon: Ban,
    title: "Bred for profit, then discarded",
    body: "Some animals are bred purely to sell and abandoned the moment they stop being profitable. Rescued and treated by our volunteers, they slowly learn that a raised hand can also mean a gentle one.",
    shots: [
      { key: "odin", alt: "A small-breed dog once bred for sale" },
      { key: "grid-08", alt: "A tiny-breed dog resting after rescue" },
      { key: "grid-06", alt: "A rescued dog settling into a safe home" },
      { key: "grid-03", alt: "A hound recovering in comfort" },
    ],
  },
  {
    n: "03",
    icon: HeartHandshake,
    title: "Adoption saves a life",
    body: "Choosing to adopt frees up care for the next rescue and eases the cycle of unnecessary breeding. One choice, two lives changed — theirs, and yours.",
    shots: [
      { key: "simba", alt: "A healthy, happy adopted dog" },
      { key: "grid-09", alt: "A joyful golden retriever in a loving home" },
      { key: "bunti", alt: "A rescued husky thriving after adoption" },
      { key: "grid-02", alt: "A rescued cat safe and warm indoors" },
    ],
  },
];

function Photo({ shot, photos }: { shot: Shot; photos: WhyPhotos }) {
  const photo = photos[shot.key];
  return (
    <figure className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-sand-light shadow-soft ring-1 ring-line/60">
      {photo ? (
        <Image
          src={photo.src}
          alt={photo.alt ?? shot.alt}
          fill
          // one of four across on desktop, two across on smaller screens
          sizes="(min-width: 1024px) 22vw, (min-width: 640px) 23vw, 45vw"
          placeholder={photo.blurDataURL ? "blur" : undefined}
          blurDataURL={photo.blurDataURL}
          className="object-cover transition-transform duration-700 ease-out hover:scale-[1.05]"
        />
      ) : (
        <div
          aria-hidden="true"
          className="h-full w-full bg-gradient-to-br from-sand via-sand-light to-mist"
        />
      )}
    </figure>
  );
}

export function WhyAdopt({ photos = {} }: { photos?: WhyPhotos }) {
  return (
    <section aria-labelledby="why-h" className="bg-cream py-20 sm:py-28">
      <div className="container-page">
        <div className="max-w-2xl">
          <Reveal effect="fade">
            <p className="eyebrow mb-4 text-saffron-deep">Why it matters</p>
          </Reveal>
          <TextReveal
            as="h2"
            text="Why Adoption Matters"
            className="font-display text-3xl font-bold leading-tight text-forest-deep sm:text-4xl lg:text-5xl"
          />
        </div>

        <div className="mt-14 space-y-16 sm:mt-16 sm:space-y-20">
          {BANDS.map((band) => {
            const Icon = band.icon;
            return (
              <Reveal key={band.n} effect="rise">
                <article aria-label={band.title}>
                  {/* — title / description — */}
                  <div className="flex max-w-3xl items-start gap-4 sm:gap-5">
                    <span className="mt-0.5 grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-saffron/12 text-saffron-deep">
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="font-display text-sm font-bold text-moss">
                        {band.n}
                        <span className="text-charcoal/30"> / 03</span>
                      </p>
                      <h3 className="mt-1 font-display text-2xl font-bold leading-snug text-forest-deep sm:text-3xl">
                        {band.title}
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-charcoal/70 sm:text-base">
                        {band.body}
                      </p>
                    </div>
                  </div>

                  {/* — row of four fitted photos — */}
                  <Stagger
                    className={cn(
                      "mt-7 grid grid-cols-2 gap-4 sm:mt-8 sm:grid-cols-4 sm:gap-5"
                    )}
                  >
                    {band.shots.map((shot) => (
                      <Item key={shot.key}>
                        <Photo shot={shot} photos={photos} />
                      </Item>
                    ))}
                  </Stagger>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
