import type { Metadata } from "next";
import { listStories } from "@/services/stories";
import { listMedia } from "@/lib/media";
import { INITIATIVES } from "@/lib/stories/our-work";
import { ARTICLES } from "@/lib/stories/knowledge";
import { KnowledgeCenter } from "@/components/stories/KnowledgeCenter";
import {
  StoriesHero,
  FeaturedStories,
  OurWork,
  BeforeAfterSection,
  HappyEndings,
  StoriesFinalCta,
  type Shot,
} from "@/components/stories/StorySections";

export const metadata: Metadata = {
  title: "Stories",
  description:
    "Every life has a story worth telling. Rescue journeys, our work, and practical animal care from the campus animals of IIT Kharagpur.",
  alternates: { canonical: "/stories" },
};

export default async function StoriesPage() {
  // Stories come from the backend untouched. Photography is resolved from the
  // filesystem media manifest — a story's own uploaded photo wins, and the
  // shared pool fills in behind it until real story photography exists.
  const [stories, adoptMedia, gridMedia] = await Promise.all([
    listStories(),
    listMedia("adopt"),
    listMedia("hero-grid"),
  ]);

  const byStem = new Map<string, Shot>();
  for (const m of [...adoptMedia, ...gridMedia]) {
    const file = m.src.split("/").pop() ?? "";
    const stem = file.replace(/\.[^.]+$/, "").split("--")[0].toLowerCase();
    if (stem && !byStem.has(stem)) {
      byStem.set(stem, { src: m.src, alt: m.alt, blurDataURL: m.blurDataURL });
    }
  }
  const pool = [...byStem.values()];
  const stemCovers = Object.fromEntries(byStem);

  /**
   * Cover for each story: its own first uploaded photo if it has one, else the
   * photo of the animal it is about, else a pool image chosen by position so
   * two stories never open with the same picture.
   */
  const storyCovers: Record<string, Shot | undefined> = {};
  stories.forEach((s, i) => {
    const own = s.photos.find((p) => p.url);
    if (own) {
      storyCovers[s.slug] = { src: own.url, alt: own.caption || s.title };
      return;
    }
    const byAnimal = s.animalSlug ? byStem.get(s.animalSlug) : undefined;
    storyCovers[s.slug] =
      byAnimal ?? (pool.length ? pool[(i * 3 + 1) % pool.length] : undefined);
  });

  // Featured first, then newest — the lead tile is whatever the team flagged.
  const ordered = stories
    .slice()
    .sort((a, b) =>
      a.featured === b.featured
        ? a.publishedAt < b.publishedAt
          ? 1
          : -1
        : a.featured
          ? -1
          : 1
    );

  /**
   * Before/after pairs. These are two different placeholder photographs, not
   * two moments of one animal — the repo has no real before/after photography
   * yet. The captions say so rather than implying a transformation that these
   * particular images do not show.
   */
  const baPairs =
    pool.length >= 12
      ? [
          {
            before: pool[4],
            after: pool[9],
            name: "Bunty",
            note: "Spinal injury to walking again — four months of daily physiotherapy. Illustrative photographs.",
          },
          {
            before: pool[6],
            after: pool[11],
            name: "Laika",
            note: "Six weeks of round-the-clock distemper nursing. Illustrative photographs.",
          },
        ]
      : [];

  return (
    <div className="bg-cream">
      {/* 1 · Hero */}
      <StoriesHero shot={pool[0]} />

      {/* 2 · Featured rescue stories */}
      <FeaturedStories stories={ordered} covers={storyCovers} />

      {/* 3 · Our work */}
      <OurWork initiatives={INITIATIVES} covers={stemCovers} />

      {/* 4 · Knowledge Center */}
      <KnowledgeCenter articles={ARTICLES} covers={stemCovers} />

      {/* 5 · Before & after */}
      <BeforeAfterSection pairs={baPairs} />

      {/* 6 · Happy endings */}
      <HappyEndings shots={pool.slice(2, 14)} />

      {/* 7 · Final CTA */}
      <StoriesFinalCta shot={pool[pool.length - 1]} />
    </div>
  );
}
