"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import { PawPrint } from "lucide-react";
import { Reveal } from "@/components/fx/Reveal";
import { TextReveal } from "@/components/fx/TextReveal";
import { cn } from "@/lib/utils";

/** A resolved photo (built server-side from the media manifest: src + blur). */
export interface WhyPhoto {
  src: string;
  blurDataURL?: string;
  width?: number;
  height?: number;
  alt?: string;
}

/** Keyed by filename stem — adopt/*.jpg and hero-grid/grid-NN.jpg. */
export type WhyPhotos = Record<string, WhyPhoto>;

interface Slide {
  n: string;
  /** filename stem resolved against the media manifest */
  key: string;
  alt: string;
  title: string;
  body: string;
  points: [string, string, string];
}

/**
 * Four "Why Adoption Matters" stories. Each is a single emotional photograph
 * paired with one message. Photos are keyed by filename stem and resolved to
 * real files (with blur placeholders) by the Adopt page; a missing key
 * degrades to a soft gradient so the layout never breaks.
 *
 * The four slides deliberately share the same shape — a title, one sentence,
 * and exactly three bullets of similar length — so every slide reserves the
 * same height and the slideshow never shifts the page as it advances.
 */
const SLIDES: Slide[] = [
  {
    n: "01",
    key: "romi",
    alt: "A rescued street dog waiting quietly for a home",
    title: "Thousands are abandoned every year",
    body:
      "Healthy dogs and cats are left behind every single day — not because anything is wrong with them, but because homes ran out before love did.",
    points: [
      "Born on the roadside, many never survive their first months",
      "Left at gates, markets and highways once they’re no longer wanted",
      "Every empty bowl is a life still waiting to be chosen",
    ],
  },
  {
    n: "02",
    key: "odin",
    alt: "A small-breed dog once bred for sale, now rescued",
    title: "Bred for profit, then discarded",
    body:
      "Countless animals are bred purely to sell and abandoned the moment they stop being profitable.",
    points: [
      "Sold as products, dumped when they fall ill or grow up",
      "Our volunteers rescue, treat and patiently rehabilitate them",
      "They slowly learn a raised hand can also be a gentle one",
    ],
  },
  {
    n: "03",
    key: "grid-09",
    alt: "A joyful adopted dog thriving in a loving home",
    title: "One rescue changes two lives",
    body:
      "Adopting frees up scarce care for the next animal in crisis and quietly eases the cycle of needless breeding.",
    points: [
      "Your home opens a shelter space for another rescue",
      "Fewer animals bred means fewer animals abandoned",
      "Two lives change forever — theirs, and yours",
    ],
  },
  {
    n: "04",
    key: "simba",
    alt: "A healthy, happy adopted dog greeting the morning",
    title: "You write their next chapter",
    body:
      "Choose adoption and a frightened survivor becomes a thriving companion who greets every morning like a gift.",
    points: [
      "Vaccinated, health-checked and ready for a family",
      "A loyal friend who never forgets the day you chose them",
      "Living proof that second chances make the best stories",
    ],
  },
];

const DURATION = 5000; // ms per slide
const LEN = SLIDES.length;

