import { NextResponse } from "next/server";
import { listAnimals } from "@/services/animals";
import { listStories } from "@/services/stories";
import { getFaq } from "@/services/content";

export const dynamic = "force-dynamic";

export interface SearchResult {
  type: "animal" | "story" | "page" | "faq";
  title: string;
  subtitle: string;
  href: string;
  image?: string;
}

const PAGES: SearchResult[] = [
  { type: "page", title: "Adopt", subtitle: "Meet adoptable dogs and cats", href: "/adopt" },
  { type: "page", title: "Stories", subtitle: "Rescue and recovery stories", href: "/stories" },
  { type: "page", title: "Donate", subtitle: "UPI QR — feeding, vaccination, sterilization and rescue", href: "/donate" },
  { type: "page", title: "Volunteer", subtitle: "Roles for veterinary, rescue, tech, design and social media", href: "/volunteer" },
  { type: "page", title: "About KGP PAWS", subtitle: "Who we are and how we work", href: "/about" },
  { type: "page", title: "FAQ", subtitle: "Common questions about adoption, donations and volunteering", href: "/about#faq" },
  { type: "page", title: "Campus Paws Map", subtitle: "Where the campus animals live", href: "/map" },
  { type: "page", title: "Report an Animal", subtitle: "Report a sick or injured animal on campus", href: "/report" },
  { type: "page", title: "Login", subtitle: "Sign in to your KGP PAWS account", href: "/login" },
  { type: "page", title: "Sign up", subtitle: "Create an account — pending admin approval", href: "/signup" },
];

/** Baseline FAQ items surfaced in search even when the CMS returns none —
 *  kept in sync with the About-page FAQ list so searching finds the same
 *  answers a visitor could scroll to. */
const FALLBACK_FAQS: { question: string; answer: string }[] = [
  {
    question: "What is KGP PAWS?",
    answer:
      "KGP PAWS (Kharagpur Pradyogiki Animal Welfare Society) is the student-led animal welfare society at IIT Kharagpur.",
  },
  {
    question: "Who can volunteer?",
    answer:
      "Any student, research scholar, faculty, staff or family member on campus. Roles include veterinary assistance, rescue, website development, PCB design, social media, poster design, video editing and general volunteer work.",
  },
  {
    question: "How can I adopt a campus animal?",
    answer:
      "Open the Adopt page, pick an animal and fill the short adoption form. A volunteer reviews every request personally.",
  },
  {
    question: "How are donations used?",
    answer:
      "Every rupee goes to the animals — feeding, vaccination, sterilization, emergency medical treatment and rescue operations. Volunteers work for free.",
  },
  {
    question: "Who takes care of injured animals?",
    answer:
      "Our volunteer rescue team responds to reports, gives first aid, coordinates vet visits and keeps the animal in care until recovery.",
  },
  {
    question: "Can I report a sick or injured dog?",
    answer:
      "Yes. Tap the floating Report button anywhere on the site, upload a photo and share the location — a volunteer will attend as soon as possible.",
  },
  {
    question: "Are campus dogs vaccinated?",
    answer:
      "We run anti-rabies drives every year and record vaccinated dogs. Their PAWS collar tag links to their vaccination history.",
  },
  {
    question: "How can I support KGP PAWS?",
    answer:
      "Donate, volunteer, or report animals that need help. Sharing our stories and posts also helps a lot.",
  },
];

/** Simple substring relevance search across animals, stories, and static pages. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();

  if (!q) {
    return NextResponse.json({ results: [] satisfies SearchResult[] });
  }

  const [animals, stories, faqRows] = await Promise.all([
    listAnimals(),
    listStories(),
    getFaq(),
  ]);
  // Prefer live CMS FAQ entries, fall back to the built-in list so search
  // still finds baseline answers on a fresh install.
  const faqs = faqRows.length > 0
    ? faqRows.map((r) => ({ question: r.question, answer: r.answer }))
    : FALLBACK_FAQS;

  const animalResults: SearchResult[] = animals
    .filter((a) =>
      [a.name, a.tagline, a.color, a.species, ...a.personality]
        .join(" ")
        .toLowerCase()
        .includes(q)
    )
    .slice(0, 6)
    .map((a) => ({
      type: "animal",
      title: a.name,
      subtitle: a.tagline,
      href: `/animal/${a.slug}`,
      image: a.photos.find((p) => p.url)?.url,
    }));

  const storyResults: SearchResult[] = stories
    .filter((s) => [s.title, s.excerpt, s.category].join(" ").toLowerCase().includes(q))
    .slice(0, 6)
    .map((s) => ({
      type: "story",
      title: s.title,
      subtitle: s.excerpt,
      href: `/stories/${s.slug}`,
      image: s.photos.find((p) => p.url)?.url,
    }));

  const pageResults = PAGES.filter((p) =>
    [p.title, p.subtitle].join(" ").toLowerCase().includes(q)
  );

  const faqResults: SearchResult[] = faqs
    .filter((f) => [f.question, f.answer].join(" ").toLowerCase().includes(q))
    .slice(0, 4)
    .map((f) => ({
      type: "faq",
      title: f.question,
      subtitle: f.answer.slice(0, 140) + (f.answer.length > 140 ? "…" : ""),
      href: "/about#faq",
    }));

  return NextResponse.json({
    results: [
      ...animalResults,
      ...storyResults,
      ...faqResults,
      ...pageResults,
    ].slice(0, 20) satisfies SearchResult[],
  });
}
