"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  ArrowUpRight,
  BookOpen,
  Clock,
  HeartHandshake,
  PawPrint,
  Play,
} from "lucide-react";
import { BeforeAfter } from "@/components/fx/BeforeAfter";
import { Reveal } from "@/components/motion/Reveal";
import { Magnetic } from "@/components/fx/Magnetic";
import { formatDate, cn } from "@/lib/utils";
import type { Initiative } from "@/lib/stories/our-work";
import type { Story } from "@/types";

export interface Shot {
  src: string;
  alt: string;
  blurDataURL?: string;
}

/* ————————————————————————— 1 · Hero ————————————————————————— */

/**
 * Cinematic opener — a single held photograph under a slow push, with the
 * headline arriving line by line. Deliberately quieter than the donate hero:
 * this page is a documentary, so it opens on one image rather than a collage.
 */
export function StoriesHero({ shot }: { shot?: Shot }) {
  const reduced = useReducedMotion() ?? false;

  return (
    <header className="relative -mt-16 flex min-h-[100svh] items-end overflow-hidden bg-night text-ivory md:-mt-20">
      {shot && (
        <div className="absolute inset-0" aria-hidden="true">
          <Image
            src={shot.src}
            alt=""
            fill
            // Next 16 deprecated `priority` in favour of `preload`
            preload
            sizes="100vw"
            placeholder={shot.blurDataURL ? "blur" : undefined}
            blurDataURL={shot.blurDataURL}
            className="anim-kenburns object-cover"
          />
          {/* two scrims: one for the whole frame, one anchoring the text */}
          <div className="absolute inset-0 bg-night/45" />
          <div className="absolute inset-0 bg-gradient-to-t from-night via-night/70 to-transparent" />
        </div>
      )}

      <div className="container-page relative z-10 pb-24 pt-40 sm:pb-32">
        <div className="max-w-4xl">
          <Reveal>
            <p className="eyebrow mb-6 inline-flex items-center gap-2 text-marigold">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              Stories from the campus
            </p>
          </Reveal>

          <h1 className="text-balance font-display text-[2.7rem] font-bold leading-[1.02] sm:text-6xl lg:text-7xl">
            {["Every Life Has", "A Story Worth Telling."].map((line, i) => (
              <motion.span
                key={line}
                className="block"
                initial={reduced ? false : { opacity: 0, y: 34 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.95,
                  delay: 0.15 + i * 0.14,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {line}
              </motion.span>
            ))}
          </h1>

          <Reveal delay={0.5}>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-ivory/75">
              Behind every wagging tail is a journey of survival, hope, and
              love.
            </p>
          </Reveal>

          <Reveal delay={0.65} className="mt-10 flex flex-wrap items-center gap-4">
            <Magnetic strength={0.22}>
              <Link
                href="#rescue-stories"
                className="group inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-saffron-deep via-saffron to-marigold px-8 py-4 text-base font-bold text-ivory shadow-ember transition-all hover:brightness-105 active:scale-95"
              >
                <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                Start watching
              </Link>
            </Magnetic>
            <Link
              href="#knowledge"
              className="glass-dark inline-flex items-center gap-2 rounded-full px-7 py-4 text-base font-semibold text-ivory transition-colors hover:bg-ivory/15"
            >
              Knowledge Center
              <ArrowDown className="h-5 w-5 text-chakra-glow" aria-hidden="true" />
            </Link>
          </Reveal>
        </div>
      </div>
    </header>
  );
}

/* ——————————————————— 2 · Featured rescue stories ——————————————————— */

/**
 * Editorial story cards, sized like a streaming service's hero row: the first
 * story runs full width, the rest fall into a two-up grid beneath it.
 */
export function FeaturedStories({
  stories,
  covers,
}: {
  stories: Story[];
  covers: Record<string, Shot | undefined>;
}) {
  if (!stories.length) return null;
  const [lead, ...rest] = stories;

  return (
    <section
      id="rescue-stories"
      aria-labelledby="rescue-h"
      className="scroll-mt-24 bg-cream py-20 sm:py-28"
    >
      <div className="container-page">
        <div className="max-w-2xl">
          <Reveal>
            <p className="eyebrow mb-4 text-saffron-deep">Rescue stories</p>
            <h2
              id="rescue-h"
              className="font-display text-3xl font-bold leading-tight text-forest-deep sm:text-4xl lg:text-5xl"
            >
              The ones who made it, and how.
            </h2>
          </Reveal>
        </div>

        <div className="mt-12 space-y-6 sm:mt-16">
          <Reveal>
            <StoryTile story={lead} shot={covers[lead.slug]} size="lead" />
          </Reveal>

          {rest.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2">
              {rest.map((s, i) => (
                <Reveal key={s.slug} delay={Math.min(i * 0.07, 0.28)}>
                  <StoryTile story={s} shot={covers[s.slug]} size="normal" />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function StoryTile({
  story,
  shot,
  size,
}: {
  story: Story;
  shot?: Shot;
  size: "lead" | "normal";
}) {
  const lead = size === "lead";
  return (
    <Link
      href={`/stories/${story.slug}`}
      className={cn(
        "group relative block overflow-hidden rounded-[1.75rem] bg-night shadow-card transition-all duration-500 hover:-translate-y-1.5 hover:shadow-glow",
        lead ? "aspect-[4/5] sm:aspect-[21/9]" : "aspect-[4/3]"
      )}
    >
      {shot ? (
        <Image
          src={shot.src}
          alt={shot.alt}
          fill
          sizes={lead ? "(min-width: 640px) 92vw, 92vw" : "(min-width: 640px) 46vw, 92vw"}
          placeholder={shot.blurDataURL ? "blur" : undefined}
          blurDataURL={shot.blurDataURL}
          className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.06]"
        />
      ) : (
        <div
          aria-hidden="true"
          className="h-full w-full"
          style={{
            background: `linear-gradient(150deg, ${story.heroPalette[0]}, ${story.heroPalette[1]})`,
          }}
        />
      )}

      {/* readability gradient, deepened on hover */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-night via-night/55 to-transparent transition-opacity duration-500 group-hover:from-night group-hover:via-night/70"
      />

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 p-6 sm:p-8",
          lead && "sm:max-w-2xl lg:p-10"
        )}
      >
        <span className="inline-flex items-center gap-1.5 rounded-full bg-ivory/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-ivory backdrop-blur-sm">
          <PawPrint className="h-3 w-3" aria-hidden="true" />
          {story.category.replace("-", " ")}
        </span>

        <h3
          className={cn(
            "mt-3 text-balance font-display font-bold leading-tight text-ivory",
            lead ? "text-2xl sm:text-4xl lg:text-[2.6rem]" : "text-xl sm:text-2xl"
          )}
        >
          {story.title}
        </h3>

        <p
          className={cn(
            "mt-2.5 max-w-xl leading-relaxed text-ivory/75",
            lead ? "text-sm sm:text-base" : "text-sm"
          )}
        >
          {story.excerpt}
        </p>

        <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-ivory px-5 py-2.5 text-sm font-bold text-forest-deep transition-all duration-300 group-hover:bg-marigold group-hover:text-night">
          Read story
          <ArrowUpRight
            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  );
}

/* ————————————————————————— 3 · Our work ————————————————————————— */

export function OurWork({
  initiatives,
  covers,
}: {
  initiatives: Initiative[];
  covers: Record<string, Shot | undefined>;
}) {
  return (
    <section
      id="our-work"
      aria-labelledby="work-h"
      className="scroll-mt-24 bg-parchment py-20 sm:py-28"
    >
      <div className="container-page">
        <div className="max-w-2xl">
          <Reveal>
            <p className="eyebrow mb-4 text-saffron-deep">Our work</p>
            <h2
              id="work-h"
              className="font-display text-3xl font-bold leading-tight text-forest-deep sm:text-4xl lg:text-5xl"
            >
              Six things we do, every week, without fail.
            </h2>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {initiatives.map((it, i) => {
            const shot = covers[it.photo];
            return (
              <Reveal key={it.slug} delay={Math.min(i * 0.06, 0.3)}>
                <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-ivory shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-glow">
                  <div className="relative aspect-[16/10] overflow-hidden bg-sand-light">
                    {shot && (
                      <Image
                        src={shot.src}
                        alt={shot.alt}
                        fill
                        sizes="(min-width: 1024px) 31vw, (min-width: 768px) 46vw, 92vw"
                        placeholder={shot.blurDataURL ? "blur" : undefined}
                        blurDataURL={shot.blurDataURL}
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.07]"
                      />
                    )}
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-night/60 to-transparent"
                    />
                    {it.stat && (
                      <div className="absolute bottom-3 left-4 text-ivory">
                        <p className="font-display text-2xl font-bold leading-none">
                          {it.stat.value}
                        </p>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-ivory/80">
                          {it.stat.label}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-display text-xl font-bold text-forest-deep">
                      {it.title}
                    </h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-charcoal/70">
                      {it.summary}
                    </p>

                    <div className="mt-4 rounded-2xl bg-mist/60 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-forest-bright">
                        Why it matters
                      </p>
                      <p className="mt-1.5 text-sm leading-relaxed text-charcoal/75">
                        {it.why}
                      </p>
                    </div>

                    <Link
                      href={it.href}
                      className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-bold text-saffron-deep transition-colors hover:text-saffron"
                    >
                      Learn more
                      <ArrowUpRight
                        className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        aria-hidden="true"
                      />
                    </Link>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ————————————————————— 5 · Before & after ————————————————————— */

export function BeforeAfterSection({ pairs }: { pairs: { before: Shot; after: Shot; name: string; note: string }[] }) {
  if (!pairs.length) return null;

  return (
    <section
      aria-labelledby="ba-h"
      className="bg-night py-20 text-ivory sm:py-28"
    >
      <div className="container-page">
        <div className="max-w-2xl">
          <Reveal>
            <p className="eyebrow mb-4 text-marigold">Before &amp; after</p>
            <h2
              id="ba-h"
              className="font-display text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl"
            >
              Drag the handle. Watch the months go by.
            </h2>
            <p className="mt-5 max-w-xl leading-relaxed text-ivory/70">
              Weeks of treatment compressed into one frame — pull the slider
              across to see where each of them started.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-2">
          {pairs.map((p, i) => (
            <Reveal key={p.name} delay={Math.min(i * 0.08, 0.3)}>
              <figure>
                <BeforeAfter
                  before={p.before.src}
                  after={p.after.src}
                  alt={`${p.name} before and after treatment`}
                  className="overflow-hidden rounded-3xl shadow-lift"
                />
                <figcaption className="mt-4">
                  <p className="font-display text-xl font-bold">{p.name}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ivory/65">
                    {p.note}
                  </p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ————————————————————— 6 · Happy endings ————————————————————— */

/** Masonry via CSS columns — images keep their own aspect ratios. */
export function HappyEndings({ shots }: { shots: Shot[] }) {
  if (!shots.length) return null;

  return (
    <section
      aria-labelledby="happy-h"
      className="bg-cream py-20 sm:py-28"
    >
      <div className="container-page">
        <div className="max-w-2xl">
          <Reveal>
            <p className="eyebrow mb-4 text-saffron-deep">Happy endings</p>
            <h2
              id="happy-h"
              className="font-display text-3xl font-bold leading-tight text-forest-deep sm:text-4xl lg:text-5xl"
            >
              Every one of them was once a report on someone&apos;s phone.
            </h2>
          </Reveal>
        </div>

        <div className="mt-14 [column-fill:_balance] columns-2 gap-4 sm:gap-5 lg:columns-3">
          {shots.map((s, i) => (
            <motion.figure
              key={s.src + i}
              className="mb-4 break-inside-avoid overflow-hidden rounded-2xl bg-sand-light shadow-card sm:mb-5"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                duration: 0.65,
                delay: Math.min((i % 6) * 0.05, 0.25),
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <Image
                src={s.src}
                alt={s.alt}
                width={600}
                // vary the crop so the columns interlock instead of forming rows
                height={i % 3 === 0 ? 800 : i % 3 === 1 ? 600 : 700}
                sizes="(min-width: 1024px) 31vw, 46vw"
                placeholder={s.blurDataURL ? "blur" : undefined}
                blurDataURL={s.blurDataURL}
                className="h-auto w-full object-cover transition-transform duration-700 ease-out hover:scale-[1.05]"
              />
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ————————————————————————— 7 · Final CTA ————————————————————————— */

export function StoriesFinalCta({ shot }: { shot?: Shot }) {
  const reduced = useReducedMotion() ?? false;

  return (
    <section
      aria-labelledby="stories-cta-h"
      className="relative overflow-hidden bg-night py-28 text-ivory sm:py-36"
    >
      {shot && (
        <div className="absolute inset-0" aria-hidden="true">
          <Image
            src={shot.src}
            alt=""
            fill
            sizes="100vw"
            placeholder={shot.blurDataURL ? "blur" : undefined}
            blurDataURL={shot.blurDataURL}
            className="anim-kenburns object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-night/88 via-night/78 to-night/92" />
        </div>
      )}

      <div className="container-page relative z-10 text-center">
        <Reveal>
          <PawPrint className="mx-auto h-10 w-10 text-marigold" aria-hidden="true" />
        </Reveal>
        <motion.h2
          id="stories-cta-h"
          className="mx-auto mt-7 max-w-3xl text-balance font-display text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-6xl"
          initial={reduced ? false : { opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          Help Write The Next Success Story.
        </motion.h2>
        <Reveal delay={0.25}>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ivory/70">
            Every story on this page began with somebody deciding not to walk
            past. That is the entire qualification.
          </p>
        </Reveal>
        <Reveal delay={0.4} className="mt-10 flex flex-wrap justify-center gap-4">
          <Magnetic strength={0.25}>
            <Link
              href="/donate"
              className="group inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-saffron-deep via-saffron to-marigold px-9 py-4 text-lg font-bold text-ivory shadow-ember transition-all hover:brightness-105 active:scale-95"
            >
              <HeartHandshake className="h-5 w-5" aria-hidden="true" />
              Donate
            </Link>
          </Magnetic>
          <Link
            href="/volunteer"
            className="glass-dark inline-flex items-center gap-2 rounded-full px-8 py-4 text-lg font-semibold text-ivory transition-colors hover:bg-ivory/15"
          >
            Volunteer
            <ArrowUpRight className="h-5 w-5 text-chakra-glow" aria-hidden="true" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* ——— shared bits ——— */

export function ReadMeta({
  minutes,
  date,
  className,
}: {
  minutes: number;
  date: string;
  className?: string;
}) {
  return (
    <p className={cn("flex items-center gap-3 text-xs text-moss", className)}>
      <span className="inline-flex items-center gap-1">
        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
        {minutes} min read
      </span>
      <span aria-hidden="true">·</span>
      <span>{formatDate(date)}</span>
    </p>
  );
}
