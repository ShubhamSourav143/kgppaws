"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  ArrowUpRight,
  HeartHandshake,
  PawPrint,
  Syringe,
  Stethoscope,
  Utensils,
  ShieldCheck,
} from "lucide-react";
import { Counter } from "@/components/fx/Counter";
import { Reveal } from "@/components/motion/Reveal";
import { Magnetic } from "@/components/fx/Magnetic";
import { cn } from "@/lib/utils";

export interface Shot {
  src: string;
  alt: string;
  blurDataURL?: string;
}

/* ————————————————————————— 1 · Hero ————————————————————————— */

/** Paw drift positions — spread across the hero, each with its own tempo. */
const PAWS = [
  { left: "8%", top: "22%", size: 30, delay: 0, dur: 13, rot: -18 },
  { left: "20%", top: "68%", size: 22, delay: 2.4, dur: 16, rot: 12 },
  { left: "44%", top: "16%", size: 18, delay: 1.2, dur: 15, rot: 26 },
  { left: "68%", top: "72%", size: 26, delay: 3.1, dur: 14, rot: -8 },
  { left: "84%", top: "30%", size: 20, delay: 0.8, dur: 17, rot: 20 },
  { left: "57%", top: "48%", size: 15, delay: 4.2, dur: 18, rot: -24 },
];

/**
 * Full-viewport hero — a collage of the animals the money reaches, dimmed
 * behind the message, with paw prints drifting slowly over the top.
 */
