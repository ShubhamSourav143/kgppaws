import type { ImpactMetrics, VolunteerTask, AdoptionApplication } from "@/types";

/**
 * DEMO SEED DATA — impact metrics are admin-editable configuration, never
 * hardcoded facts. The `note` is surfaced in the UI wherever these appear.
 */
export const DEMO_IMPACT: ImpactMetrics = {
  dogsSupported: 300,
  catsSupported: 30,
  vaccinated: 210,
  sterilized: 140,
  treated: 85,
  adopted: 22,
  asOf: "2026-06-30",
  note: "Demo values for illustration — editable from the admin dashboard.",
};

export const DEMO_VOLUNTEER_TASKS: VolunteerTask[] = [
  { id: "vt1", title: "Morning feeding round — stops 1–4", due: "2026-07-12", kind: "feeding", done: false },
  { id: "vt2", title: "Assess weak dog at Nalanda (report 00126)", due: "2026-07-11", kind: "rescue", done: false },
  { id: "vt3", title: "Transport Bunti to medicated bath", due: "2026-07-13", kind: "transport", done: false },
  { id: "vt4", title: "Photo update: Mishti recovery album", due: "2026-07-14", kind: "photo", done: true },
  { id: "vt5", title: "Update sightings log for gate area", due: "2026-07-15", kind: "admin", done: false },
];

export const DEMO_APPLICATIONS: AdoptionApplication[] = [
  {
    id: "APP-2026-0041",
    animalSlug: "laika",
    createdAt: "2026-07-01T10:00:00+05:30",
    status: "meet_scheduled",
    applicant: {
      name: "Demo User",
      email: "demo@kgppaws.org",
      phone: "+91 90000 00000",
      affiliation: "Research scholar",
    },
    living: { housing: "Campus quarters", ownOrRent: "Institute housing", householdAgrees: true, hasOutdoorSpace: true },
    experience: { hadPetsBefore: true, currentPets: "None", hoursAloneDaily: "3–4 hours" },
    motivation: "We lost our senior dog last year and our home has felt too quiet since.",
    demo: true,
  },
  {
    id: "APP-2026-0037",
    animalSlug: "percy",
    createdAt: "2026-06-20T15:30:00+05:30",
    status: "under_review",
    applicant: {
      name: "Demo User",
      email: "demo@kgppaws.org",
      phone: "+91 90000 00000",
      affiliation: "Faculty family",
    },
    living: { housing: "Apartment (off campus)", ownOrRent: "Own", householdAgrees: true, hasOutdoorSpace: false },
    experience: { hadPetsBefore: true, currentPets: "One senior cat", hoursAloneDaily: "5–6 hours" },
    motivation: "Our cat needs a calm companion, and Percy's profile reads like a match.",
    demo: true,
  },
];
