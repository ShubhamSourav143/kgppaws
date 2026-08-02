import type { DonationCampaign } from "@/types";

/**
 * Editorial layer for the donate page — long-form copy, impact tiers and
 * photography for each programme, keyed by campaign slug.
 *
 * This is presentation content, deliberately kept out of `services/campaigns`
 * and the `DonationCampaign` type: money (goal, raised, supporters) always
 * comes from the backend, while the storytelling around it lives here. A
 * campaign row whose slug isn't listed still renders — `editorialFor()` falls
 * back to copy derived from its category — so connecting a real database
 * never leaves a blank section.
 */

export interface ImpactTier {
  amount: number;
  label: string;
}

export interface CampaignEditorial {
  eyebrow: string;
  /** One-line emotional summary, set larger than the body copy. */
  lede: string;
  points: string[];
  /** Optional fact strip, e.g. the daily running cost of the programme. */
  figures?: { label: string; value: string }[];
  tiers: ImpactTier[];
  /**
   * Filename stems resolved against the media manifest by the page.
   * These are the site's temporary placeholder photographs — the pool is
   * smaller than four galleries of ten, so stems repeat between programmes
   * while staying unique inside any one gallery. Replacing them with real
   * programme photography is a file swap; see public/images/adopt/README.md.
   */
  gallery: string[];
}

const FEEDING: CampaignEditorial = {
  eyebrow: "The hundred hungry days",
  lede:
    "When the campus empties, their food supply empties with it. For a hundred days a year we are the only thing standing between 350 dogs and an empty bowl.",
  points: [
    "During the Summer, Winter and Autumn vacations the hostels and messes of IIT Kharagpur close, and the leftovers that sustain the campus dogs disappear overnight.",
    "More than 350 dogs depend on the feeding rounds through these months — the rounds run every single morning, holidays included.",
    "Each round is cooked and distributed by volunteers across nine stops, from the Tech Market to the far gates.",
  ],
  figures: [
    { label: "Daily feeding cost", value: "₹3,200" },
    { label: "Dogs fed each day", value: "350+" },
    { label: "Days covered", value: "100" },
  ],
  tiers: [
    { amount: 320, label: "Feeds one group for a day" },
    { amount: 640, label: "Feeds two groups for a day" },
    { amount: 3200, label: "Sponsors one full day of feeding" },
    { amount: 22400, label: "Sponsors an entire week" },
  ],
  gallery: ["feed-04", "feed-05", "feed-06", "feed-07", "feed-08", "feed-09", "feed-10"],
};

const STERILIZATION: CampaignEditorial = {
  eyebrow: "Kindness that compounds",
  lede:
    "Over 500 sterilizations completed. Every week another small group makes the drive to Kolkata and comes home to the same street they were born on.",
  points: [
    "Prevents uncontrolled population growth, so the campus population stays stable and cared for rather than multiplying past what anyone can feed.",
    "Reduces suffering — fewer animals born into hunger, territorial fighting and disease.",
    "Reduces puppy mortality, which on the roadside is heartbreakingly high.",
    "Creates a healthier campus ecosystem for the animals and the people who share it.",
  ],
  figures: [
    { label: "Completed so far", value: "500+" },
    { label: "Transport", value: "Weekly to Kolkata" },
    { label: "Post-op care", value: "3 days" },
  ],
  tiers: [
    { amount: 500, label: "Post-operative care for one dog" },
    { amount: 2000, label: "One full sterilization" },
    { amount: 8000, label: "A week's transport for four dogs" },
    { amount: 20000, label: "An entire surgical camp" },
  ],
  gallery: ["ster-01", "ster-02", "ster-03", "ster-04", "ster-05", "ster-06", "ster-07", "ster-08"],
};

