"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowUpRight, HandHeart, HeartHandshake, Users, X } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { OurWorkSlideshow, type SlidePhoto } from "./OurWorkSlideshow";
import { cn } from "@/lib/utils";
import type { KnowledgeArticle, ShelterMember } from "@/lib/our-work/content";

/* ————————————————————————— Hero ————————————————————————— */

export function OurWorkHero({ shot }: { shot?: SlidePhoto }) {
  const reduced = useReducedMotion() ?? false;

  return (
    <header className="relative -mt-16 flex min-h-[92svh] items-end overflow-hidden bg-night text-ivory md:-mt-20">
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
            priority
          />
          <div className="absolute inset-0 bg-night/45" />
          <div className="absolute inset-0 bg-gradient-to-t from-night via-night/65 to-transparent" />
        </div>
      )}

      <div className="container-page relative z-10 pb-24 pt-40 sm:pb-32">
        <div className="max-w-4xl">
          <Reveal>
            <p className="eyebrow mb-6 inline-flex items-center gap-2 text-marigold">
              KGP PAWS · A YEAR ON CAMPUS
            </p>
          </Reveal>

          <h1 className="text-balance font-display text-[2.7rem] font-bold leading-[1.02] sm:text-6xl lg:text-7xl">
            {["Our Work"].map((line, i) => (
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
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-ivory/80 sm:text-xl">
              Feeding, rescue, sterilization, vaccination, chemotherapy, daily
              medical care — this is what a year of work by KGP PAWS actually
              looks like on the ground.
            </p>
          </Reveal>

          <Reveal delay={0.65} className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="#shelter-family"
              className="group inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-saffron-deep via-saffron to-marigold px-8 py-4 text-base font-bold text-ivory shadow-ember transition-all hover:brightness-105 active:scale-95"
            >
              Start the tour
              <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="#knowledge-centre"
              className="glass-dark inline-flex items-center gap-2 rounded-full px-7 py-4 text-base font-semibold text-ivory transition-colors hover:bg-ivory/15"
            >
              Knowledge Centre
              <ArrowUpRight className="h-5 w-5 text-chakra-glow" aria-hidden="true" />
            </Link>
          </Reveal>
        </div>
      </div>
    </header>
  );
}

/* ————————————————————— Section wrapper ————————————————————— */

interface WorkSectionProps {
  id: string;
  eyebrow: string;
  title: string;
  intro: string;
  description: string;
  photos: SlidePhoto[];
  tone?: "cream" | "parchment" | "mist" | "night";
  aspect?: "video" | "wide" | "square" | "portrait";
}

const TONES = {
  cream: { bg: "bg-cream", eye: "text-saffron-deep", head: "text-forest-deep", body: "text-charcoal/75", intro: "text-moss" },
  parchment: { bg: "bg-parchment", eye: "text-saffron-deep", head: "text-forest-deep", body: "text-charcoal/75", intro: "text-moss" },
  mist: { bg: "bg-mist", eye: "text-forest-bright", head: "text-forest-deep", body: "text-charcoal/75", intro: "text-moss" },
  night: { bg: "bg-night", eye: "text-marigold", head: "text-ivory", body: "text-ivory/75", intro: "text-ivory/65" },
} as const;

export function WorkSection({
  id,
  eyebrow,
  title,
  intro,
  description,
  photos,
  tone = "cream",
  aspect = "wide",
}: WorkSectionProps) {
  const t = TONES[tone];

  return (
    <section
      id={id}
      aria-labelledby={`${id}-h`}
      className={`scroll-mt-24 ${t.bg} py-20 sm:py-28`}
    >
      <div className="container-page">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <p className={`eyebrow mb-4 ${t.eye}`}>{eyebrow}</p>
            <h2
              id={`${id}-h`}
              className={`text-balance font-display text-3xl font-bold leading-tight ${t.head} sm:text-4xl lg:text-5xl`}
            >
              {title}
            </h2>
            <p className={`mx-auto mt-5 max-w-2xl text-base leading-relaxed sm:text-lg ${t.intro}`}>
              {intro}
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div className="mx-auto mt-12 max-w-5xl sm:mt-14">
            <OurWorkSlideshow photos={photos} aspect={aspect} />
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <p className={`mx-auto mt-8 max-w-3xl text-center text-sm leading-relaxed sm:text-base ${t.body}`}>
            {description}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ————————————————— Shelter family section ————————————————— */

export function ShelterFamilySection({
  members,
}: {
  members: ShelterMember[];
}) {
  const current = members.filter((m) => !m.memoriam);
  const lost = members.filter((m) => m.memoriam);

  return (
    <section
      id="shelter-family"
      aria-labelledby="shelter-h"
      className="scroll-mt-24 bg-parchment py-20 sm:py-28"
    >
      <div className="container-page">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="eyebrow mb-4 text-saffron-deep">The heart of the page</p>
            <h2
              id="shelter-h"
              className="text-balance font-display text-3xl font-bold leading-tight text-forest-deep sm:text-4xl lg:text-5xl"
            >
              Meet Our Shelter Family
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-moss sm:text-lg">
              These are not simply rescued animals. They are family members who
              continue to live under our care every day.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-8 sm:mt-16 md:grid-cols-2 md:gap-10">
          {current.map((m, i) => (
            <Reveal key={m.slug} delay={Math.min(i * 0.08, 0.24)}>
              <ShelterMemberCard member={m} />
            </Reveal>
          ))}
        </div>

        {lost.length > 0 && (
          <div className="mt-20 sm:mt-24">
            <div className="mx-auto max-w-3xl text-center">
              <Reveal>
                <div className="flex items-center justify-center gap-4">
                  <span className="h-px w-12 bg-moss/40" aria-hidden="true" />
                  <p className="eyebrow text-moss">In loving memory</p>
                  <span className="h-px w-12 bg-moss/40" aria-hidden="true" />
                </div>
                <h3 className="mt-4 font-display text-2xl font-bold leading-tight text-forest-deep sm:text-3xl">
                  The family we lost.
                </h3>
                <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-moss sm:text-base">
                  Members of the shelter who spent their years with us and are
                  remembered every day by the volunteers who cared for them.
                </p>
              </Reveal>
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-2 md:gap-10 lg:grid-cols-3">
              {lost.map((m, i) => (
                <Reveal key={m.slug} delay={Math.min(i * 0.08, 0.24)}>
                  <ShelterMemberCard member={m} />
                </Reveal>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ShelterMemberCard({ member }: { member: ShelterMember }) {
  const memoriam = member.memoriam ?? false;
  const conditionLabel = memoriam ? "Remembered for" : "Current condition";
  const namePrefix = memoriam ? "Remembering" : "Meet";

  return (
    <article
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-[1.75rem] border shadow-card",
        memoriam ? "border-moss/20 bg-mist/40" : "border-line bg-ivory"
      )}
    >
      <div className={memoriam ? "relative" : undefined}>
        <OurWorkSlideshow
          photos={member.photos}
          aspect="wide"
          rounded="rounded-none"
          className={cn(
            memoriam ? "border-b border-moss/20" : "border-b border-line/60"
          )}
        />
        {memoriam && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-night/25 via-transparent to-transparent"
          />
        )}
      </div>

      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <div className="flex items-baseline justify-between gap-3">
          <h3
            className={cn(
              "font-display text-2xl font-bold sm:text-3xl",
              memoriam ? "text-forest" : "text-forest-deep"
            )}
          >
            {namePrefix} {member.name}
          </h3>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider",
              memoriam
                ? "bg-moss/15 text-moss"
                : "bg-forest-bright/10 text-forest-bright"
            )}
          >
            {member.status}
          </span>
        </div>

        <p
          className={cn(
            "mt-3 text-sm leading-relaxed sm:text-base",
            memoriam ? "text-charcoal/75" : "text-charcoal/80"
          )}
        >
          {member.intro}
        </p>

        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <dt
              className={cn(
                "text-[11px] font-bold uppercase tracking-wider",
                memoriam ? "text-moss" : "text-saffron-deep"
              )}
            >
              Journey
            </dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-charcoal/75">
              {member.journey}
            </dd>
          </div>
          <div>
            <dt
              className={cn(
                "text-[11px] font-bold uppercase tracking-wider",
                memoriam ? "text-moss" : "text-saffron-deep"
              )}
            >
              {conditionLabel}
            </dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-charcoal/75">
              {member.condition}
            </dd>
          </div>
        </dl>
      </div>
    </article>
  );
}

/* ————————————————— Knowledge Centre ————————————————— */

export function KnowledgeCentreSection({
  articles,
}: {
  articles: KnowledgeArticle[];
}) {
  // The open article, read by the reader dialog. "Read more" used to be a
  // <Link href="#knowledge-centre"> — a link to the very section it sits in, so
  // clicking it scrolled a few pixels and showed nothing. It now opens the full
  // article here.
  const [active, setActive] = useState<KnowledgeArticle | null>(null);

  return (
    <section
      id="knowledge-centre"
      aria-labelledby="know-h"
      className="scroll-mt-24 bg-cream py-20 sm:py-28"
    >
      <div className="container-page">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="eyebrow mb-4 text-saffron-deep">Knowledge Centre</p>
            <h2
              id="know-h"
              className="text-balance font-display text-3xl font-bold leading-tight text-forest-deep sm:text-4xl lg:text-5xl"
            >
              Practical guides for anyone helping campus animals.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-moss sm:text-lg">
              Short, honest reference pieces — what to do, what to avoid, and
              when to call for help.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a, i) => (
            <Reveal key={a.slug} delay={Math.min(i * 0.06, 0.24)}>
              <ArticleCard article={a} onOpen={() => setActive(a)} />
            </Reveal>
          ))}
        </div>
      </div>

      <ArticleReader article={active} onClose={() => setActive(null)} />
    </section>
  );
}

function ArticleCard({
  article,
  onOpen,
}: {
  article: KnowledgeArticle;
  onOpen: () => void;
}) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-ivory shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-glow">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Read the full guide: ${article.title}`}
        className="relative block aspect-[16/10] w-full overflow-hidden bg-sand-light text-left"
      >
        {article.photo && (
          <Image
            src={article.photo.src}
            alt={article.photo.alt}
            fill
            sizes="(min-width: 1024px) 31vw, (min-width: 640px) 46vw, 92vw"
            placeholder={article.photo.blurDataURL ? "blur" : undefined}
            blurDataURL={article.photo.blurDataURL}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
          />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-ivory/95 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-saffron-deep shadow-soft backdrop-blur-sm">
          {article.category}
        </span>
      </button>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-lg font-bold leading-snug text-forest-deep sm:text-xl">
          {article.title}
        </h3>
        <p className="mt-2.5 flex-1 text-sm leading-relaxed text-charcoal/70">
          {article.summary}
        </p>
        <button
          type="button"
          onClick={onOpen}
          aria-label={`Read the full guide: ${article.title}`}
          className="mt-5 inline-flex items-center gap-1.5 self-start text-sm font-bold text-saffron-deep transition-colors hover:text-forest"
        >
          Read more
          <ArrowUpRight
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden="true"
          />
        </button>
      </div>
    </article>
  );
}

/**
 * Full-article reader. A focused, accessible dialog rather than a new route or
 * an inline expand — it keeps the three-column grid intact and gives the full
 * guide room to be read. Handles Escape, backdrop dismiss, body scroll lock and
 * focus management; reduced motion skips the transition.
 */
function ArticleReader({
  article,
  onClose,
}: {
  article: KnowledgeArticle | null;
  onClose: () => void;
}) {
  const reduced = useReducedMotion() ?? false;
  const closeRef = useRef<HTMLButtonElement>(null);
  const open = article !== null;

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    // Move focus into the dialog so keyboard and screen-reader users land here.
    const id = requestAnimationFrame(() => closeRef.current?.focus());
    return () => {
      document.documentElement.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      cancelAnimationFrame(id);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {article && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-night/70 p-4 backdrop-blur-sm sm:items-center sm:p-6"
          data-lenis-prevent
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.2 }}
        >
          <motion.article
            role="dialog"
            aria-modal="true"
            aria-labelledby="article-reader-title"
            onClick={(e) => e.stopPropagation()}
            className="relative my-auto w-full max-w-2xl overflow-hidden rounded-3xl bg-cream shadow-lift"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: reduced ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            {article.photo && (
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-sand-light">
                <Image
                  src={article.photo.src}
                  alt={article.photo.alt}
                  fill
                  sizes="(min-width: 768px) 42rem, 92vw"
                  placeholder={article.photo.blurDataURL ? "blur" : undefined}
                  blurDataURL={article.photo.blurDataURL}
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-night/30 to-transparent" />
              </div>
            )}

            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full bg-night/40 text-ivory backdrop-blur-sm transition-colors hover:bg-night/70"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>

            <div className="max-h-[70vh] overflow-y-auto px-6 py-7 sm:px-10 sm:py-9" data-lenis-prevent>
              <p className="eyebrow text-saffron-deep">{article.category}</p>
              <h2
                id="article-reader-title"
                className="mt-2 text-balance font-display text-2xl font-bold leading-tight text-forest-deep sm:text-3xl"
              >
                {article.title}
              </h2>
              <div className="mt-5 space-y-4">
                {article.body.map((para, i) => (
                  <p key={i} className="text-[15px] leading-relaxed text-charcoal/80 sm:text-base">
                    {para}
                  </p>
                ))}
              </div>
            </div>
          </motion.article>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ————————————————— Final support CTA ————————————————— */

export function OurWorkFooterCta() {
  return (
    <section
      aria-labelledby="ow-cta-h"
      className="relative overflow-hidden bg-forest py-20 text-cream sm:py-24"
    >
      <div className="container-page relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="eyebrow mb-4 text-marigold">Support the work</p>
            <h2
              id="ow-cta-h"
              className="text-balance font-display text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl"
            >
              None of this happens without help.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-cream/80 sm:text-lg">
              Volunteers on the ground, funds for medicine and surgery, homes
              for animals ready to be adopted — pick whichever you can offer.
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/volunteer"
                className="inline-flex items-center gap-2 rounded-full bg-cream px-6 py-3 text-sm font-bold text-forest-deep transition-colors hover:bg-parchment"
              >
                <Users className="h-4 w-4" aria-hidden="true" />
                Volunteer with us
              </Link>
              <Link
                href="/donate#give"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-saffron-deep to-saffron px-6 py-3 text-sm font-bold text-ivory shadow-ember transition-all hover:brightness-105"
              >
                <HeartHandshake className="h-4 w-4" aria-hidden="true" />
                Donate
              </Link>
              <Link
                href="/adopt"
                className="inline-flex items-center gap-2 rounded-full border border-cream/30 px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-cream/10"
              >
                <HandHeart className="h-4 w-4" aria-hidden="true" />
                Adopt a paw
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
