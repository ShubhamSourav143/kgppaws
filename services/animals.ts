import { createStaticSupabase } from "@/lib/supabase/server";
import { DEMO_ANIMALS, getDemoAnimal, getDemoAnimalByToken } from "@/lib/demo/animals";
import { mapAnimalRow, PUBLIC_ANIMAL_SELECT as PUBLIC_SELECT } from "@/services/animal-mapper";
import type { Animal } from "@/types";

/**
 * Animals service — server-side reads.
 * Uses the cookie-free anon client so pages that only need public animal
 * data stay statically renderable (RSC → prerender + ISR). Reads are
 * scoped by RLS to `is_public = true` columns, so the anon session is
 * fine here. Live mode queries Supabase; demo mode returns the seed set.
 */

export async function listAnimals(): Promise<Animal[]> {
  const supabase = createStaticSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("animals")
      .select(PUBLIC_SELECT)
      .eq("is_public", true)
      .order("name");
    // Note: intentionally NOT gated on `data.length > 0`. Unlike CMS content
    // tables (services/content.ts), a legitimately empty result here means
    // "the shelter currently lists zero public animals" — a true state that
    // must render as "0 paws found," never silently swapped for fictional
    // demo animals on a connected production database. Falling back to
    // DEMO_ANIMALS is correct only when Supabase itself isn't configured.
    if (!error && data) return data.map(mapAnimalRow);
    // ...and the same rule has to hold for an ERROR, which is what the early
    // version of this function got wrong: falling through to the return below
    // meant a transient DB blip on a live deployment quietly replaced the real
    // shelter with seven fictional demo animals, presented as real adoptable
    // dogs. An empty list is honest; invented animals are not.
    console.error("[animals] listAnimals query failed:", error?.message);
    return [];
  }
  return DEMO_ANIMALS;
}

export async function getAnimal(slug: string): Promise<Animal | undefined> {
  const supabase = createStaticSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("animals")
      .select(PUBLIC_SELECT)
      .eq("slug", slug)
      .eq("is_public", true)
      .maybeSingle();
    if (!error && data) return mapAnimalRow(data);
    return undefined;
  }
  return getDemoAnimal(slug);
}

/** Resolve a QR token (from /p/{token}) to an animal — never exposes the DB UUID. */
export async function resolveQrToken(token: string): Promise<Animal | undefined> {
  const supabase = createStaticSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("qr_tags")
      .select("animal:animals(slug)")
      .eq("token", token)
      .eq("active", true)
      .maybeSingle<{ animal: { slug: string } | null }>();
    // The error was previously not destructured at all, so a transient lookup
    // failure was indistinguishable from "no such tag" — and /p/[token]
    // redirects the latter to /scan-not-found. Someone who has found a lost
    // dog and scanned its collar was told the tag is not registered. Logging
    // it at least makes the difference visible in the Vercel logs.
    if (error) {
      console.error("[animals] resolveQrToken lookup failed:", error.message);
      return undefined;
    }
    const slug = data?.animal?.slug;
    return slug ? getAnimal(slug) : undefined;
  }
  return getDemoAnimalByToken(token);
}
