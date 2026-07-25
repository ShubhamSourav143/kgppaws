"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  ArrowDown,
  ArrowUpRight,
  BookOpen,
  HeartHandshake,
  PawPrint,
  Play,
} from "lucide-react";
import { BeforeAfter } from "@/components/fx/BeforeAfter";
import { Counter } from "@/components/fx/Counter";
import { Reveal } from "@/components/motion/Reveal";
import { Magnetic } from "@/components/fx/Magnetic";
import { cn } from "@/lib/utils";
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
            preload
            sizes="100vw"
            placeholder={shot.blurDataURL ? "blur" : undefined}
            blurDataURL={shot.blurDataURL}
            className="anim-kenburns object-cover"
          />
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
 * Editorial layout — one cinematic featured story that fills the width, then
 * the rest as image-dominant supporting cards. The featured photo drifts on a
 * slow scroll parallax; every card lifts and zooms its image on hover.
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

        <div className="mt-12 sm:mt-16">
          <FeaturedLead story={lead} shot={covers[lead.slug]} />

          {rest.length > 0 && (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((s, i) => (
                <Reveal key={s.slug} delay={Math.min(i * 0.07, 0.28)}>
                  <SupportingCard story={s} shot={covers[s.slug]} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function FeaturedLead({ story, shot }: { story: Story; shot?: Shot }) {
  const reduced = useReducedMotion() ?? false;
  const ref = useRef<HTMLAnchorElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);

  return (
    <Link
      ref={ref}
      href={`/stories/${story.slug}`}
      className="group relative block overflow-hidden rounded-[2rem] bg-night shadow-card transition-shadow duration-500 hover:shadow-glow"
    >
      <div className="relative aspect-[4/5] sm:aspect-[21/9]">
        {shot ? (
          <motion.div
            className="absolute inset-[-6%]"
            style={reduced ? undefined : { y }}
            aria-hidden="true"
          >
            <Image
              src={shot.src}
              alt={shot.alt}
              fill
              sizes="92vw"
              placeholder={shot.blurDataURL ? "blur" : undefined}
              blurDataURL={shot.blurDataURL}
              className="object-cover transition-transform duration-[1.3s] ease-out group-hover:scale-[1.05]"
            />
          </motion.div>
        ) : (
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background: `linear-gradient(150deg, ${story.heroPalette[0]}, ${story.heroPalette[1]})`,
            }}
          />
        )}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-night via-night/55 to-transparent"
        />
      </div>

      <div className="absolute inset-x-0 bottom-0 p-6 sm:max-w-2xl sm:p-10 lg:p-12">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-marigold px-3 py-1 text-[11px] font-black uppercase tracking-wider text-night">
          <PawPrint className="h-3 w-3" aria-hidden="true" />
          Featured story
        </span>
        <h3 className="mt-4 text-balance font-display text-2xl font-bold leading-[1.08] text-ivory sm:text-4xl lg:text-5xl">
          {story.title}
        </h3>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-ivory/75 sm:text-base">
          {story.excerpt}
        </p>
        <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-ivory px-6 py-3 text-sm font-bold text-forest-deep transition-all duration-300 group-hover:bg-marigold group-hover:text-night">
          Read the story
          <ArrowUpRight
            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  );
}

function SupportingCard({ story, shot }: { story: Story; shot?: Shot }) {
  return (
    <Link
      href={`/stories/${story.slug}`}
      className="group relative block aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-night shadow-card transition-all duration-500 hover:-translate-y-1.5 hover:shadow-glow"
    >
      {shot ? (
        <Image
          src={shot.src}
          alt={shot.alt}
          fill
          sizes="(min-width: 1024px) 31vw, (min-width: 640px) 46vw, 92vw"
          placeholder={shot.blurDataURL ? "blur" : undefined}
          blurDataURL={shot.blurDataURL}
          className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.07]"
        />
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background: `linear-gradient(150deg, ${story.heroPalette[0]}, ${story.heroPalette[1]})`,
          }}
        />
      )}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-night via-night/45 to-transparent transition-opacity duration-500 group-hover:from-night group-hover:via-night/60"
      />

      <div className="absolute inset-x-0 bottom-0 p-6">
        <span className="text-[11px] font-bold uppercase tracking-wider text-marigold">
          {story.category.replace("-", " ")}
        </span>
        <h3 className="mt-2 text-balance font-display text-xl font-bold leading-snug text-ivory sm:text-2xl">
          {story.title}
        </h3>
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-ivory/90 transition-colors group-hover:text-marigold">
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