/** The two-column body of a single slide (image left · message right). */
function SlideBody({
  slide,
  photos,
  preview,
  reduced,
}: {
  slide: Slide;
  photos: WhyPhotos;
  /** render as an invisible sizer (no image load, no animation) */
  preview?: boolean;
  reduced?: boolean;
}) {
  const photo = photos[slide.key];
  return (
    <div className="grid items-center gap-5 sm:gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,7fr)] lg:gap-8">
      {/* — image (≈30%) — */}
      <div className="relative aspect-[16/11] w-full overflow-hidden rounded-3xl bg-sand-light shadow-lift ring-1 ring-line/60 lg:aspect-[4/5]">
        {preview ? (
          <div className="h-full w-full" aria-hidden="true" />
        ) : photo ? (
          <motion.div
            className="absolute inset-0"
            initial={reduced ? false : { scale: 1.02 }}
            animate={reduced ? undefined : { scale: 1.12 }}
            transition={{ duration: 6.2, ease: "linear" }}
          >
            <Image
              src={photo.src}
              alt={photo.alt ?? slide.alt}
              fill
              sizes="(min-width: 1024px) 30vw, 92vw"
              placeholder={photo.blurDataURL ? "blur" : undefined}
              blurDataURL={photo.blurDataURL}
              className="object-cover"
            />
          </motion.div>
        ) : (
          <div
            aria-hidden="true"
            className="h-full w-full bg-gradient-to-br from-sand via-sand-light to-mist"
          />
        )}
      </div>

      {/* — message (≈70%) — */}
      <div className="lg:pl-1">
        <p className="font-display text-sm font-bold text-moss">
          {slide.n}
          <span className="text-charcoal/30"> / {String(LEN).padStart(2, "0")}</span>
        </p>
        <h3 className="mt-2 font-display text-2xl font-bold leading-snug text-forest-deep sm:text-3xl lg:text-[2.15rem]">
          {slide.title}
        </h3>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-charcoal/70 sm:text-base">
          {slide.body}
        </p>
        <ul className="mt-5 space-y-3">
          {slide.points.map((point) => (
            <li key={point} className="flex items-start gap-3">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-saffron/12 text-saffron-deep">
                <PawPrint className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <span className="text-sm leading-relaxed text-charcoal/80 sm:text-[0.95rem]">
                {point}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * "Why Adoption Matters" — an Instagram-Stories slideshow. Each story is a
 * large photograph beside its adoption message; four thin progress bars drive
 * the show (auto-advancing every 5s, click to jump, pause on hover, swipe on
 * touch). Slides cross-fade with a gentle horizontal slide while the active
 * photo drifts in a slow Ken Burns zoom. Respects prefers-reduced-motion.
 */
export function WhyAdopt({ photos = {} }: { photos?: WhyPhotos }) {
  const reduced = useReducedMotion() ?? false;

  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const progress = useMotionValue(0);

  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { amount: 0.35 });

  const elapsed = useRef(0);
  const hovering = useRef(false);

  const go = useCallback(
    (next: number, direction: number) => {
      elapsed.current = 0;
      progress.set(0);
      setDir(direction);
      setIndex(((next % LEN) + LEN) % LEN);
    },
    [progress]
  );

  const jump = useCallback(
    (i: number) => {
      if (i === index) return;
      go(i, i > index ? 1 : -1);
    },
    [index, go]
  );

  // Reset the clock whenever the active slide changes (jump or auto-advance).
  useEffect(() => {
    elapsed.current = 0;
    progress.set(0);
  }, [index, progress]);

  // Single rAF clock drives both the active bar's fill and the auto-advance.
  useAnimationFrame((_t, delta) => {
    if (reduced || !inView || hovering.current) return;
    if (typeof document !== "undefined" && document.hidden) return;
    elapsed.current += delta;
    const p = elapsed.current / DURATION;
    if (p >= 1) {
      go(index + 1, 1);
    } else {
      progress.set(p);
    }
  });

  const slideTransition = { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const };
  const active = SLIDES[index];

  return (
    <section
      ref={sectionRef}
      aria-labelledby="why-h"
      aria-roledescription="carousel"
      className="bg-cream py-20 sm:py-28"
      onMouseEnter={() => (hovering.current = true)}
      onMouseLeave={() => (hovering.current = false)}
    >
      <div className="container-page">
        <div className="max-w-2xl">
          <Reveal effect="fade">
            <p className="eyebrow mb-4 text-saffron-deep">Why it matters</p>
          </Reveal>
          <TextReveal
            as="h2"
            text="Why Adoption Matters"
            className="font-display text-3xl font-bold leading-tight text-forest-deep sm:text-4xl lg:text-5xl"
          />
        </div>

        <Reveal effect="rise" className="mt-12 sm:mt-14">
          {/* — progress bars — */}
          <div className="flex items-center gap-2" role="tablist" aria-label="Story progress">
            {SLIDES.map((s, i) => (
              <ProgressSegment
                key={s.n}
                index={i}
                state={i < index ? "done" : i === index ? "active" : "todo"}
                progress={progress}
                reduced={reduced}
                title={s.title}
                onJump={jump}
              />
            ))}
          </div>

          {/* — stage — */}
          <motion.div
            className="relative mt-8 touch-pan-y select-none sm:mt-10"
            onPanEnd={(e, info) => {
              const pointer = (e as PointerEvent).pointerType;
              if (pointer && pointer !== "touch") return; // swipe = touch only
              if (info.offset.x < -60) go(index + 1, 1);
              else if (info.offset.x > 60) go(index - 1, -1);
            }}
          >
            {/* invisible sizer — stacks all four slides in one grid cell so the
                stage always reserves the tallest slide's height (no layout
                shift), responsively, with no magic numbers. */}
            <div aria-hidden="true" className="invisible grid pointer-events-none">
              {SLIDES.map((s) => (
                <div key={s.n} className="col-start-1 row-start-1">
                  <SlideBody slide={s} photos={photos} preview />
                </div>
              ))}
            </div>

            {/* animated layers, absolutely filling the reserved box */}
            <div className="absolute inset-0">
              <AnimatePresence initial={false} custom={dir}>
                <motion.div
                  key={index}
                  custom={dir}
                  className="absolute inset-0"
                  initial={
                    reduced
                      ? { opacity: 0 }
                      : { opacity: 0, x: dir > 0 ? 48 : -48 }
                  }
                  animate={{ opacity: 1, x: 0 }}
                  exit={
                    reduced
                      ? { opacity: 0 }
                      : { opacity: 0, x: dir > 0 ? -48 : 48 }
                  }
                  transition={slideTransition}
                >
                  <SlideBody slide={active} photos={photos} reduced={reduced} />
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </Reveal>
      </div>
    </section>
  );
}

/** Progress segment with an explicit done/active/todo state. */
function ProgressSegment({
  index,
  state,
  progress,
  reduced,
  title,
  onJump,
}: {
  index: number;
  state: "done" | "active" | "todo";
  progress: ReturnType<typeof useMotionValue<number>>;
  reduced: boolean;
  title: string;
  onJump: (i: number) => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={state === "active"}
      aria-label={`Go to slide ${index + 1}: ${title}`}
      onClick={() => onJump(index)}
      className="group relative flex-1 py-2 focus-visible:outline-none"
    >
      <span className="block h-1 overflow-hidden rounded-full bg-charcoal/12 transition-colors group-hover:bg-charcoal/20 group-focus-visible:ring-2 group-focus-visible:ring-saffron/60">
        {state === "active" ? (
          <motion.span
            className="block h-full w-full origin-left rounded-full bg-gradient-to-r from-saffron-deep to-saffron"
            style={reduced ? { scaleX: 1 } : { scaleX: progress }}
          />
        ) : (
          <span
            className={cn(
              "block h-full rounded-full bg-gradient-to-r from-saffron-deep to-saffron transition-[width] duration-500",
              state === "done" ? "w-full" : "w-0"
            )}
          />
        )}
      </span>
    </button>
  );
}
