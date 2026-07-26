"use client";

import { useRef } from "react";
import Image from "next/image";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { Stethoscope } from "lucide-react";
import type { Shot } from "@/components/stories/StorySections";

export interface TimelineStep {
  /** e.g. "12 Mar 2026 · Found" — the part after "·" becomes the stage label. */
  date: string;
  text: string;
  medical?: string;
}

/** Split "12 Mar 2026 · Found" into its date and its stage. */
function parse(date: string): { when: string; stage?: string } {
  const [when, stage] = date.split("·").map((s) => s.trim());
  return { when, stage };
}

/**
 * The rescue journey — a full-screen documentary scroll. Each stage fills the
 * viewport with a single photograph under a slow parallax drift; the title,
 * date, narrative and any clinical detail rise from the lower third as the
 * stage enters. An Instagram-style row of segments is pinned at the top and
 * fills as the reader scrolls from one stage to the next.
 *
 * The stage label is authored into the date string after a "·", so the
 * existing `timeline` block carries it with no schema change. Reduced-motion
 * readers get the same content with the parallax and reveals switched off.
 */
export function StoryTimeline(props: {
  steps: TimelineStep[];
  shots: Shot[];
  title: string;
}) {
  // Bail out BEFORE any scroll hook runs — a story with no timeline block
  // renders nothing, and calling useScroll on a ref we never attach makes
  // Framer Motion warn "target ref is defined but not hydrated".
  if (!props.steps.length) return null;
  return <Journey {...props} />;
}

function Journey({
  steps,
  shots,
  title,
}: {
  steps: TimelineStep[];
  shots: Shot[];
  title: string;
}) {
  const journeyRef = useRef<HTMLElement>(null);
  // 0 when the journey's top meets the viewport top, 1 when its bottom
  // meets the viewport bottom — the reader's progress through the whole arc.
  const { scrollYProgress } = useScroll({
    target: journeyRef,
    offset: ["start start", "end end"],
  });

  const n = steps.length;

  return (
    <section
      ref={journeyRef}
      aria-label={`${title} — the rescue journey`}
      className="relative bg-night text-ivory"
    >
      {/* pinned progress indicator — floats over the stages, with a faint
          scrim so the bars stay legible over bright photography */}
      <div className="pointer-events-none sticky top-16 z-30 bg-gradient-to-b from-night/80 via-night/40 to-transparent pb-8 pt-4 md:top-20">
        <div className="container-page">
          <div className="flex items-center gap-1.5">
            {steps.map((step, i) => (
              <ProgressSegment
                key={step.date + i}
                progress={scrollYProgress}
                index={i}
                total={n}
              />
            ))}
          </div>
          <p className="mt-2.5 text-[11px] font-bold uppercase tracking-[0.22em] text-ivory/55">
            The rescue journey
          </p>
        </div>
      </div>

      {/* the stages scroll up behind the floating indicator */}
      <ol className="-mt-24">
        {steps.map((step, i) => (
          <JourneyStage
            key={step.date + i}
            step={step}
            shot={shots[i % Math.max(1, shots.length)]}
            index={i}
            total={n}
            title={title}
          />
        ))}
      </ol>
    </section>
  );
}

/** One segment of the pinned indicator, filling across its slice of scroll. */
function ProgressSegment({
  progress,
  index,
  total,
}: {
  progress: MotionValue<number>;
  index: number;
  total: number;
}) {
  const start = index / total;
  const end = (index + 1) / total;
  const scaleX = useTransform(progress, [start, end], [0, 1], { clamp: true });

  return (
    <span className="h-1 flex-1 overflow-hidden rounded-full bg-ivory/25">
      <motion.span
        className="block h-full origin-left rounded-full bg-gradient-to-r from-saffron to-marigold"
        style={{ scaleX }}
      />
    </span>
  );
}

function JourneyStage({
  step,
  shot,
  index,
  total,
  title,
}: {
  step: TimelineStep;
  shot?: Shot;
  index: number;
  total: number;
  title: string;
}) {
  const reduced = useReducedMotion() ?? false;
  const ref = useRef<HTMLLIElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  // gentle parallax — the photo drifts slower than the page
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
  const { when, stage } = parse(step.date);

  return (
    <li
      ref={ref}
      className="relative flex min-h-[88svh] items-end overflow-hidden"
    >
      {/* full-bleed parallax photograph */}
      {shot ? (
        <motion.div
          className="absolute inset-[-8%]"
          style={reduced ? undefined : { y }}
          aria-hidden="true"
        >
          <Image
            src={shot.src}
            alt=""
            fill
            sizes="100vw"
            placeholder={shot.blurDataURL ? "blur" : undefined}
            blurDataURL={shot.blurDataURL}
            className="object-cover"
          />
        </motion.div>
      ) : (
        <div className="absolute inset-0 bg-night-soft" aria-hidden="true" />
      )}

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-night via-night/55 to-night/20"
      />

      {/* content rises from the lower third */}
      <motion.div
        className="container-page relative z-10 pb-16 pt-32 sm:pb-24"
        initial={reduced ? false : { opacity: 0, y: 48 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="max-w-2xl">
          <p className="font-mono text-sm font-semibold text-marigold">
            {String(index + 1).padStart(2, "0")}
            <span className="text-ivory/40"> / {String(total).padStart(2, "0")}</span>
          </p>

          {/* the stage label is the headline; a labelless step (e.g. the
              "Today" finale) promotes its date to the headline instead */}
          <h2 className="mt-3 text-balance font-display text-4xl font-bold leading-[1.05] sm:text-6xl">
            {stage ?? when}
          </h2>
          {stage && (
            <p className="mt-3 text-sm font-bold uppercase tracking-[0.2em] text-ivory/60">
              {when}
            </p>
          )}

          <p className="mt-6 text-lg leading-relaxed text-ivory/85 sm:text-xl">
            {step.text}
          </p>

          {step.medical && (
            <div className="mt-7 max-w-xl rounded-2xl border border-ivory/15 bg-night/50 p-5 backdrop-blur-sm">
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-chakra-glow">
                <Stethoscope className="h-3.5 w-3.5" aria-hidden="true" />
                Medical details
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ivory/75">
                {step.medical}
              </p>
            </div>
          )}
        </div>
      </motion.div>

      <span className="sr-only">
        {title}, stage {index + 1} of {total}
      </span>
    </li>
  );
}
