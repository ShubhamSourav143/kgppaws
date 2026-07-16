import { createServerSupabase } from "@/lib/supabase/server";
import { DEMO_ANIMALS, getDemoAnimal, getDemoAnimalByToken } from "@/lib/demo/animals";
import { mapAnimalRow, PUBLIC_ANIMAL_SELECT as PUBLIC_SELECT } from "@/services/animal-mapper";
import type { Animal } from "@/types";

/**
 * Animals service — server-side reads.
 * Live mode queries Supabase (public-safe columns only, enforced by RLS);
 * demo mode returns the labelled seed dataset.
 */

export async function listAnimals(): Promise<Animal[]> {
  const supabase = await createServerSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("animals")
      .select(PUBLIC_SELECT)
      .eq("is_public", true)
      .order("name");
    if (!error && data) return data.map(mapAnimalRow);
  }
  return DEMO_ANIMALS;
}

export async function getAnimal(slug: string): Promise<Animal | undefined> {
  const supabase = await createServerSupabase();
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
  const supabase = await createServerSupabase();
  if (supabase) {
    const { data } = await supabase
      .from("qr_tags")
      .select("animal:animals(slug)")
      .eq("token", token)
      .eq("active", true)
      .maybeSingle<{ animal: { slug: string } | null }>();
    const slug = data?.animal?.slug;
    return slug ? getAnimal(slug) : undefined;
  }
  return getDemoAnimalByToken(token);
}
