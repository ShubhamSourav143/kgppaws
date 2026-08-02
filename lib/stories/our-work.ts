/**
 * "Our Work" — the six standing KGP PAWS initiatives, as editorial content.
 *
 * These are not database records: there is no initiatives table, and none is
 * needed. They are the society's permanent programmes, so they live here as
 * content alongside the copy that explains them. `photo` is a filename stem
 * resolved against the media manifest by the page.
 */

export interface Initiative {
  slug: string;
  title: string;
  /** What the programme actually does, in one plain sentence. */
  summary: string;
  /** The case for it — shown under a "Why it matters" label. */
  why: string;
  photo: string;
  /** Where "Learn more" goes. Every target is a page that already exists. */
  href: string;
  stat?: { value: string; label: string };
}

export const INITIATIVES: Initiative[] = [
  {
    slug: "feeding",
    title: "Feeding Program",
    summary:
      "Cooked meals on nine routes every morning of the year, and right through the vacations when the hostels and messes close their shutters.",
    why: "For a hundred days a year the campus empties and the food that sustains 350 dogs disappears with it. The rounds are the only meal they get.",
    photo: "romi",
    href: "/donate#campaigns",
    stat: { value: "350+", label: "fed daily" },
  },
  {
    slug: "sterilization",
    title: "Sterilization Program",
    summary:
      "Every week a small group is driven to a partner clinic in Kolkata for surgery, three days of post-operative care, and release to the exact spot they came from.",
    why: "Humane population control is the only lasting answer. Fewer animals born on the roadside means fewer born into hunger, fighting and disease.",
    photo: "shanti",
    href: "/donate#campaigns",
    stat: { value: "500+", label: "completed" },
  },
  {
    slug: "vaccination",
    title: "Vaccination Program",
    summary:
      "Around 600 campus dogs vaccinated every year against rabies and the DHPP group, with the cold chain maintained end to end.",
    why: "One syringe protects the animal and every student, staff member and visitor who shares the road with them. It is the highest-impact hour a volunteer can spend.",
    photo: "simba",
    href: "/donate#campaigns",
    stat: { value: "600", label: "every year" },
  },
  {
    slug: "medical-emergency",
    title: "Medical Emergency Care",
    summary:
      "Accidents, fractures, amputations, critical surgeries — treatment that starts the hour the call comes in, at any hour.",
    why: "Some injuries cannot wait for a fundraiser to finish. A standing reserve is what lets a volunteer say yes at two in the morning instead of asking the animal to wait.",
    photo: "odin",
    href: "/donate#campaigns",
    stat: { value: "24/7", label: "response" },
  },
  {
    slug: "adoption",
    title: "Adoption",
    summary:
      "Vaccinated, health-assessed and temperament-checked animals matched with families who are ready for them — and followed up afterwards.",
    why: "Every adoption frees a shelter space for the next rescue and quietly reduces the demand that drives breeding. Two lives change, not one.",
    photo: "laika",
    href: "/adopt",
    stat: { value: "Adopt", label: "don't shop" },
  },
  {
    slug: "awareness",
    title: "Awareness Campaigns",
    summary:
      "Orientation talks, hostel sessions and campus drives on how to approach a street dog, what to do about a bite, and who to call when an animal is hurt.",
    why: "Most conflict between people and campus animals comes from not knowing. A ten-minute conversation prevents far more suffering than any amount of treatment afterwards.",
    photo: "laika",
    href: "/volunteer",
    stat: { value: "Campus", label: "wide" },
  },
];
