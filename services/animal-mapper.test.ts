import { describe, expect, it } from "vitest";
import { mapAnimalRow } from "@/services/animal-mapper";

/**
 * Regression tests for the bugs found while wiring up the live Supabase
 * backend (2026-07-16, see docs/CHANGELOG.md). Every case here maps
 * directly to a bug that shipped invisibly in demo mode and would have
 * broken in live mode.
 */

function baseRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "d3adbeef-0001-4a01-9c01-000000000001",
    paws_id: "PAWS-KGP-DOG-0012",
    slug: "simba",
    name: "Simba",
    species: "dog",
    ...overrides,
  };
}

describe("mapAnimalRow — qrToken (regression: animals.qr_token does not exist)", () => {
  it("reads the token from the active qr_tags row, not a non-existent column", () => {
    const row = baseRow({
      qr_tags: [{ token: "t7kd2mqx", active: true }],
    });
    expect(mapAnimalRow(row).qrToken).toBe("t7kd2mqx");
  });

  it("picks the ACTIVE tag when a reissued (inactive) tag also exists", () => {
    const row = baseRow({
      qr_tags: [
        { token: "old-lost-tag", active: false },
        { token: "new-reissued-tag", active: true },
      ],
    });
    expect(mapAnimalRow(row).qrToken).toBe("new-reissued-tag");
  });

  it("falls back to an empty string when there are no qr_tags at all", () => {
    const row = baseRow({ qr_tags: undefined });
    expect(mapAnimalRow(row).qrToken).toBe("");
  });

  it("falls back to an empty string when every tag has been deactivated", () => {
    const row = baseRow({
      qr_tags: [{ token: "old-lost-tag", active: false }],
    });
    expect(mapAnimalRow(row).qrToken).toBe("");
  });
});

describe("mapAnimalRow — medicalTimeline ordering", () => {
  it("sorts newest first regardless of input order", () => {
    const row = baseRow({
      animal_medical_events: [
        { id: "1", event_date: "2026-03-12", event_type: "vaccination", title: "Anti-rabies vaccination" },
        { id: "2", event_date: "2026-04-27", event_type: "recovery", title: "Recovered" },
        { id: "3", event_date: "2026-04-18", event_type: "injury", title: "Minor paw injury reported" },
      ],
    });
    const dates = mapAnimalRow(row).medicalTimeline.map((e) => e.date);
    expect(dates).toEqual(["2026-04-27", "2026-04-18", "2026-03-12"]);
  });

  it("returns an empty array when there are no medical events", () => {
    expect(mapAnimalRow(baseRow({ animal_medical_events: undefined })).medicalTimeline).toEqual([]);
  });
});

describe("mapAnimalRow — sightings ordering", () => {
  it("sorts newest first regardless of input order", () => {
    const row = baseRow({
      animal_sightings: [
        { id: "1", seen_on: "2026-01-01", zone_id: "main-gate" },
        { id: "2", seen_on: "2026-06-15", zone_id: "library" },
      ],
    });
    const dates = mapAnimalRow(row).sightings.map((s) => s.date);
    expect(dates).toEqual(["2026-06-15", "2026-01-01"]);
  });
});

describe("mapAnimalRow — defaults for optional columns", () => {
  it("fills in sensible defaults when optional fields are absent", () => {
    const animal = mapAnimalRow(baseRow());
    expect(animal.sex).toBe("unknown");
    expect(animal.ageLabel).toBe("Unknown age");
    expect(animal.healthStatus).toBe("healthy");
    expect(animal.adoption).toBe("not_available");
    expect(animal.vaccinated).toBe(false);
    expect(animal.sterilized).toBe(false);
    expect(animal.personality).toEqual([]);
    expect(animal.photos).toEqual([]);
    expect(animal.demo).toBe(false);
  });

  it("does not throw when photos/medical/sightings/qr_tags are all absent", () => {
    expect(() => mapAnimalRow(baseRow())).not.toThrow();
  });

  it("preserves real values instead of overwriting them with defaults", () => {
    const row = baseRow({
      sex: "male",
      vaccinated: true,
      sterilized: true,
      health_status: "under_treatment",
      adoption_status: "foster_needed",
    });
    const animal = mapAnimalRow(row);
    expect(animal.sex).toBe("male");
    expect(animal.vaccinated).toBe(true);
    expect(animal.sterilized).toBe(true);
    expect(animal.healthStatus).toBe("under_treatment");
    expect(animal.adoption).toBe("foster_needed");
  });
});
