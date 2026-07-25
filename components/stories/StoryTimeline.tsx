"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Shot } from "@/components/stories/StorySections";

export interface TimelineStep {
  /** e.g. "12 Mar 2026 · Found" — the part after "·" becomes the stage label. */
  date: string;
  text: string;
}

/** Split "12 Mar 2026 · Found" into its date and its stage. */
function parse(date: string): { when: string; stage?: string } {
  const [when, stage] = date.split("·").map((s) => s.trim());
  return { when, stage };
}

/**
 * The spine of a rescue story — one full-width band per stage, alternating
 * left and right, each rising into place as it scrolls in.
 *
 * The stage label ("Found", "Rescue", "Medical treatment", …) is authored into
 * the date string after a "·" so the existing `timeline` block shape carries
 * it without a schema change. Steps written without one still render; they
 * simply show the date alone.
 */
export function StoryTimeline({
  steps,
  shots,
  title,
}: {
  steps: TimelineStep[];
  shots: Shot[];
  title: string;
}) {
  const reduced = useReducedMotion() ?? false;
  if (!steps.length) return null;

  return (
    <section
      aria-label={`${title} — the journey`}
      className="relative bg-night py-20 text-ivory sm:py-28"
    >
      <div className="container-page">
        <p className="eyebrow mb-12 text-marigold sm:mb-16">The journey</p>

        <ol className="relative space-y-16 sm:space-y-24">
          {/* the rail, behind the steps */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-10 left-[15px] top-10 w-px bg-gradient-to-b from-marigold/60 via-marigold/25 to-transparent lg:left-1/2"
          />

          {steps.map((step, i) => {
            const { when, stage } = parse(step.date);
            const shot = shots[i % Math.max(1, shots.length)];
            const flip = i % 2 === 1;

            return (
              <motion.li
                key={step.date + i}
                className="relative grid gap-6 lg:grid-cols-2 lg:items-center lg:gap-14"
                initial={reduced ? false : { opacity: 0, y: 44 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* node on the rail */}
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-1.5 grid h-8 w-8 place-items-center rounded-full bg-night ring-1 ring-marigold/40 lg:left-1/2 lg:-translate-x-1/2"
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-saffron to-marigold" />
                </span>

                {/* image */}
                <div className={cn("pl-12 lg:pl-0", flip && "lg:order-2")}>
                  {shot && (
                    <div className="relative aspect-[3/2] overflow-hidden rounded-3xl bg-night-soft shadow-lift ring-1 ring-ivory/10">
                      <Image
                        src={shot.src}
                        alt={`${title} — ${stage ?? when}`}
                        fill
                        sizes="(min-width: 1024px) 44vw, 88vw"
                        placeholder={shot.blurDataURL ? "blur" : undefined}
                        blurDataURL={shot.blurDataURL}
                        className="object-cover transition-transform duration-[1.4s] ease-out hover:scale-[1.05]"
                      />
                    </div>
                  )}
                </div>

                {/* copy */}
                <div
                  className={cn(
                    "pl-12 lg:pl-0",
                    flip ? "lg:order-1 lg:pr-10 lg:text-right" : "lg:pl-10"
                  )}
                >
                  {stage && (
                    <p className="font-display text-2xl font-bold text-marigold sm:text-3xl">
                      {stage}
                    </p>
                  )}
                  <p className="mt-1.5 text-xs font-bold uppercase tracking-[0.18em] text-ivory/55">
                    {when}
                  </p>
                  <p className="mt-4 max-w-xl text-base leading-relaxed text-ivory/80 sm:text-lg lg:inline-block">
                    {step.text}
                  </p>
                </div>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
