import type { DonationCampaign } from "@/types";

/**
 * DEMO SEED DATA — the four live KGP PAWS programmes, with clearly-labelled
 * demo figures for `raised` and `supporters`.
 *
 * In production these come from `campaigns_with_totals`, a view computed
 * exclusively from verified donations (see /supabase/migrations — donations
 * table + RLS). Nothing here is used once a database is connected.
 *
 * Long-form copy, impact tiers and photography for each programme live in
 * `lib/donate/editorial.ts` — presentation content keyed by slug, kept out of
 * the data layer so a real database row renders identically.
 */
export const DEMO_CAMPAIGNS: DonationCampaign[] = [
  {
    id: "cmp-0001",
    slug: "100-day-feeding-program",
    title: "100-Day Feeding Program",
    category: "feeding",
    story:
      "During the Summer, Winter and Autumn vacations the hostels and messes of IIT Kharagpur close their shutters, and the food that sustains more than 350 campus dogs simply disappears. For those hundred days our feeding rounds are the only meal they get.",
    goal: 320000,
    raised: 118400,
    supporters: 214,
    updates: [
      { id: "cu1", date: "2026-07-01", note: "Day 38 of the summer round — every stop covered, no missed mornings." },
      { id: "cu2", date: "2026-06-02", note: "Switched to the campus co-op for eggs and rice; cheaper per kilo, far fresher." },
    ],
    expenses: [
      { id: "ce1", date: "2026-06-28", label: "Feeding supplies — rice, kibble, eggs", amount: 22400 },
      { id: "ce2", date: "2026-06-12", label: "Cooking fuel refill", amount: 1100 },
      { id: "ce3", date: "2026-05-30", label: "Feeding supplies — rice, kibble", amount: 19200 },
    ],
    active: true,
    demo: true,
  },
  {
    id: "cmp-0002",
    slug: "campus-sterilization-program",
    title: "Campus Sterilization Program",
    category: "sterilization",
    story:
      "More than 500 sterilizations completed so far. Every week volunteers drive a small group of dogs to Kolkata and back — surgery, three days of post-operative care, then release to the exact spot they came from.",
    goal: 100000,
    raised: 47600,
    supporters: 132,
    updates: [
      { id: "cu3", date: "2026-06-20", note: "This week's transport: 6 dogs from the Tech Market and Nalanda areas. All recovered well." },
    ],
    expenses: [
      { id: "ce4", date: "2026-05-18", label: "Surgical camp — 6 animals", amount: 15000 },
      { id: "ce5", date: "2026-05-21", label: "Post-operative care supplies", amount: 2400 },
      { id: "ce6", date: "2026-05-09", label: "Transport to Kolkata partner clinic", amount: 3800 },
    ],
    active: true,
    demo: true,
  },
  {
    id: "cmp-0003",
    slug: "annual-vaccination-program",
    title: "Annual Vaccination Program",
    category: "vaccination",
    story:
      "Around 600 campus dogs are vaccinated every year against rabies and the DHPP group. It is the single highest-impact thing we do — one syringe protects the animal, and every student, staff member and visitor who shares the road with them.",
    goal: 130000,
    raised: 58900,
    supporters: 176,
    updates: [
      { id: "cu4", date: "2026-06-15", note: "Phase 1 complete: hall-area dogs vaccinated. Phase 2 (market & gate areas) begins August." },
    ],
    expenses: [
      { id: "ce7", date: "2026-06-10", label: "Vaccine procurement — phase 1", amount: 12600 },
      { id: "ce8", date: "2026-06-10", label: "Vet supervision, 2 camp days", amount: 3000 },
      { id: "ce9", date: "2026-05-28", label: "Cold-chain box & ice packs", amount: 1900 },
    ],
    active: true,
    demo: true,
  },
  {
    id: "cmp-0004",
    slug: "medical-emergency-fund",
    title: "Medical Emergency Fund",
    category: "emergency",
    story:
      "When a report comes in at midnight — a vehicle accident, a fracture, a dog that has stopped eating — treatment cannot wait for fundraising. This standing reserve is what lets a volunteer say yes immediately, at any hour.",
    goal: 50000,
    raised: 31200,
    supporters: 88,
    updates: [
      { id: "cu5", date: "2026-07-05", note: "Fund drawn on twice in June (details in the expense log). Both animals recovering." },
    ],
    expenses: [
      { id: "ce10", date: "2026-06-22", label: "Emergency surgery — vehicle accident case", amount: 8500 },
      { id: "ce11", date: "2026-06-09", label: "Emergency treatment — poisoning case", amount: 3200 },
      { id: "ce12", date: "2026-05-30", label: "Fracture plating & post-op care", amount: 6400 },
    ],
    active: true,
    demo: true,
  },
];

export function getDemoCampaign(slug: string) {
  return DEMO_CAMPAIGNS.find((c) => c.slug === slug);
}

export const CAMPAIGN_CATEGORY_LABELS: Record<DonationCampaign["category"], string> = {
  feeding: "Feeding",
  treatment: "Treatment",
  vaccination: "Vaccination",
  sterilization: "Sterilization",
  recovery: "Recovery",
  emergency: "Emergency",
};
