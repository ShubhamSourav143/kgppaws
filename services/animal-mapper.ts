import { storagePublicUrl } from "@/lib/config";
import type { Animal } from "@/types";

/**
 * Maps a raw Supabase `animals` row (with embedded photos/medical/sightings/
 * qr_tags) to the app's Animal type.
 *
 * Kept in its own module, free of any Supabase/Next.js imports, so it can be
 * unit-tested as a pure function. This is exactly where the qr_token bug
 * lived (see docs/CHANGELOG.md, 2026-07-16): the mapper read a column that
 * doesn't exist on `animals` because the token actually lives on the
 * related `qr_tags` row.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
export function mapAnimalRow(row: any): Animal {
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
    photos: (row.animal_photos ?? [])
      .slice()
      .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((p: any) => ({
        // NOT falling back to created_at: that's row-insertion time, which for
        // a live upload is "whenever a volunteer got round to it" — showing it
        // as the photo's date would misrepresent when it was actually taken.
        // No known date is better shown as no date than a wrong one.
        id: p.id, caption: p.caption ?? "", date: p.taken_on ?? "",
        url: p.storage_path ? storagePublicUrl(p.storage_path) : undefined,
      })),
    // Sorted here rather than relying on PostgREST embedded ordering, so the
    // timeline reads newest-first regardless of insertion order.
    medicalTimeline: [
      ...(row.animal_medical_events ?? []).map((e: any) => ({
        id: e.id, date: e.event_date, type: e.event_type, title: e.title, note: e.public_note ?? undefined,
      })),
      ...(row.animal_vaccinations ?? []).map((v: any) => ({
        id: v.id, date: v.date_given, type: "vaccination", title: `Vaccination: ${v.vaccine}`, note: v.notes ?? undefined,
      })),
      ...(row.animal_sterilizations ?? []).map((s: any) => ({
        id: s.id, date: s.procedure_date, type: "sterilization", title: "Sterilization", note: s.notes ?? undefined,
      }))
    ].sort((a: any, b: any) => b.date.localeCompare(a.date)),
    sightings: (row.animal_sightings ?? [])
      .map((s: any) => ({
        id: s.id, date: s.seen_on, zoneId: s.zone_id, note: s.public_note ?? "",
      }))
      .sort((a: any, b: any) => b.date.localeCompare(a.date)),
    demo: false,
  };
}

/**
 * Columns the public animal pages may read. Enumerated rather than `*`.
 *
 * `*` used to be fine on the assumption that the column-level
 * `revoke select (internal_note) …` statements in migration 0001 kept the
 * staff-only columns out of an anon read. They do not: a column-level REVOKE
 * cannot subtract from a table-level GRANT — a fact this schema documents at
 * 0001_initial_schema.sql:706 and works around correctly for INSERT, but not
 * for SELECT. So every visitor's page payload carried `animals.internal_note`
 * ("volunteers/admins only") and `animal_medical_events.internal_note`
 * ("never exposed publicly"), whether or not the UI rendered them.
 *
 * mapAnimalRow() never reads either column, so listing columns explicitly is
 * behaviour-preserving. Migration 0014 closes the same hole at the database
 * level; this is the half that does not depend on a migration being applied.
 *
 * Adding a column to `animals` that the public pages need? Add it here too.
 */
const ANIMAL_PUBLIC_COLUMNS = [
  "id", "paws_id", "slug", "name", "species", "sex", "age_label", "color",
  "size", "zone_id", "tagline", "personality", "bio", "friendliness",
  "vaccinated", "sterilized", "health_status", "health_note",
  "last_health_update", "adoption_status", "good_with_people",
  "good_with_animals", "special_care", "emergency_note", "portrait",
  "is_public", "created_at", "updated_at",
].join(", ");

/** Public timeline entries. `internal_note` and `created_by` are staff-only. */
const MEDICAL_EVENT_PUBLIC_COLUMNS =
  "id, animal_id, event_date, event_type, title, public_note, created_at";

export const PUBLIC_ANIMAL_SELECT =
  `${ANIMAL_PUBLIC_COLUMNS}, animal_photos(*), animal_medical_events(${MEDICAL_EVENT_PUBLIC_COLUMNS}), animal_vaccinations(*), animal_sterilizations(*), animal_sightings(*), qr_tags(token, active)`;
