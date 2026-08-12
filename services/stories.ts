import { createStaticSupabase } from "@/lib/supabase/server";
import { storagePublicUrl } from "@/lib/config";
import { DEMO_STORIES, getDemoStory } from "@/lib/demo/stories";
import type { Story } from "@/types";

const STORY_SELECT = "*, story_media(*)";

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapStoryRow(row: any): Story {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? "",
    category: row.category,
    animalSlug: row.animal_slug ?? undefined,
    readMinutes: row.read_minutes ?? 4,
    publishedAt: row.published_at,
    author: row.author ?? "KGP PAWS",
    heroPalette: row.hero_palette ?? ["#173F35", "#0E2B23"],
    blocks: row.blocks ?? [],
    photos: (row.story_media ?? [])
      .slice()
      .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .filter((m: any) => m.kind !== "video" && m.storage_path)
      .map((m: any) => ({
        id: m.id,
        url: storagePublicUrl(m.storage_path)!,
        caption: m.caption ?? "",
      })),
    featured: row.featured ?? false,
    demo: row.is_demo ?? false,
  };
}

export async function listStories(): Promise<Story[]> {
  const supabase = createStaticSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("stories")
      .select(STORY_SELECT)
      .eq("status", "published")
      .order("published_at", { ascending: false });
    // Intentionally NOT gated on `data.length > 0` — see services/animals.ts
    // for why: a real, legitimately empty result must never fall back to
    // fictional demo stories on a connected production database. The same must
    // hold on an ERROR: a transient DB failure returning DEMO_STORIES would
    // present fictional rescues as real published stories. Empty, not invented.
    if (!error && data) return data.map(mapStoryRow);
    console.error("[stories] listStories query failed:", error?.message);
    return [];
  }
  return DEMO_STORIES;
}

export async function getStory(slug: string): Promise<Story | undefined> {
  const supabase = createStaticSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("stories")
      .select(STORY_SELECT)
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (!error && data) return mapStoryRow(data);
    return undefined;
  }
  return getDemoStory(slug);
}
