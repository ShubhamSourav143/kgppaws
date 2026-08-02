import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Reveal, Stagger, Item } from "@/components/fx/Reveal";
import { TextReveal } from "@/components/fx/TextReveal";
import { CardMedia } from "@/components/home/CardMedia";
import type { SlidePhoto } from "@/components/our-work/OurWorkSlideshow";
import type { WorkSectionWithPhotos } from "@/lib/our-work/photos";

/** Prefer a still photo for a card; fall back to a video only if that's all
 *  the section has. */
function coverOf(photos: SlidePhoto[]): SlidePhoto | undefined {
  return photos.find((p) => !p.src.endsWith(".mp4")) ?? photos[0];
}

/**
 * Homepage preview of the standing programmes. Each card deep-links to the
 * matching section on /stories (WorkSection renders id={s.id}). Driven by
 * WORK_SECTIONS, so a new programme appears here automatically.
 */
export function OurWorkPreview({ sections }: { sections: WorkSectionWithPhotos[] }) {
  const items = sections.slice(0, 6);
  if (items.length === 0) return null;

  return (
    <section
      aria-labelledby="ourwork-h"
      className="relative overflow-hidden bg-forest-deep py-24 text-ivory sm:py-32"
    >
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <Reveal effect="fade">
              <p className="eyebrow mb-5 text-marigold">What we do</p>
            </Reveal>
            <TextReveal
              as="h2"
              text="Care that runs all year round."
              className="font-display text-4xl font-bold leading-[1.05] sm:text-5xl"
            />
            <Reveal delay={0.15}>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-ivory/70">
                Feeding, rescue, sterilization, vaccination and daily medical
                care — this is what a year of KGP PAWS looks like on the ground.
              </p>
            </Reveal>
          </div>
          <Reveal>
            <Link
              href="/stories"
              className="group inline-flex items-center gap-2 rounded-full border border-ivory/25 px-6 py-3 text-sm font-bold text-ivory transition-colors hover:bg-ivory/10"
            >
              See all our work
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </Reveal>
        </div>

        <Stagger
          className="mt-12 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3"
          gap={0.07}
        >
          {items.map((s) => (
              <Item key={s.id} effect="rise" className="h-full">
                <Link
                  href={`/stories#${s.id}`}
                  className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-ivory shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-glow"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-sand-light">
                    <CardMedia
                      photo={coverOf(s.photos)}
                      sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
                      imgClassName="transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="eyebrow mb-2 text-saffron-deep">{s.eyebrow}</p>
                    <h3 className="flex items-start justify-between gap-2 font-display text-xl font-bold text-forest-deep">
                      {s.title}
                      <ArrowUpRight
                        className="h-4 w-4 shrink-0 translate-y-1 text-saffron-deep opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
                        aria-hidden="true"
                      />
                    </h3>
                    <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-charcoal/70">
                      {s.intro}
                    </p>
                  </div>
                </Link>
              </Item>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