export function DonateHero({ shots }: { shots: Shot[] }) {
  const reduced = useReducedMotion() ?? false;
  const tiles = shots.slice(0, 12);

  return (
    <header className="relative -mt-16 flex min-h-[100svh] items-center overflow-hidden bg-night text-ivory md:-mt-20">
      {/* collage */}
      <div className="absolute inset-0" aria-hidden="true">
        <div className="grid h-full w-full grid-cols-3 grid-rows-4 sm:grid-cols-4 sm:grid-rows-3">
          {tiles.map((s, i) => (
            <motion.div
              key={s.src + i}
              className="relative overflow-hidden"
              initial={reduced ? false : { opacity: 0, scale: 1.08 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 1.2,
                delay: Math.min(i * 0.07, 0.7),
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <Image
                src={s.src}
                alt=""
                fill
                sizes="(min-width: 640px) 25vw, 34vw"
                placeholder={s.blurDataURL ? "blur" : undefined}
                blurDataURL={s.blurDataURL}
                // globals.css already stops .anim-kenburns under reduced
                // motion, so this stays unconditional — branching on the hook
                // here would change the server-rendered markup
                className="anim-kenburns object-cover"
              />
            </motion.div>
          ))}
        </div>
        {/* legibility scrim */}
        <div className="absolute inset-0 bg-gradient-to-b from-night/92 via-night/78 to-night/95" />
        <div className="absolute inset-0 bg-gradient-to-r from-night via-night/60 to-transparent" />
      </div>

      {/* Floating paws. Always mounted — unmounting on the reduced-motion hook
          would make the server and client render different markup. Reduced
          motion instead parks them at a fixed low opacity. */}
      <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden="true">
        {PAWS.map((p, i) => (
          <motion.span
            key={i}
            className="absolute text-marigold/25"
            style={{ left: p.left, top: p.top }}
            initial={{ opacity: 0, y: 20 }}
            animate={
              reduced
                ? { opacity: 0.5, y: 0, rotate: p.rot }
                : { opacity: [0, 0.9, 0.9, 0], y: [-10, -70], rotate: p.rot }
            }
            transition={
              reduced
                ? { duration: 0 }
                : {
                    duration: p.dur,
                    delay: p.delay,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }
            }
          >
            <PawPrint style={{ height: p.size, width: p.size }} />
          </motion.span>
        ))}
      </div>

      <div className="container-page relative z-10 py-24">
        <div className="max-w-3xl">
          <Reveal>
            <p className="eyebrow mb-5 inline-flex items-center gap-2 text-marigold">
              <PawPrint className="h-4 w-4" aria-hidden="true" />
              Every rupee reaches a paw
            </p>
          </Reveal>
          <motion.h1
            className="text-balance font-display text-[2.6rem] font-bold leading-[1.03] sm:text-6xl lg:text-7xl"
            initial={reduced ? false : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            Every Donation
            <br />
            Changes a Life.
          </motion.h1>
          <Reveal delay={0.35}>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-ivory/75">
              Three hundred and fifty dogs share this campus with us. They are
              fed, vaccinated, sterilized and treated by students who show up
              every single morning — funded entirely by people like you.
            </p>
          </Reveal>
          <Reveal delay={0.5} className="mt-10 flex flex-wrap items-center gap-4">
            <Magnetic strength={0.22}>
              <Link
                href="#give"
                className="group inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-saffron-deep via-saffron to-marigold px-8 py-4 text-base font-bold text-ivory shadow-ember transition-all hover:brightness-105 active:scale-95"
              >
                <HeartHandshake className="h-5 w-5" aria-hidden="true" />
                Donate Now
              </Link>
            </Magnetic>
            <Link
              href="#campaigns"
              className="glass-dark inline-flex items-center gap-2 rounded-full px-7 py-4 text-base font-semibold text-ivory transition-colors hover:bg-ivory/15"
            >
              Explore Campaigns
              <ArrowDown className="h-5 w-5 text-chakra-glow" aria-hidden="true" />
            </Link>
          </Reveal>
        </div>
      </div>
    </header>
  );
}

/* ————————————————————————— 2 · Our impact ————————————————————————— */

const STATS = [
  { value: 350, suffix: "+", label: "Dogs fed every day", icon: Utensils },
  { value: 600, suffix: "+", label: "Dogs vaccinated every year", icon: Syringe },
  { value: 500, suffix: "+", label: "Sterilizations completed", icon: ShieldCheck },
  { value: 300, suffix: "+", label: "Campus animals under care", icon: Stethoscope },
];

export function ImpactStats() {
  return (
    <section aria-labelledby="impact-h" className="bg-parchment py-20 sm:py-28">
      <div className="container-page">
        <div className="max-w-2xl">
          <Reveal>
            <p className="eyebrow mb-4 text-saffron-deep">Our impact</p>
            <h2
              id="impact-h"
              className="font-display text-3xl font-bold leading-tight text-forest-deep sm:text-4xl lg:text-5xl"
            >
              Numbers that started as somebody&apos;s spare change.
            </h2>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={Math.min(i * 0.08, 0.3)}>
              <div className="group h-full rounded-3xl border border-line bg-ivory p-7 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-glow">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-saffron/12 text-saffron-deep transition-transform duration-300 group-hover:scale-110">
                  <s.icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <p className="mt-5 font-display text-4xl font-bold text-forest-deep sm:text-5xl">
                  <Counter value={s.value} suffix={s.suffix} />
                </p>
                <p className="mt-2 text-sm leading-relaxed text-charcoal/70">
                  {s.label}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ————————————————————————— 5 · Why donate ————————————————————————— */

const REASONS = [
  {
    icon: Utensils,
    title: "Feeding",
    body: "Cooked meals on nine routes every morning of the year, and through every vacation when the messes close.",
    key: "feed",
  },
  {
    icon: Syringe,
    title: "Vaccination",
    body: "Anti-rabies and DHPP for around 600 dogs a year — the cheapest safety the campus will ever buy.",
    key: "vacc",
  },
  {
    icon: ShieldCheck,
    title: "Sterilization",
    body: "Over 500 completed. Humane population control that means fewer animals born into hardship.",
    key: "ster",
  },
  {
    icon: Stethoscope,
    title: "Emergency care",
    body: "Accidents, fractures, surgeries. The reserve that lets a volunteer say yes at two in the morning.",
    key: "med",
  },
];

export function WhyDonate({ shots }: { shots: Shot[] }) {
  return (
    <section aria-labelledby="why-donate-h" className="bg-cream py-20 sm:py-28">
      <div className="container-page">
        <div className="max-w-2xl">
          <Reveal>
            <p className="eyebrow mb-4 text-saffron-deep">Where it goes</p>
            <h2
              id="why-donate-h"
              className="font-display text-3xl font-bold leading-tight text-forest-deep sm:text-4xl lg:text-5xl"
            >
              Every rupee goes directly to one of four things.
            </h2>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {REASONS.map((r, i) => {
            const shot = shots[i % Math.max(1, shots.length)];
            return (
              <Reveal key={r.key} delay={Math.min(i * 0.08, 0.3)}>
                <article className="group h-full overflow-hidden rounded-3xl border border-line bg-ivory shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-glow">
                  <div className="relative aspect-[4/3] overflow-hidden bg-sand-light">
                    {shot && (
                      <Image
                        src={shot.src}
                        alt={shot.alt}
                        fill
                        sizes="(min-width: 1024px) 23vw, (min-width: 640px) 45vw, 90vw"
                        placeholder={shot.blurDataURL ? "blur" : undefined}
                        blurDataURL={shot.blurDataURL}
                        className="object-contain transition-transform duration-700 ease-out group-hover:scale-[1.07]"
                      />
                    )}
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-night/55 to-transparent"
                      aria-hidden="true"
                    />
                    <span className="absolute bottom-3 left-3 grid h-10 w-10 place-items-center rounded-full bg-ivory/95 text-saffron-deep shadow-soft">
                      <r.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                  </div>
                  <div className="p-6">
                    <h3 className="font-display text-xl font-bold text-forest-deep">
                      {r.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-charcoal/70">
                      {r.body}
                    </p>
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

/* ————————————————————————— 6 · Final CTA ————————————————————————— */

export function FinalCta({ shots }: { shots: Shot[] }) {
  const reduced = useReducedMotion() ?? false;
  const backdrop = shots[0];

  return (
    <section
      aria-labelledby="final-cta-h"
      className="relative overflow-hidden bg-night py-28 text-ivory sm:py-36"
    >
      {backdrop && (
        <div className="absolute inset-0" aria-hidden="true">
          <Image
            src={backdrop.src}
            alt=""
            fill
            sizes="100vw"
            placeholder={backdrop.blurDataURL ? "blur" : undefined}
            blurDataURL={backdrop.blurDataURL}
            className={cn("object-cover", !reduced && "anim-kenburns")}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-night/85 via-night/75 to-night/90" />
        </div>
      )}

      <div className="container-page relative z-10 text-center">
        <Reveal>
          <PawPrint className="mx-auto h-10 w-10 text-marigold" aria-hidden="true" />
        </Reveal>
        <motion.h2
          id="final-cta-h"
          className="mx-auto mt-7 max-w-3xl text-balance font-display text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-6xl"
          initial={reduced ? false : { opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          They Cannot Ask For Help.
          <br />
          But We Can.
        </motion.h2>
        <Reveal delay={0.25}>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ivory/70">
            A hundred rupees is a coffee. It is also a day of meals for a dog who
            has no other way of getting one.
          </p>
        </Reveal>
        <Reveal delay={0.4} className="mt-10 flex flex-wrap justify-center gap-4">
          <Magnetic strength={0.25}>
            <Link
              href="#give"
              className="group inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-saffron-deep via-saffron to-marigold px-9 py-4 text-lg font-bold text-ivory shadow-ember transition-all hover:brightness-105 active:scale-95"
            >
              <HeartHandshake className="h-5 w-5" aria-hidden="true" />
              Donate Now
              <ArrowUpRight
                className="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden="true"
              />
            </Link>
          </Magnetic>
        </Reveal>
      </div>
    </section>
  );
}
