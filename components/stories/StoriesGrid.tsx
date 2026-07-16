"use client";

import { useMemo, useState } from "react";
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

export function StoriesGrid({ stories }: { stories: Story[] }) {
  const [category, setCategory] = useState<"all" | StoryCategory>("all");

  const filtered = useMemo(
    () =>
      category === "all"
        ? stories
        : stories.filter((s) => s.category === category),
    [stories, category]
  );

  const [first, ...rest] = filtered;

  return (
    <div className="mt-10">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter stories by category">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            aria-pressed={category === c}
            className={cn(
              "rounded-full px-4 py-2 text-xs font-bold transition-colors",
              category === c
                ? "bg-forest text-cream"
                : "border border-forest/20 text-forest hover:bg-mist"
            )}
          >
            {c === "all" ? "All Stories" : STORY_CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-12 rounded-3xl border border-dashed border-forest/25 bg-parchment p-12 text-center text-moss">
          No stories in this category yet — the next one might be yours to
          report.
        </p>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {first && (
            <StoryCard story={first} large className="md:col-span-2" />
          )}
          {rest.map((s) => (
            <StoryCard key={s.slug} story={s} />
          ))}
        </div>
      )}
    </div>
  );
}
