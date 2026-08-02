import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal, Stagger, Item } from "@/components/fx/Reveal";
import { TextReveal } from "@/components/fx/TextReveal";
import { CardMedia } from "@/components/home/CardMedia";
import type { SlidePhoto } from "@/components/our-work/OurWorkSlideshow";
import type { ShelterMember } from "@/lib/our-work/content";

/** Prefer a still photo for a card; fall back to a video only if that's all
 *  the member has. */
function coverOf(photos: SlidePhoto[]): SlidePhoto | undefined {
  return photos.find((p) => !p.src.endsWith(".mp4")) ?? photos[0];
}

/**
 * Homepage preview of the shelter family. Shows the dogs who live permanently
 * in our care (memoriam members are only shown, with respect, on /stories).
 * Data + photos come from the same resolver /stories uses, so a new member
 * appears here automatically.
 */
export function ShelterFamilyPreview({ members }: { members: ShelterMember[] }) {
  const living = members.filter((m) => !m.memoriam).slice(0, 4);
  if (living.length === 0) return null;

  return (
    <section
      aria-labelledby="shelter-h"
      className="overflow-hidden bg-cream py-24 sm:py-32"
    >
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <Reveal effect="fade">
              <p className="eyebrow mb-5 text-saffron-deep">The heart of our work</p>
            </Reveal>
            <TextReveal
              as="h2"
              text="Meet our shelter family."
              className="font-display text-3xl font-bold leading-[1.1] text-forest-deep sm:text-4xl lg:text-5xl"
            />
            <Reveal delay={0.15}>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-charcoal/75">
                A few dogs need more than a feeding round — so they live with us
                permanently, looked after every single day.
              </p>
            </Reveal>
          </div>
          <Reveal>
            <Link
              href="/stories"
              className="group inline-flex items-center gap-2 rounded-full border-2 border-forest px-6 py-3 text-sm font-bold text-forest transition-colors hover:bg-forest hover:text-ivory"
            >
              Meet the whole family
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </Reveal>
        </div>

        <Stagger
          className="mt-12 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4"
          gap={0.08}
        >
          {living.map((m) => (
              <Item key={m.slug} effect="rise" className="h-full">
                <article className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-ivory shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-glow">
                  <div className="relative aspect-[4/5] overflow-hidden bg-sand-light">
                    <CardMedia
                      photo={coverOf(m.photos)}
                      sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 48vw"
                      imgClassName="transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                    />
                    <span className="absolute left-3 top-3 rounded-full bg-forest-bright/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-ivory backdrop-blur">
                      {m.status}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-display text-xl font-bold text-forest-deep">
                      {m.name}
                    </h3>
                    <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-charcoal/70">
                      {m.intro}
                    </p>
                  </div>
                </article>
              </Item>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
