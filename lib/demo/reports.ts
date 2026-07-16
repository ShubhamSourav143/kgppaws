import type { RescueReport } from "@/types";

/** DEMO SEED DATA — fictional rescue reports for demonstrating the tracking flow. */
export const DEMO_REPORTS: RescueReport[] = [
  {
    id: "PAWS-RESCUE-2026-00124",
    createdAt: "2026-07-08T18:42:00+05:30",
    animalType: "dog",
    problem: "injured",
    severity: "urgent",
    zoneId: "tech-market",
    locationNote: "Behind the tea stalls, near the cycle stand",
    description:
      "Brown dog limping badly on the back leg, not putting weight on it. Still eating but won't let anyone close.",
    status: "treatment_started",
    updates: [
      { id: "ru1", date: "2026-07-08T18:42:00+05:30", status: "reported", note: "Report received. Thank you for helping." },
      { id: "ru2", date: "2026-07-08T19:05:00+05:30", status: "volunteer_assigned", note: "Rescue volunteer assigned from the evening team." },
      { id: "ru3", date: "2026-07-08T19:30:00+05:30", status: "animal_located", note: "Animal located behind the market. Assessment done — suspected sprain." },
      { id: "ru4", date: "2026-07-09T10:15:00+05:30", status: "treatment_started", note: "Vet consultation complete. Anti-inflammatory course started; monitoring daily." },
    ],
    demo: true,
  },
  {
    id: "PAWS-RESCUE-2026-00121",
    createdAt: "2026-07-02T07:20:00+05:30",
    animalType: "cat",
    problem: "puppies_kittens_at_risk",
    severity: "moderate",
    zoneId: "vs-hall",
    locationNote: "Storeroom near the mess, ground floor",
    description: "Three kittens in the storeroom, mother not seen since yesterday.",
    status: "resolved",
    updates: [
      { id: "ru5", date: "2026-07-02T07:20:00+05:30", status: "reported", note: "Report received." },
      { id: "ru6", date: "2026-07-02T08:10:00+05:30", status: "volunteer_assigned", note: "Volunteer assigned." },
      { id: "ru7", date: "2026-07-02T09:00:00+05:30", status: "animal_located", note: "Kittens located, warm and healthy. Mother returned during check — she had relocated to feed." },
      { id: "ru8", date: "2026-07-04T18:00:00+05:30", status: "resolved", note: "Family stable, mother caring for kittens. Feeding support added to the VS Hall round." },
    ],
    demo: true,
  },
  {
    id: "PAWS-RESCUE-2026-00119",
    createdAt: "2026-06-28T22:50:00+05:30",
    animalType: "dog",
    problem: "vehicle_accident",
    severity: "emergency",
    zoneId: "main-gate",
    locationNote: "Main road, just inside the gate",
    description: "Dog hit by a two-wheeler, conscious but bleeding from the leg.",
    status: "monitoring",
    updates: [
      { id: "ru9", date: "2026-06-28T22:50:00+05:30", status: "reported", note: "Emergency report received." },
      { id: "ru10", date: "2026-06-28T23:05:00+05:30", status: "on_the_way", note: "Night response volunteer en route with first-aid kit." },
      { id: "ru11", date: "2026-06-28T23:25:00+05:30", status: "animal_located", note: "Bleeding controlled on site. Moved to the vet partner clinic." },
      { id: "ru12", date: "2026-06-29T11:00:00+05:30", status: "treatment_started", note: "X-ray clear — deep laceration, no fracture. Sutured, antibiotics started." },
      { id: "ru13", date: "2026-07-06T10:00:00+05:30", status: "monitoring", note: "Recovering at the shelter corner. Sutures out in 3 days." },
    ],
    demo: true,
  },
  {
    id: "PAWS-RESCUE-2026-00126",
    createdAt: "2026-07-10T21:15:00+05:30",
    animalType: "dog",
    problem: "sick",
    severity: "moderate",
    zoneId: "nalanda",
    locationNote: "Cycle stand, Nalanda complex",
    description: "Dog looks weak and is refusing food since morning, possibly fever.",
    status: "volunteer_assigned",
    updates: [
      { id: "ru14", date: "2026-07-10T21:15:00+05:30", status: "reported", note: "Report received. Thank you for helping." },
      { id: "ru15", date: "2026-07-10T21:40:00+05:30", status: "volunteer_assigned", note: "Morning-round volunteer will assess at first light and escalate if needed." },
    ],
    demo: true,
  },
];

export function getDemoReport(id: string) {
  return DEMO_REPORTS.find((r) => r.id.toLowerCase() === id.toLowerCase());
}

export const PROBLEM_LABELS: Record<RescueReport["problem"], string> = {
  injured: "Injured",
  sick: "Sick",
  unable_to_walk: "Unable to walk",
  bleeding: "Bleeding",
  vehicle_accident: "Vehicle accident",
  distressed: "Aggressive / distressed",
  puppies_kittens_at_risk: "Puppies or kittens at risk",
  other: "Other",
};

export const SEVERITY_LABELS: Record<RescueReport["severity"], string> = {
  emergency: "Emergency",
  urgent: "Urgent",
  moderate: "Moderate",
  low: "Low",
};
