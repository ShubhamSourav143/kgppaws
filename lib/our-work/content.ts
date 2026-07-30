import type { SlidePhoto } from "@/components/our-work/OurWorkSlideshow";

/**
 * Editorial content for the /stories ("Our Work") page.
 *
 * The page is a documentary tour of what KGP PAWS does on campus over a
 * full year. Photographs come from `public/images/` and are resolved by
 * the server component (see app/stories/page.tsx). All text on this page
 * is deliberately plain and un-dramatised — volunteers describing the
 * work, not marketing copy.
 */

export interface ShelterMember {
  slug: string;
  name: string;
  intro: string;
  journey: string;
  condition: string;
  /** Preferred filename stems for this dog's slideshow (looked up from the
   *  merged media pool). Extras get pulled in when photos are short. */
  photoKeys: string[];
  status: string;
  /** True for shelter family we have lost. Renders in the "In loving memory"
   *  subgroup with softer styling and the "Current condition" field relabelled
   *  to "Remembered for". */
  memoriam?: boolean;
  photos: SlidePhoto[];
}

export interface KnowledgeArticle {
  slug: string;
  title: string;
  category: string;
  summary: string;
  /** Preferred filename stem for the article cover. */
  photoKey: string;
  href?: string;
  photo?: SlidePhoto;
}

export interface WorkSectionContent {
  id: string;
  eyebrow: string;
  title: string;
  intro: string;
  description: string;
  /** Photo folder key(s) preferred for this section. */
  folders: string[];
  /** Filename stems this section owns first, before falling back to the pool. */
  photoKeys: string[];
  /** Target photograph count for the slideshow. */
  targetCount: number;
  tone?: "cream" | "parchment" | "mist" | "night";
  aspect?: "video" | "wide" | "square" | "portrait";
}

export const SHELTER_MEMBERS: Omit<ShelterMember, "photos">[] = [
  {
    slug: "bunti",
    name: "Bunti",
    status: "In our care",
    photoKeys: ["bunti", "story-01", "story-02", "grid-01", "grid-13"],
    intro:
      "Bunti became part of our shelter family when he was only two months old, after suffering a severe spinal injury near the Gas Godown Gate.",
    journey:
      "He was brought under our care straight after the rescue and has been with the shelter ever since. Regular physiotherapy and medication have helped him remain comfortable.",
    condition:
      "He cannot walk on his own, but he is cheerful, alert, and looked after every day by volunteers who know him well.",
  },
  {
    slug: "muesli",
    name: "Muesli",
    status: "In our care",
    photoKeys: ["muesli", "story-03", "story-04", "grid-02", "grid-14"],
    intro:
      "Muesli was found weak and underweight near the campus gate and has been part of our shelter family since her recovery.",
    journey:
      "She spent her first weeks with us regaining her strength, and now spends her days indoors with the other shelter dogs. She is fully vaccinated and sterilised.",
    condition:
      "Healthy, playful and fond of anyone carrying food. She is affectionate with other dogs and comfortable around people.",
  },
  {
    slug: "checker",
    name: "Checker",
    status: "In our care",
    photoKeys: ["shanti", "story-05", "story-06", "grid-05", "grid-06"],
    intro:
      "Checker joined the shelter family after a serious campus rescue and has been under our long-term care ever since.",
    journey:
      "He was treated and rehabilitated by our volunteer team, and has slowly settled into the shelter routine. He is fully vaccinated.",
    condition:
      "Stable and comfortable. He continues to receive daily care and attention from the volunteers he trusts.",
  },
  {
    slug: "sai",
    name: "Sai",
    status: "In our care",
    photoKeys: ["odin", "story-07", "story-08", "grid-07", "grid-15"],
    intro:
      "Sai was rescued from the campus after an injury made it unsafe for him to live on his own, and has stayed with the shelter since.",
    journey:
      "He recovered with regular treatment and now shares the shelter with the rest of the family. He is calm around the volunteers who feed and clean for him every day.",
    condition:
      "Healthy and settled. He is gentle by nature and prefers a quiet corner of the shelter to the busier spaces.",
  },
  {
    slug: "nami",
    name: "Nami",
    status: "In our care",
    photoKeys: ["laika", "story-09", "story-10", "grid-09", "grid-11"],
    intro:
      "Nami came into our care as a young dog after a health issue that meant she could not safely return to campus life.",
    journey:
      "Her treatment ran for several months, and she has been part of the shelter family since. She is vaccinated and sterilised.",
    condition:
      "Bright and affectionate. She recognises the daily volunteers and is comfortable being handled for feeding and care.",
  },
  {
    slug: "romeo",
    name: "Romeo",
    status: "In loving memory",
    memoriam: true,
    photoKeys: ["rocket", "story-11", "story-12", "grid-13", "grid-04"],
    intro:
      "Romeo was one of the shelter's long-standing residents and a familiar face to every batch of volunteers who passed through KGP PAWS.",
    journey:
      "He spent his years with the shelter family, cared for by generations of student volunteers. He passed away peacefully after a full life under our care.",
    condition:
      "Remembered as a calm, gentle presence at the shelter — the dog who taught many first-time volunteers how to be trusted.",
  },
  {
    slug: "three-leg",
    name: "3 Leg",
    status: "In loving memory",
    memoriam: true,
    photoKeys: ["odin", "story-05", "story-06", "grid-08", "grid-10"],
    intro:
      "3 Leg earned his name after losing a leg in a road accident on campus, and joined the shelter family once his surgery had healed.",
    journey:
      "He adapted quickly to life on three legs and continued to move around the shelter with the same energy as before. He remained with us until his final days.",
    condition:
      "Remembered for showing everyone what recovery actually looks like — patient, uncomplaining, and always ready for the next meal.",
  },
  {
    slug: "shanti",
    name: "Shanti",
    status: "In loving memory",
    memoriam: true,
    photoKeys: ["shanti", "story-07", "story-08", "grid-05", "grid-06"],
    intro:
      "Shanti was the unofficial dean of the Main Building steps for many years before joining the shelter in her senior years.",
    journey:
      "Generations of students knew her. She appeared in more convocation photos than some faculty members. In her final years the shelter became her home and the volunteers her people.",
    condition:
      "Remembered by every batch that walked past her post — dignified, patient, and never in a hurry.",
  },
];

