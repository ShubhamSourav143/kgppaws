import type { DonationCampaign } from "@/types";

/**
 * DEMO SEED DATA — fictional campaigns with clearly-labelled demo values.
 * In production, `raised` and `supporters` are computed exclusively from
 * verified donations (see /supabase/migrations — donations table + RLS).
 */
export const DEMO_CAMPAIGNS: DonationCampaign[] = [
  {
    id: "cmp-0001",
    slug: "90-days-of-campus-feeding",
    title: "90 Days of Campus Feeding",
    category: "feeding",
    story:
      "The 4:55 AM feeding rickshaw runs 365 days a year — nine stops, thirty kilograms of food, every campus dog fed before morning classes. This campaign funds one full quarter of the programme: rice, eggs, kibble, and cooking fuel.",
    goal: 30000,
    raised: 18400,
    supporters: 47,
    updates: [
      { id: "cu1", date: "2026-07-01", note: "June feeding complete — 30 days, zero missed rounds. July supplies purchased." },
      { id: "cu2", date: "2026-06-02", note: "Switched egg supplier to the campus co-op; slightly cheaper, much fresher." },
    ],
    expenses: [
      { id: "ce1", date: "2026-06-28", label: "Feeding supplies (rice, kibble, eggs)", amount: 7800 },
      { id: "ce2", date: "2026-06-12", label: "Cooking fuel refill", amount: 1100 },
      { id: "ce3", date: "2026-05-30", label: "Feeding supplies (rice, kibble)", amount: 6900 },
    ],
    active: true,
    demo: true,
  },
  {
    id: "cmp-0002",
    slug: "simbas-recovery-fund",
    title: "Simba's Recovery Fund",
    category: "recovery",
    animalSlug: "simba",
    story:
      "Simba's paw has healed — but his treatment was paid from the emergency float, and this fund replenishes it: wound care supplies, antibiotics, and follow-up checkups for him and the next animal who needs the same nine days of care.",
    goal: 12000,
    raised: 9200,
    supporters: 31,
    updates: [
      { id: "cu3", date: "2026-06-28", note: "Simba's final follow-up: fully recovered. Remaining funds stay in the treatment float." },
    ],
    expenses: [
      { id: "ce4", date: "2026-05-02", label: "Veterinary medicines", amount: 4200 },
      { id: "ce5", date: "2026-04-27", label: "Follow-up consultation", amount: 800 },
      { id: "ce6", date: "2026-04-19", label: "Wound dressing supplies", amount: 1350 },
    ],
    active: true,
    demo: true,
  },
  {
    id: "cmp-0003",
    slug: "vaccination-drive-2026",
    title: "Vaccination Drive 2026",
    category: "vaccination",
    story:
      "Annual anti-rabies vaccination is the single highest-impact thing we do — it protects every animal and every person on campus. This drive covers vaccines, cold-chain storage, and vet supervision for the full campus dog and cat population.",
    goal: 45000,
    raised: 21500,
    supporters: 63,
    updates: [
      { id: "cu4", date: "2026-06-15", note: "Phase 1 complete: hall-area dogs vaccinated. Phase 2 (market & gate areas) begins August." },
    ],
    expenses: [
      { id: "ce7", date: "2026-06-10", label: "Vaccine procurement (phase 1)", amount: 12600 },
      { id: "ce8", date: "2026-06-10", label: "Vet supervision, 2 camp days", amount: 3000 },
      { id: "ce9", date: "2026-05-28", label: "Cold-chain box & ice packs", amount: 1900 },
    ],
    active: true,
    demo: true,
  },
  {
    id: "cmp-0004",
    slug: "sterilization-support",
    title: "Sterilization Support",
    category: "sterilization",
    story:
      "Humane population management is a marathon. Each sterilization covers surgery, three days of post-operative care, and safe release back to the animal's own territory. Every procedure prevents dozens of puppies being born into hardship.",
    goal: 60000,
    raised: 24800,
    supporters: 39,
    updates: [
      { id: "cu5", date: "2026-06-20", note: "August camp scheduled — 12 animals on the list, including Muesli." },
    ],
    expenses: [
      { id: "ce10", date: "2026-05-18", label: "Surgical camp (6 animals)", amount: 15000 },
      { id: "ce11", date: "2026-05-21", label: "Post-op care supplies", amount: 2400 },
    ],
    active: true,
    demo: true,
  },
  {
    id: "cmp-0005",
    slug: "emergency-medical-fund",
    title: "Emergency Medical Fund",
    category: "emergency",
    story:
      "When a report comes in at midnight — a vehicle accident, a serious injury — treatment can't wait for fundraising. The emergency fund is the standing reserve that lets volunteers say yes immediately. It is the most important money we hold.",
    goal: 50000,
    raised: 31200,
    supporters: 88,
    updates: [
      { id: "cu6", date: "2026-07-05", note: "Fund used twice in June (details in expense log). Both animals recovering." },
    ],
    expenses: [
      { id: "ce12", date: "2026-06-22", label: "Emergency surgery — vehicle accident case", amount: 8500 },
      { id: "ce13", date: "2026-06-09", label: "Emergency treatment — poisoning case", amount: 3200 },
      { id: "ce14", date: "2026-05-30", label: "Vaccination (emergency intake)", amount: 3000 },
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
  recovery: "Recovery Care",
  emergency: "Emergency",
};
