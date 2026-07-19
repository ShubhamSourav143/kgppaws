"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { StoryCard } from "@/components/stories/StoryCard";
import { STORY_CATEGORY_LABELS } from "@/lib/demo/stories";
import { cn } from "@/lib/utils";
import type { Story, StoryCategory } from "@/types";

const CATEGORIES: ("all" | StoryCategory)[] = [
  "all",
  "rescue",
  "recovery",
  "adoption",
  "campus-paw",
  "volunteer-diary",
  "education",
];

const TILTS = ["-rotate-1", "rotate-1", "rotate-0", "rotate-1", "-rotate-1", "rotate-0"];

export function StoriesGrid({ stories }: { stories: Story[] }) {
  const reduced = useReducedMotion();
  const [category, setCategory] = useState<"all" | StoryCategory>("all");

  const filtered = useMemo(
    () =>
      category === "all" ? stories : stories.filter((s) => s.category === category),
    [stories, category]
  );

  const [first, ...rest] = filtered;

  return (
    <div className="mt-10">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter stories by category">
        {CATEGORIES.map((c) => {
          const active = category === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={active}
              className={cn(
                "relative rounded-full px-4 py-2 text-xs font-bold transition-colors",
                active ? "text-ivory" : "border border-forest/20 text-forest hover:bg-mist"
              )}
            >
              {active && (
                <motion.span
                  layoutId={reduced ? undefined : "stories-pill"}
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-saffron-deep to-saffron shadow-ember"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative">
                {c === "all" ? "All Stories" : STORY_CATEGORY_LABELS[c]}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="paper mt-12 rounded-3xl border border-dashed border-forest/25 p-12 text-center text-moss">
          No stories in this category yet — the next one might be yours to report.
        </p>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={category}
            initial={reduced ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 grid gap-x-5 gap-y-8 md:grid-cols-2"
          >
            {first && <StoryCard story={first} large className="md:col-span-2" />}
            {rest.map((s, i) => (
              <StoryCard key={s.slug} story={s} tilt={TILTS[i % TILTS.length]} />
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
