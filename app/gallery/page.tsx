import type { Metadata } from "next";
import { Camera } from "lucide-react";
import { GalleryExplorer, type GalleryItem } from "@/components/gallery/GalleryExplorer";
import { Reveal } from "@/components/fx/Reveal";
import { TextReveal } from "@/components/fx/TextReveal";
import { listAnimals } from "@/services/animals";
import { listStories } from "@/services/stories";
import { listMedia } from "@/lib/media";
import { IMAGE_FOLDERS, type MediaCollection } from "@/lib/image-config";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Life on four paws at IIT Kharagpur — rescues, recoveries, campus residents and the volunteers behind them, in photographs.",
  alternates: { canonical: "/gallery" },
};

const COLLECTION_CATEGORY: Partial<Record<MediaCollection, string>> = {
  [IMAGE_FOLDERS.gallery]: "Campus life",
  [IMAGE_FOLDERS.events]: "Events",
  [IMAGE_FOLDERS.transformation]: "Transformation",
  [IMAGE_FOLDERS.companions]: "Campus life",
  [IMAGE_FOLDERS.shelterResidents]: "Shelter residents",
  [IMAGE_FOLDERS.volunteer]: "Volunteers",
  [IMAGE_FOLDERS.adopt]: "Dogs",
  [IMAGE_FOLDERS.hero]: "Campus life",
};

const STORY_CATEGORY: Record<string, string> = {
  rescue: "Medical care",
  recovery: "Medical care",
  adoption: "Adoptions",
  "campus-paw": "Campus life",
  "volunteer-diary": "Volunteers",
  education: "Campus life",
};

export default async function GalleryPage() {
  const collections = Object.keys(COLLECTION_CATEGORY) as MediaCollection[];
  const [animals, stories, ...mediaLists] = await Promise.all([
    listAnimals(),
    listStories(),
    ...collections.map((c) => listMedia(c)),
  ]);

  const items: GalleryItem[] = [
    ...mediaLists.flat().map((m) => ({
      src: m.src,
      alt: m.alt,
      width: m.width,
      height: m.height,
      blurDataURL: m.blurDataURL,
      category: COLLECTION_CATEGORY[m.collection] ?? "Campus life",
    })),
    ...animals.flatMap((a) =>
      a.photos
        .filter((p) => p.url)
        .map((p) => ({
          src: p.url!,
          alt: p.caption || a.name,
          width: 1200,
          height: 1200,
          category: a.species === "cat" ? "Cats" : "Dogs",
        }))
    ),
    ...stories.flatMap((s) =>
      s.photos
        .filter((p) => p.url)
        .map((p) => ({
          src: p.url,
          alt: p.caption || s.title,
          width: 1200,
          height: 900,
          category: STORY_CATEGORY[s.category] ?? "Campus life",
        }))
    ),
  ];

  // de-dupe by src, stable order
  const seen = new Set<string>();
  const unique = items.filter((i) => !seen.has(i.src) && seen.add(i.src));
  const categories = [...new Set(unique.map((i) => i.category))].sort();

  return (
    <div className="bg-cream pb-24">
      {/* header */}
      <header className="aurora relative -mt-16 overflow-hidden bg-night pb-20 pt-32 text-ivory md:-mt-20 md:pt-40">
        <div className="container-page max-w-3xl">
          <Reveal effect="fade">
            <p className="eyebrow mb-5 inline-flex items-center gap-2 text-marigold">
              <Camera className="h-4 w-4" aria-hidden="true" />
              The KGP PAWS Gallery
            </p>
          </Reveal>
          <TextReveal
            as="h1"
            text="Ordinary campus days. Extraordinary lives."
            className="text-balance font-display text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl"
          />
          <Reveal delay={0.2}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ivory/70">
              Every photograph here is real — taken on this campus, of these
              animals, by the people who care for them.
            </p>
          </Reveal>
        </div>
      </header>

      <div className="container-wide mt-8">
        {unique.length > 0 ? (
          <GalleryExplorer items={unique} categories={categories} />
        ) : (
          <div className="mx-auto max-w-xl py-20 text-center">
            <span className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-gold-soft/50 text-saffron-deep">
              <Camera className="h-9 w-9" aria-hidden="true" />
            </span>
            <h2 className="font-display text-3xl font-bold text-forest-deep">
              The gallery is warming up.
            </h2>
            <p className="mt-4 leading-relaxed text-charcoal/70">
              Photographs land here automatically as volunteers upload them —
              rescues, recoveries, festival days and everyday campus life.
              Until then, our Instagram is bursting with them.
            </p>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-saffron-deep to-saffron px-7 py-3.5 font-bold text-ivory shadow-ember transition-transform hover:-translate-y-0.5"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" />
              </svg>
              @kgppaws on Instagram
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
