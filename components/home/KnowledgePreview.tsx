import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Reveal, Stagger, Item } from "@/components/fx/Reveal";
import { TextReveal } from "@/components/fx/TextReveal";
import { CardMedia } from "@/components/home/CardMedia";
import type { KnowledgeArticle } from "@/lib/our-work/content";

/**
 * Homepage preview of the Knowledge Centre. Individual guides have no page of
 * their own, so cards link to the Knowledge Centre section on /stories. Driven
 * by KNOWLEDGE_ARTICLES, so a new guide appears here automatically.
 */
const KNOWLEDGE_HREF = "/stories#knowledge-centre";

export function KnowledgePreview({ articles }: { articles: KnowledgeArticle[] }) {
  const items = articles.slice(0, 3);
  if (items.length === 0) return null;

  return (
    <section
      aria-labelledby="knowledge-h"
      className="overflow-hidden bg-cream py-24 sm:py-32"
    >
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <Reveal effect="fade">
              <p className="eyebrow mb-5 text-saffron-deep">Knowledge Centre</p>
            </Reveal>
            <TextReveal
              as="h2"
              text="Practical guides for anyone helping campus animals."
              className="text-balance font-display text-3xl font-bold leading-[1.1] text-forest-deep sm:text-4xl lg:text-5xl"
            />
            <Reveal delay={0.15}>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-charcoal/75">
                Short, plain-language reads on first aid, vaccination,
                sterilization and living well alongside campus dogs.
              </p>
            </Reveal>
          </div>
          <Reveal>
            <Link
              href={KNOWLEDGE_HREF}
              className="group inline-flex items-center gap-2 rounded-full border-2 border-forest px-6 py-3 text-sm font-bold text-forest transition-colors hover:bg-forest hover:text-ivory"
            >
              Read the guides
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </Reveal>
        </div>

        <Stagger className="mt-12 grid gap-5 md:grid-cols-3" gap={0.09}>
          {items.map((a) => (
            <Item key={a.slug} effect="rise" className="h-full">
              <Link
                href={KNOWLEDGE_HREF}
                className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-ivory shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-glow"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-sand-light">
                  <CardMedia
                    photo={a.photo}
                    sizes="(min-width: 768px) 30vw, 92vw"
                    imgClassName="transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-night/65 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-ivory backdrop-blur-sm">
                    {a.category}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-display text-lg font-bold leading-snug text-forest-deep">
                    {a.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-charcoal/70">
                    {a.summary}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-saffron-deep transition-colors group-hover:text-saffron">
                    Read more
                    <ArrowUpRight
                      className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      aria-hidden="true"
                    />
                  </span>
                </div>
              </Link>
            </Item>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
