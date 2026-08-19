"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { AnimalPortrait } from "@/components/animals/Portrait";
import { AutoplayVideo } from "@/components/media/AutoplayVideo";
import type { Animal } from "@/types";

type Subject = Pick<Animal, "name" | "species" | "portrait">;

export interface RescuePhoto {
  /** Corner label, e.g. "Before" / "After". */
  label: string;
  subject: Subject;
  photo?: string;
}

export interface RescueStory {
  name: string;
  tag: string;
  body: string;
  /** Full story, one string per paragraph, revealed on "Read more". */
  fullStory: string[];
  /** The media strip: a before/after pair, each rendered as one half. */
  photos: RescuePhoto[];
}

/**
 * A rescue story card whose "Read more" expands the full story inline instead
 * of navigating away. The two synthetic rescues (Romi, Odin) have no profile
 * page to link to, so an in-place expand is the honest affordance — the reader
 * gets the whole story without leaving the adopt page.
 */
export function RescueStoryCard({ story }: { story: RescueStory }) {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion() ?? false;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-ivory shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-glow">
      {/* Before / after strip — one half per photo, split by a hairline gap. */}
      <div className="relative flex aspect-[5/4] gap-1 overflow-hidden bg-mist">
        {story.photos.map((p, i) => (
          <div key={i} className="relative h-full flex-1 overflow-hidden">
            {p.photo && /\.mp4($|\?)/i.test(p.photo) ? (
              <AutoplayVideo
                src={p.photo}
                ariaLabel={`${p.label}: ${story.name}`}
                className="absolute inset-0 object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
              />
            ) : (
              <AnimalPortrait
                animal={p.subject}
                photoUrl={p.photo}
                className="h-full w-full rounded-none transition-transform duration-700 ease-out group-hover:scale-[1.05]"
              />
            )}
            <span className="absolute left-2 top-2 z-10 rounded-full bg-night/55 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ivory backdrop-blur-sm">
              {p.label}
            </span>
          </div>
        ))}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-night/45 to-transparent"
          aria-hidden="true"
        />
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-2xl font-bold text-forest-deep">{story.name}</h3>
        <p className="mt-1 text-xs font-bold uppercase tracking-wider text-moss">{story.tag}</p>
        <p className="mt-3 text-sm leading-relaxed text-charcoal/70">{story.body}</p>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
              animate={reduced ? { opacity: 1 } : { opacity: 1, height: "auto" }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
              transition={{ duration: reduced ? 0 : 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="space-y-3 pt-3">
                {story.fullStory.map((para, i) => (
                  <p key={i} className="text-sm leading-relaxed text-charcoal/70">
                    {para}
                  </p>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="mt-5 inline-flex items-center gap-1.5 self-start text-sm font-bold text-saffron-deep transition-colors hover:text-saffron"
        >
          {open ? "Show less" : "Read more"}
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
      </div>
    </article>
  );
}