const VACCINATION: CampaignEditorial = {
  eyebrow: "One syringe, a whole campus",
  lede:
    "Around 600 campus dogs vaccinated every year. It is the highest-impact hour a volunteer can spend, and it protects the humans on this campus just as much as the animals.",
  points: [
    "Anti-Rabies — the vaccine that makes a bite a scare instead of a tragedy.",
    "DHPP — protection against distemper, hepatitis, parvovirus and parainfluenza, the diseases that quietly kill the most puppies.",
    "Protects dogs from illnesses that are agonising, expensive to treat and almost entirely preventable.",
    "Creates a demonstrably safer campus for students, staff, visitors and the animals themselves.",
  ],
  figures: [
    { label: "Dogs vaccinated yearly", value: "600" },
    { label: "Vaccines given", value: "Anti-Rabies · DHPP" },
    { label: "Cold chain", value: "Maintained end to end" },
  ],
  tiers: [
    { amount: 220, label: "Vaccinates one dog for a year" },
    { amount: 1100, label: "Vaccinates five dogs" },
    { amount: 5500, label: "A full hall-area round of 25" },
    { amount: 13000, label: "A tenth of the entire year's drive" },
  ],
  gallery: ["vacc-01", "vacc-02", "vacc-03"],
};

const EMERGENCY: CampaignEditorial = {
  eyebrow: "For the call that comes at midnight",
  lede:
    "Some injuries cannot wait for a fundraiser to finish. This reserve is what lets a volunteer say yes the moment the phone rings.",
  points: [
    "Accident recovery — the vehicle strikes that arrive without warning, usually after dark.",
    "Fractures, including the plating and pinning that give a leg back.",
    "Amputation and the long rehabilitation that follows it.",
    "Chemotherapy for the cancers that are treatable if caught early enough.",
    "Critical surgeries where the decision has to be made in minutes, not days.",
  ],
  figures: [
    { label: "Response time", value: "Same day" },
    { label: "Available", value: "Round the clock" },
    { label: "Every rupee", value: "Logged publicly" },
  ],
  tiers: [
    { amount: 500, label: "Dressings and antibiotics for one case" },
    { amount: 2500, label: "X-ray and diagnosis" },
    { amount: 8000, label: "Fracture plating for one dog" },
    { amount: 25000, label: "A full critical surgery" },
  ],
  gallery: ["medical-01", "medical-02", "medical-03"],
};

/**
 * Individual animal-specific appeals (campaign category "recovery" or
 * "treatment" — e.g. one dog's own surgery fundraiser) get their own
 * photography pool, separate from the standing Medical Emergency Fund
 * above. public/images/donation/rescue/ is empty until the org uploads
 * real rescue-operation photos; until then `galleryFor()` in
 * app/donate/page.tsx just renders nothing for these stems, the same way
 * any campaign gallery degrades gracefully when a file is missing.
 */
const RESCUE: CampaignEditorial = {
  ...EMERGENCY,
  eyebrow: "One animal, one rescue",
  gallery: ["rescue-01", "rescue-02", "rescue-03"],
};

const BY_SLUG: Record<string, CampaignEditorial> = {
  "100-day-feeding-program": FEEDING,
  "campus-sterilization-program": STERILIZATION,
  "annual-vaccination-program": VACCINATION,
  "medical-emergency-fund": EMERGENCY,
};

/** Category-level defaults, so an unrecognised slug still reads as intended. */
const BY_CATEGORY: Record<DonationCampaign["category"], CampaignEditorial> = {
  feeding: FEEDING,
  sterilization: STERILIZATION,
  vaccination: VACCINATION,
  emergency: EMERGENCY,
  treatment: RESCUE,
  recovery: RESCUE,
};

/**
 * Editorial content for a campaign. Falls back to its category so campaigns
 * created in the admin dashboard render with sensible copy and imagery until
 * someone writes their own.
 */
export function editorialFor(campaign: DonationCampaign): CampaignEditorial {
  return BY_SLUG[campaign.slug] ?? BY_CATEGORY[campaign.category] ?? EMERGENCY;
}