export const WORK_SECTIONS: WorkSectionContent[] = [
  {
    id: "chemotherapy",
    eyebrow: "Long-term treatment",
    title: "Chemotherapy Care",
    intro:
      "Not every illness can be treated in a single visit. Some campus dogs need chemotherapy and long-term medical support.",
    description:
      "Every week, KGP PAWS volunteers coordinate treatment, transport dogs to veterinary hospitals, administer medicines, monitor recovery and continue follow-up care until the full course is completed. This kind of care runs for months and needs a steady team behind it.",
    folders: ["donation/medical", "stories"],
    photoKeys: [
      "medical-01",
      "medical-02",
      "medical-03",
      "story-05",
      "story-06",
      "story-07",
      "story-08",
      "grid-03",
      "grid-04",
    ],
    targetCount: 12,
    tone: "cream",
  },
  {
    id: "sterilization",
    eyebrow: "Population control",
    title: "Sterilization Programme",
    intro:
      "Sterilization is one of the most important animal welfare activities we carry out. It reduces suffering more than any other single programme we run.",
    description:
      "Every week, volunteers safely transport campus dogs to Kolkata for sterilization and post-operative care. Over the years, KGP PAWS has helped complete more than 400 sterilizations — improving the health of campus animals and helping keep the population stable and healthy.",
    folders: ["donation/sterilization", "stories"],
    photoKeys: [
      "ster-01",
      "ster-02",
      "ster-03",
      "story-09",
      "story-10",
      "grid-05",
      "grid-06",
      "grid-07",
    ],
    targetCount: 12,
    tone: "parchment",
  },
  {
    id: "rescue",
    eyebrow: "When the call comes",
    title: "Rescue & Rehabilitation",
    intro:
      "Every rescue begins with a phone call, a message, or someone on campus noticing an animal in need.",
    description:
      "Throughout the year, KGP PAWS rescues abandoned puppies, injured campus dogs and lost pet dogs found within IIT Kharagpur. After the rescue, every animal receives treatment, food, vaccination and rehabilitation. Wherever it is safe and possible, healthy rescued animals are responsibly adopted into loving homes.",
    folders: ["donation/rescue", "stories", "adopt"],
    photoKeys: [
      "story-11",
      "story-12",
      "story-05",
      "story-06",
      "laika",
      "rocket",
      "grid-08",
      "grid-09",
    ],
    targetCount: 9,
    tone: "cream",
  },
  {
    id: "feeding",
    eyebrow: "Every single day",
    title: "Feeding Programme",
    intro:
      "Campus life changes during vacations. When students leave IIT Kharagpur for the summer, winter and autumn breaks, many campus dogs lose their regular food sources.",
    description:
      "During these periods — and every other day of the year — KGP PAWS volunteers continue feeding approximately 350 campus dogs. The rounds go out in the morning and again in the evening, in rain or heat, so the animals never miss a meal.",
    folders: ["donation/feeding", "stories"],
    photoKeys: [
      "feed-01",
      "feed-02",
      "feed-03",
      "romi",
      "story-07",
      "story-08",
      "grid-10",
      "grid-11",
    ],
    targetCount: 10,
    tone: "parchment",
  },
  {
    id: "vaccination",
    eyebrow: "Prevention first",
    title: "Vaccination Programme",
    intro:
      "Regular vaccination protects both the animals and the campus community they live alongside.",
    description:
      "KGP PAWS conducts vaccination drives throughout the year to reduce the spread of rabies, distemper and other preventable diseases. A single vaccination in time can save an animal's life and prevent a serious health risk for anyone sharing the road with them.",
    folders: ["donation/vaccination", "stories"],
    photoKeys: [
      "vacc-01",
      "vacc-02",
      "vacc-03",
      "simba",
      "story-09",
      "grid-13",
      "grid-14",
      "grid-15",
    ],
    targetCount: 10,
    tone: "cream",
  },
  {
    id: "daily-medical",
    eyebrow: "Continuous work",
    title: "Daily Medical Care",
    intro:
      "This section represents the work that happens almost every day. Many of these cases never become rescue stories — they are simply part of caring for a campus of animals.",
    description:
      "Volunteers regularly help animals suffering from skin diseases, open wounds, maggot wounds, tick infestation, fractures, weakness, dehydration, fever, road accident injuries and general distress. Some cases need first aid on the spot. Others need transport to veterinary hospitals. Many require medicines, dressing changes and follow-up visits over several days or weeks.",
    folders: ["donation/medical", "stories", "adopt"],
    photoKeys: [
      "medical-01",
      "medical-02",
      "medical-03",
      "story-10",
      "story-11",
      "story-12",
      "odin",
      "bunti",
      "grid-01",
      "grid-02",
      "grid-08",
    ],
    targetCount: 12,
    tone: "parchment",
  },
];