/** Split "350+" into a countable number and its trailing symbol. */
function splitStat(value: string): { num?: number; suffix: string } {
  const m = value.match(/^(\d+)(\+?)$/);
  if (m) return { num: Number(m[1]), suffix: m[2] };
  return { suffix: value };
}

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
      </div>

      <div className="mt-16 space-y-20 sm:mt-20 sm:space-y-28">
        {initiatives.map((it, i) => (
          <InitiativeRow
            key={it.slug}
            initiative={it}
            shot={covers[it.photo]}
            index={i}
          />
        ))}
      </div>
    </section>
  );
}

function InitiativeRow({
  initiative: it,
  shot,
  index,
}: {
  initiative: Initiative;
  shot?: Shot;
  index: number;
}) {
  const reduced = useReducedMotion() ?? false;
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-7%", "7%"]);
  const flip = index % 2 === 1;
  const stat = it.stat ? splitStat(it.stat.value) : undefined;

  return (
    <div ref={ref} className="container-page">
      <div
        className={cn(
          "grid items-center gap-8 lg:grid-cols-2 lg:gap-16",
          flip && "lg:[&>*:first-child]:order-2"
        )}
      >
        {/* image */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] bg-sand-light shadow-lift sm:aspect-[3/2]">
          {shot && (
            <motion.div
              className="absolute inset-[-7%]"
              style={reduced ? undefined : { y }}
              aria-hidden="true"
            >
              <Image
                src={shot.src}
                alt={shot.alt}
                fill
                sizes="(min-width: 1024px) 46vw, 92vw"
                placeholder={shot.blurDataURL ? "blur" : undefined}
                blurDataURL={shot.blurDataURL}
                className="object-cover"
              />
            </motion.div>
          )}
        </div>

        {/* copy */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 36 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="font-mono text-sm font-semibold text-saffron-deep">
            {String(index + 1).padStart(2, "0")}
          </p>
          <h3 className="mt-2 font-display text-3xl font-bold leading-tight text-forest-deep sm:text-4xl">
            {it.title}
          </h3>

          {it.stat && (
            <div className="mt-5 flex items-baseline gap-2">
              <span className="font-display text-4xl font-bold text-saffron-deep sm:text-5xl">
                {stat?.num !== undefined ? (
                  <Counter value={stat.num} suffix={stat.suffix} />
                ) : (
                  stat?.suffix
                )}
              </span>
              <span className="text-sm font-bold uppercase tracking-wider text-moss">
                {it.stat.label}
              </span>
            </div>
          )}

          <p className="mt-5 text-lg leading-relaxed text-charcoal/75">
            {it.summary}
          </p>

          <div className="mt-5 border-l-2 border-saffron/40 pl-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-forest-bright">
              Why it matters
            </p>
            <p className="mt-1.5 text-base leading-relaxed text-charcoal/75">
              {it.why}
            </p>
          </div>

          <Link
            href={it.href}
            className="group mt-7 inline-flex items-center gap-2 rounded-full border border-forest/20 px-6 py-3 text-sm font-bold text-forest transition-colors hover:bg-mist"
          >
            Learn more
            <ArrowUpRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden="true"
            />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

/* ————————————————————— 5 · Before & after ————————————————————— */

export function BeforeAfterSection({
  pairs,
}: {
  pairs: { before: Shot; after: Shot; name: string; note: string }[];
}) {
  if (!pairs.length) return null;

  return (
    <section aria-labelledby="ba-h" className="bg-night py-20 text-ivory sm:py-28">
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
      </div>

      {/* horizontal gallery: swipe / scroll through the comparisons */}
      <div className="mt-14 flex snap-x snap-mandatory gap-6 overflow-x-auto px-5 pb-4 [scrollbar-width:none] sm:px-8 lg:px-12 [&::-webkit-scrollbar]:hidden">
        {pairs.map((p, i) => (
          <motion.figure
            key={p.name + i}
            className="w-[85vw] shrink-0 snap-center sm:w-[32rem] lg:w-[38rem]"
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
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
          </motion.figure>
        ))}
        {/* trailing spacer so the last card can snap-center */}
        <div aria-hidden="true" className="w-1 shrink-0 sm:w-4" />
      </div>
    </section>
  );
}

/* ————————————————————— 6 · Happy endings ————————————————————— */

const ENDINGS = [
  { badge: "Recovered", caption: "Walking again after four months of physiotherapy." },
  { badge: "Adopted", caption: "First night indoors, and every night since." },
  { badge: "Recovered", caption: "Beat distemper against long odds. Fully grown now." },
  { badge: "In remission", caption: "Fourteen years old and back in the sun." },
  { badge: "Adopted", caption: "From the campus gate to a family of her own." },
  { badge: "Released", caption: "Sterilized, vaccinated, home on his own street." },
];

/** Premium social-post cards — image, a paw handle, a caption and an outcome. */
export function HappyEndings({ shots }: { shots: Shot[] }) {
  if (!shots.length) return null;
  const cards = ENDINGS.map((e, i) => ({ ...e, shot: shots[i % shots.length] }));

  return (
    <section aria-labelledby="happy-h" className="bg-cream py-20 sm:py-28">
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

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c, i) => (
            <Reveal key={c.caption} delay={Math.min(i * 0.06, 0.3)}>
              <article className="group flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-line bg-ivory shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-glow">
                {/* post header */}
                <div className="flex items-center gap-2.5 px-4 py-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-saffron-deep to-marigold text-ivory">
                    <PawPrint className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="leading-tight">
                    <p className="text-sm font-bold text-forest-deep">kgp.paws</p>
                    <p className="text-[11px] text-moss">IIT Kharagpur</p>
                  </div>
                  <span className="ml-auto rounded-full bg-forest-bright/12 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-forest-bright">
                    {c.badge}
                  </span>
                </div>

                {/* photo */}
                <div className="relative aspect-square overflow-hidden bg-sand-light">
                  {c.shot && (
                    <Image
                      src={c.shot.src}
                      alt={c.shot.alt}
                      fill
                      sizes="(min-width: 1024px) 31vw, (min-width: 640px) 46vw, 92vw"
                      placeholder={c.shot.blurDataURL ? "blur" : undefined}
                      blurDataURL={c.shot.blurDataURL}
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                    />
                  )}
                </div>

                {/* caption */}
                <div className="px-4 py-4">
                  <p className="text-sm leading-relaxed text-charcoal/80">
                    <span className="font-bold text-forest-deep">kgp.paws</span>{" "}
                    {c.caption}
                  </p>
                </div>
              </article>
            </Reveal>
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
      className="relative flex min-h-[100svh] items-center overflow-hidden bg-night text-ivory"
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
          <div className="absolute inset-0 bg-gradient-to-b from-night/85 via-night/72 to-night/90" />
        </div>
      )}

      <div className="container-page relative z-10 text-center">
        <Reveal>
          <PawPrint className="mx-auto h-10 w-10 text-marigold" aria-hidden="true" />
        </Reveal>
        <motion.h2
          id="stories-cta-h"
          className="mx-auto mt-7 max-w-4xl text-balance font-display text-4xl font-bold leading-[1.06] sm:text-6xl lg:text-7xl"
          initial={reduced ? false : { opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          Help Write The Next Success Story.
        </motion.h2>
        <Reveal delay={0.25}>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ivory/75">
            Every story on this page began with somebody deciding not to walk
            past. That is the entire qualification.
          </p>
        </Reveal>
        <Reveal delay={0.4} className="mt-10 flex flex-wrap justify-center gap-4">
          <Magnetic strength={0.25}>
            <Link
              href="/donate"
              className="group inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-saffron-deep via-saffron to-marigold px-10 py-4 text-lg font-bold text-ivory shadow-ember transition-all hover:brightness-105 active:scale-95"
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
