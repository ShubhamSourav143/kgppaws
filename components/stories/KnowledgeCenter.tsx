"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Clock } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { formatDate, cn } from "@/lib/utils";
import { KNOWLEDGE_CATEGORIES, type Article } from "@/lib/stories/knowledge";
import type { Shot } from "@/components/stories/StorySections";

const ALL = "All";

/**
 * Knowledge Center — a magazine, not a blog grid. The newest piece in the
 * active category runs as a full-width featured spread; the rest follow as
 * supporting cards. Cards aren't links yet — none of these have a body page,
 * and a card that looks clickable but goes nowhere is worse than one that
 * doesn't. Add `href` to an article and it becomes a link with no other change.
 */
export function KnowledgeCenter({
  articles,
  covers,
}: {
  articles: Article[];
  covers: Record<string, Shot | undefined>;
}) {
  const reduced = useReducedMotion() ?? false;
  const [active, setActive] = useState<string>(ALL);

  const shown = useMemo(() => {
    const list =
      active === ALL ? articles : articles.filter((a) => a.category === active);
    return list
      .slice()
      .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
  }, [articles, active]);

  const [featured, ...supporting] = shown;
  const tabs = [ALL, ...KNOWLEDGE_CATEGORIES];

  return (
    <section
      id="knowledge"
      aria-labelledby="knowledge-h"
      className="scroll-mt-24 bg-cream py-20 sm:py-28"
    >
      <div className="container-page">
        <div className="max-w-2xl">
          <Reveal>
            <p className="eyebrow mb-4 text-saffron-deep">Knowledge Center</p>
            <h2
              id="knowledge-h"
              className="font-display text-3xl font-bold leading-tight text-forest-deep sm:text-4xl lg:text-5xl"
            >
              What we&apos;ve learned, written down properly.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-charcoal/70">
              Practical animal care for a campus — written for students who
              want to help and would rather not guess.
            </p>
          </Reveal>
        </div>

        {/* category filter */}
        <div
          className="mt-10 flex flex-wrap gap-2"
          role="tablist"
          aria-label="Article categories"
        >
          {tabs.map((cat) => {
            const on = cat === active;
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setActive(cat)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-bold transition-all duration-200",
                  on
                    ? "bg-forest text-cream shadow-soft"
                    : "border border-line bg-ivory text-forest hover:bg-mist"
                )}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {featured && (
              <FeaturedArticle article={featured} shot={covers[featured.photo]} />
            )}

            {supporting.length > 0 && (
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {supporting.map((a) => (
                  <ArticleCard key={a.slug} article={a} shot={covers[a.photo]} />
                ))}
              </div>
            )}

            {!shown.length && (
              <p className="mt-12 text-center text-moss">
                No articles in that category yet.
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

function Meta({ a, className }: { a: Article; className?: string }) {
  return (
    <p className={cn("flex items-center gap-3 text-xs", className)}>
      <span className="inline-flex items-center gap-1">
        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
        {a.readMinutes} min read
      </span>
      <span aria-hidden="true">·</span>
      <span>{formatDate(a.publishedAt)}</span>
    </p>
  );
}

function FeaturedArticle({ article: a, shot }: { article: Article; shot?: Shot }) {
  return (
    <article className="group mt-10 grid overflow-hidden rounded-[1.75rem] border border-line bg-ivory shadow-card transition-shadow duration-300 hover:shadow-glow lg:grid-cols-2">
      <div className="relative aspect-[16/10] overflow-hidden bg-sand-light lg:aspect-auto">
        {shot && (
          <Image
            src={shot.src}
            alt={shot.alt}
            fill
            sizes="(min-width: 1024px) 46vw, 92vw"
            placeholder={shot.blurDataURL ? "blur" : undefined}
            blurDataURL={shot.blurDataURL}
            className="object-contain transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
          />
        )}
        <span className="absolute left-4 top-4 rounded-full bg-marigold px-3 py-1 text-[11px] font-black uppercase tracking-wider text-night">
          {a.category}
        </span>
      </div>

      <div className="flex flex-col justify-center p-7 sm:p-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-saffron-deep">
          Featured
        </p>
        <h3 className="mt-3 text-balance font-display text-2xl font-bold leading-tight text-forest-deep sm:text-3xl lg:text-4xl">
          {a.title}
        </h3>
        <Meta a={a} className="mt-4 text-moss" />
        <p className="mt-4 text-base leading-relaxed text-charcoal/75">
          {a.summary}
        </p>
      </div>
    </article>
  );
}

function ArticleCard({ article: a, shot }: { article: Article; shot?: Shot }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-ivory shadow-card transition-shadow duration-300 hover:shadow-glow">
      <div className="relative aspect-[16/10] overflow-hidden bg-sand-light">
        {shot && (
          <Image
            src={shot.src}
            alt={shot.alt}
            fill
            sizes="(min-width: 1024px) 31vw, (min-width: 640px) 46vw, 92vw"
            placeholder={shot.blurDataURL ? "blur" : undefined}
            blurDataURL={shot.blurDataURL}
            className="object-contain transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-ivory/95 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-saffron-deep shadow-soft backdrop-blur-sm">
          {a.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <Meta a={a} className="text-moss" />
        <h3 className="mt-2.5 font-display text-xl font-bold leading-snug text-forest-deep">
          {a.title}
        </h3>
        <p className="mt-2.5 text-sm leading-relaxed text-charcoal/70">
          {a.summary}
        </p>
      </div>
    </article>
  );
}
