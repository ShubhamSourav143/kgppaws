/**
 * Knowledge Center — practical animal-care articles.
 *
 * Editorial content, not database records. These are reference pieces rather
 * than dated posts, so they live here with the rest of the page's writing.
 * `photo` is a filename stem resolved against the media manifest.
 *
 * NOTE: `summary` is the whole article for now — none of these have a body
 * page yet, so the cards deliberately do not link anywhere. When articles get
 * real pages, add an `href` and the cards become links with no other change.
 */

export const KNOWLEDGE_CATEGORIES = [
  "Dog Care",
  "Cat Care",
  "Health",
  "Environment",
  "Campus Animals",
  "Community",
] as const;

export type KnowledgeCategory = (typeof KNOWLEDGE_CATEGORIES)[number];

export interface Article {
  slug: string;
  title: string;
  category: KnowledgeCategory;
  summary: string;
  readMinutes: number;
  /** ISO date — cards sort newest first. */
  publishedAt: string;
  photo: string;
}

export const ARTICLES: Article[] = [
  {
    slug: "why-sterilization-matters",
    title: "Why Sterilization Matters",
    category: "Health",
    summary:
      "A single unsterilized pair can account for hundreds of descendants within a few years — almost all of them born on a roadside. Sterilization is not about fewer dogs; it is about fewer dogs born into hunger, territorial fighting and preventable disease.",
    readMinutes: 5,
    publishedAt: "2026-07-18",
    photo: "grid-06",
  },
  {
    slug: "distemper-explained",
    title: "Distemper Explained",
    category: "Health",
    summary:
      "Canine distemper starts looking like a mild cold and ends in seizures. It spreads through the air, has no cure once neurological signs appear, and is almost entirely preventable by the DHPP vaccine. Here is what to watch for and when to act.",
    readMinutes: 6,
    publishedAt: "2026-07-11",
    photo: "grid-03",
  },
  {
    slug: "rabies-awareness",
    title: "Rabies Awareness",
    category: "Health",
    summary:
      "Rabies is fatal once symptoms begin and entirely preventable before then. What to do in the first ten minutes after a bite, why washing the wound matters more than people think, and how campus vaccination protects humans as much as animals.",
    readMinutes: 4,
    publishedAt: "2026-07-04",
    photo: "grid-09",
  },
  {
    slug: "dog-skin-care",
    title: "Dog Skin Care",
    category: "Dog Care",
    summary:
      "Mange, ticks, hot spots and the monsoon fungal flare-ups that follow them. How to tell an irritation that will settle on its own from one that needs a vet, and why over-bathing a street dog usually makes things worse.",
    readMinutes: 5,
    publishedAt: "2026-06-27",
    photo: "grid-16",
  },
  {
    slug: "safe-feeding-tips",
    title: "Safe Feeding Tips",
    category: "Campus Animals",
    summary:
      "Chocolate, onions, cooked bones and mess leftovers heavy with masala all cause real harm. What is genuinely safe to share, why feeding in one consistent spot matters, and how to feed without creating conflict between groups.",
    readMinutes: 4,
    publishedAt: "2026-06-20",
    photo: "grid-15",
  },
  {
    slug: "clean-campus-benefits",
    title: "Why Clean Campuses Benefit Humans and Animals",
    category: "Environment",
    summary:
      "Open waste draws animals into roads and kitchens, concentrates disease, and turns a manageable population into a conflict. Waste management is animal welfare — the two problems have exactly the same solution.",
    readMinutes: 6,
    publishedAt: "2026-06-13",
    photo: "grid-04",
  },
  {
    slug: "seasonal-pet-care",
    title: "Seasonal Pet Care",
    category: "Dog Care",
    summary:
      "Kharagpur summers hit 45°C and the monsoon brings everything that thrives in standing water. Shade and water placement, paw burns on hot tarmac, monsoon ear infections, and the short winter that catches short-coated dogs out.",
    readMinutes: 5,
    publishedAt: "2026-06-06",
    photo: "grid-12",
  },
  {
    slug: "responsible-pet-ownership",
    title: "Responsible Pet Ownership",
    category: "Community",
    summary:
      "Adopting is a ten-to-fifteen year commitment that outlasts your degree. What that actually means for hostel students, what happens to animals abandoned at graduation, and the questions worth asking yourself before you say yes.",
    readMinutes: 7,
    publishedAt: "2026-05-30",
    photo: "grid-10",
  },
  {
    slug: "cat-care-basics",
    title: "Caring for Campus Cats",
    category: "Cat Care",
    summary:
      "Cats hide illness far better than dogs, so the signs are subtler: a change in grooming, in appetite, in where they choose to sit. What a healthy campus cat looks like, and the quiet signals that mean something is wrong.",
    readMinutes: 5,
    publishedAt: "2026-05-23",
    photo: "grid-07",
  },
];
