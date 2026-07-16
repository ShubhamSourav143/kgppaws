import { createServerSupabase } from "@/lib/supabase/server";
import { DEMO_ANIMALS, getDemoAnimal, getDemoAnimalByToken } from "@/lib/demo/animals";
import type { Animal } from "@/types";

/**
 * Animals service — server-side reads.
 * Live mode queries Supabase (public-safe columns only, enforced by RLS);
 * demo mode returns the labelled seed dataset.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapAnimalRow(row: any): Animal {
  return {
    id: row.id,
    pawsId: row.paws_id,
    slug: row.slug,
    // The token lives in qr_tags, not on animals — an animal can have several
    // tags over time (lost tags get reissued), only one of which is active.
    qrToken: (row.qr_tags ?? []).find((t: any) => t.active)?.token ?? "",
    name: row.name,
    species: row.species,
    sex: row.sex ?? "unknown",
    ageLabel: row.age_label ?? "Unknown age",
    color: row.color ?? "",
    size: row.size ?? "medium",
    zoneId: row.zone_id ?? "main-building",
    tagline: row.tagline ?? "",
    personality: row.personality ?? [],
    bio: row.bio ?? "",
    friendliness: row.friendliness ?? "cautious",
    vaccinated: row.vaccinated ?? false,
    sterilized: row.sterilized ?? false,
    healthStatus: row.health_status ?? "healthy",
    healthNote: row.health_note ?? "",
    lastHealthUpdate: row.last_health_update ?? row.updated_at ?? "",
    adoption: row.adoption_status ?? "not_available",
    goodWithPeople: row.good_with_people ?? false,
    goodWithAnimals: row.good_with_animals ?? false,
    specialCare: row.special_care ?? false,
    emergencyNote: row.emergency_note ?? undefined,
    portrait: row.portrait ?? {
      from: "#E7D6BC", to: "#B08968", coat: "#A9744C", coatDark: "#7C5233",
      muzzle: "#F4EADB", ear: "floppy",
    },
    photos: (row.animal_photos ?? []).map((p: any) => ({
      id: p.id, caption: p.caption ?? "", date: p.taken_on ?? p.created_at ?? "",
    })),
    // Sorted here rather than relying on PostgREST embedded ordering, so the
    // timeline reads newest-first regardless of insertion order.
    medicalTimeline: (row.animal_medical_events ?? [])
      .map((e: any) => ({
        id: e.id, date: e.event_date, type: e.event_type, title: e.title, note: e.public_note ?? undefined,
      }))
      .sort((a: any, b: any) => b.date.localeCompare(a.date)),
    sightings: (row.animal_sightings ?? [])
      .map((s: any) => ({
        id: s.id, date: s.seen_on, zoneId: s.zone_id, note: s.public_note ?? "",
      }))
      .sort((a: any, b: any) => b.date.localeCompare(a.date)),
    demo: false,
  };
}

const PUBLIC_SELECT =
  "*, animal_photos(*), animal_medical_events(*), animal_sightings(*), qr_tags(token, active)";

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
      .maybeSingle();
    const slug = (data as any)?.animal?.slug;
    return slug ? getAnimal(slug) : undefined;
  }
  return getDemoAnimalByToken(token);
}
