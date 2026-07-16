import { createServerSupabase } from "@/lib/supabase/server";
import { DEMO_STORIES, getDemoStory } from "@/lib/demo/stories";
import type { Story } from "@/types";

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
    featured: row.featured ?? false,
    demo: false,
  };
}

export async function listStories(): Promise<Story[]> {
  const supabase = await createServerSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("stories")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false });
    if (!error && data) return data.map(mapStoryRow);
  }
  return DEMO_STORIES;
}

export async function getStory(slug: string): Promise<Story | undefined> {
  const supabase = await createServerSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("stories")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (!error && data) return mapStoryRow(data);
    return undefined;
  }
  return getDemoStory(slug);
}