export const KNOWLEDGE_ARTICLES: Omit<KnowledgeArticle, "photo">[] = [
  {
    slug: "why-sterilization-matters",
    title: "Why Sterilization Matters",
    category: "Health",
    summary:
      "Sterilization is not about fewer dogs — it is about fewer dogs born into hunger and disease. Here is why it is the single most humane thing we do.",
    photoKey: "ster-01",
  },
  {
    slug: "why-vaccination-is-important",
    title: "Why Vaccination Is Important",
    category: "Health",
    summary:
      "A single anti-rabies vaccine protects the animal and every person sharing the road with them. Simple, cheap, and one of the highest-impact things we do all year.",
    photoKey: "vacc-01",
  },
  {
    slug: "basic-first-aid-before-help-arrives",
    title: "Basic First Aid Before Help Arrives",
    category: "Emergency",
    summary:
      "What you can safely do in the first ten minutes after finding an injured animal, and what to avoid so you do not make things worse for the animal or yourself.",
    photoKey: "medical-01",
  },
  {
    slug: "what-to-do-if-you-find-an-injured-dog",
    title: "What To Do If You Find An Injured Dog",
    category: "Emergency",
    summary:
      "Step by step: approach carefully, keep distance if the animal is in pain, note the location precisely, and use the report form to get help on the way.",
    photoKey: "story-05",
  },
  {
    slug: "understanding-campus-dogs",
    title: "Understanding Campus Dogs",
    category: "Community",
    summary:
      "Campus dogs are not strays passing through — they are residents. How they behave, why territory matters to them, and how to share a lane peacefully.",
    photoKey: "grid-01",
  },
  {
    slug: "responsible-feeding-guidelines",
    title: "Responsible Feeding Guidelines",
    category: "Dog Care",
    summary:
      "What is safe to share, what is genuinely harmful, and why the where and when of feeding matters as much as the what.",
    photoKey: "feed-01",
  },
  {
    slug: "puppy-care-basics",
    title: "Puppy Care Basics",
    category: "Dog Care",
    summary:
      "Feeding, warmth, deworming and the vaccine schedule that gets a puppy through the first year. Simple guidance for anyone finding a litter on campus.",
    photoKey: "story-11",
  },
  {
    slug: "common-myths-about-street-dogs",
    title: "Common Myths About Street Dogs",
    category: "Community",
    summary:
      "Not all street dogs are aggressive. Not all are unwell. Clearing up the ideas that cause the most trouble for the animals and the people around them.",
    photoKey: "grid-08",
  },
  {
    slug: "adoption-vs-buying-a-pet",
    title: "Adoption vs Buying a Pet",
    category: "Adoption",
    summary:
      "Where the animals sold in shops actually come from, and why adopting a healthy campus dog gives you the same companion at a fraction of the cost.",
    photoKey: "muesli",
  },
];
