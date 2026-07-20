import { NextResponse } from "next/server";
import { listAnimals } from "@/services/animals";
import { listStories } from "@/services/stories";

export const dynamic = "force-dynamic";

export interface SearchResult {
  type: "animal" | "story" | "page";
  title: string;
  subtitle: string;
  href: string;
  image?: string;
}

const PAGES: SearchResult[] = [
  { type: "page", title: "Adopt", subtitle: "Meet adoptable dogs & cats", href: "/adopt" },
  { type: "page", title: "Gallery", subtitle: "Photos from the field", href: "/gallery" },
  { type: "page", title: "Stories", subtitle: "Rescue & recovery stories", href: "/stories" },
  { type: "page", title: "Donate", subtitle: "Fund feeding, treatment & vaccination", href: "/donate" },
  { type: "page", title: "Volunteer", subtitle: "Join the KGP PAWS pack", href: "/volunteer" },
  { type: "page", title: "About", subtitle: "Who we are and why", href: "/about" },
  { type: "page", title: "Campus Paws Map", subtitle: "Where campus residents live", href: "/map" },
  { type: "page", title: "Report an Animal", subtitle: "60-second rescue report", href: "/report" },
  { type: "page", title: "FAQ", subtitle: "Common questions answered", href: "/faq" },
];

/** Simple substring relevance search across animals, stories, and static pages. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();

  if (!q) {
    return NextResponse.json({ results: [] satisfies SearchResult[] });
  }

  const [animals, stories] = await Promise.all([listAnimals(), listStories()]);

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

  return NextResponse.json({
    results: [...animalResults, ...storyResults, ...pageResults].slice(0, 20) satisfies SearchResult[],
  });
}
