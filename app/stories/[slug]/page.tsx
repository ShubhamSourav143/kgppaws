import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Camera, Clock, Heart } from "lucide-react";
import { getStory, listStories } from "@/services/stories";
import { getAnimal } from "@/services/animals";
import { AnimalCard } from "@/components/animals/AnimalCard";
import { StoryCard } from "@/components/stories/StoryCard";
import { PhotoGallery } from "@/components/media/PhotoGallery";
import { Reveal } from "@/components/motion/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { StoryTimeline } from "@/components/stories/StoryTimeline";
import type { Shot } from "@/components/stories/StorySections";
import { listMedia } from "@/lib/media";
import { poolForSpecies } from "@/lib/demo/photo-pool";
import { STORY_CATEGORY_LABELS } from "@/lib/demo/stories";
import { formatDate } from "@/lib/utils";
import type { StoryBlock } from "@/types";

export async function generateStaticParams() {
  const stories = await listStories();
  return stories.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const story = await getStory(slug);
  if (!story) return { title: "Story not found" };
  return {
    title: story.title,
    description: story.excerpt,
    alternates: { canonical: `/stories/${story.slug}` },
    openGraph: {
      title: story.title,
      description: story.excerpt,
      type: "article",
      publishedTime: story.publishedAt,
    },
  };
}

function Block({ block }: { block: StoryBlock }) {
  switch (block.type) {
    case "h2":
      return (
        <h2 className="mt-12 font-display text-3xl font-bold text-forest-deep">
          {block.text}
        </h2>
      );
    case "quote":
      return (
        <figure className="relative my-12 pl-8">
          <span aria-hidden="true" className="absolute left-0 top-0 h-full w-1.5 rounded-full bg-gradient-to-b from-saffron to-marigold" />
          <span aria-hidden="true" className="absolute -left-2 -top-6 font-display text-7xl italic text-saffron/25">“</span>
          <blockquote className="font-display text-2xl font-medium italic leading-snug text-forest-deep sm:text-3xl">
            {block.text}
          </blockquote>
          {block.by && (
            <figcaption className="mt-4 text-sm font-bold uppercase tracking-wider text-saffron-deep">
              — {block.by}
            </figcaption>
          )}
        </figure>
      );
    case "image":
      return (
        <Reveal>
          <figure className="my-10">
            <div
              className="grain grid aspect-[16/9] place-items-center rounded-3xl shadow-soft"
              style={{
                background: `linear-gradient(150deg, ${block.palette[0]}, ${block.palette[1]})`,
              }}
            >
              <Camera className="h-9 w-9 text-parchment/70" aria-hidden="true" />
            </div>
            <figcaption className="mt-3 text-center text-sm text-moss">
              {block.caption}
            </figcaption>
          </figure>
        </Reveal>
      );
    case "timeline":
      return (
        <ol className="paper my-12 space-y-0 rounded-3xl border border-line p-6 shadow-soft sm:p-8">
          {block.items.map((item, idx) => (
            <li key={item.date + item.text} className="relative flex gap-5 pb-6 last:pb-0">
              <span className="flex flex-col items-center">
                <span className="mt-1 grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full bg-gradient-to-br from-saffron-deep to-marigold ring-4 ring-gold-soft/40" />
                {idx < block.items.length - 1 && <span className="mt-1 w-px flex-1 bg-line" />}
              </span>
              <span className="min-w-0 pb-1">
                <span className="block text-xs font-black uppercase tracking-wide text-saffron-deep">
                  {item.date}
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-charcoal/85">
                  {item.text}
                </span>
              </span>
            </li>
          ))}
        </ol>
      );
    default:
      return (
        <p className="mt-6 text-lg leading-[1.85] text-charcoal/85">
          {block.text}
        </p>
      );
  }
}

export default async function StoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const story = await getStory(slug);
  if (!story) notFound();

  const [animal, allStories, adoptMedia, gridMedia] = await Promise.all([
    story.animalSlug ? getAnimal(story.animalSlug) : Promise.resolve(undefined),
    listStories(),
    listMedia("adopt"),
    listMedia("hero-grid"),
  ]);
  const related = allStories.filter((s) => s.slug !== story.slug).slice(0, 2);

  // Photography for the hero and the journey. The story's own uploads win;
  // the shared pool fills in behind them until real story photos exist.
  const byStem = new Map<string, Shot>();
  for (const m of [...adoptMedia, ...gridMedia]) {
    const file = m.src.split("/").pop() ?? "";
    const stem = file.replace(/\.[^.]+$/, "").split("--")[0].toLowerCase();
    if (stem && !byStem.has(stem)) {
      byStem.set(stem, { src: m.src, alt: m.alt, blurDataURL: m.blurDataURL });
    }
  }
  const pool = [...byStem.values()];
  const own: Shot[] = story.photos
    .filter((p) => p.url)
    .map((p) => ({ src: p.url, alt: p.caption || story.title }));

  // Placeholder photography has to match the animal the story is about — a cat
  // in a dog's rescue journey reads as careless. Narrow the pool by species
  // whenever the story is tied to an animal we know.
  const speciesPool = animal
    ? poolForSpecies(
        pool.map((s) => s.src),
        animal.species
      )
        .map((src) => pool.find((s) => s.src === src))
        .filter((s): s is Shot => Boolean(s))
    : pool;
  const usablePool = speciesPool.length ? speciesPool : pool;

  const hero =
    own[0] ??
    (story.animalSlug ? byStem.get(story.animalSlug) : undefined) ??
    usablePool[0];

  // The journey is lifted out of the body so it can run full width; the rest
  // of the blocks still read as an article in the narrow column.
  const timelineSteps = story.blocks
    .filter((b): b is Extract<StoryBlock, { type: "timeline" }> => b.type === "timeline")
    .flatMap((b) => b.items);
  const bodyBlocks = story.blocks.filter((b) => b.type !== "timeline");
  const journeyShots = own.length > 1 ? own.slice(1) : usablePool.slice(1);

  return (
    <article>
      {/* cinematic hero */}
      <header
        className="grain relative -mt-16 overflow-hidden text-cream md:-mt-20"
        style={{
          background: `linear-gradient(160deg, ${story.heroPalette[0]}, ${story.heroPalette[1]})`,
        }}
      >
        {hero && (
          <div className="absolute inset-0" aria-hidden="true">
            <Image
              src={hero.src}
              alt=""
              fill
              preload
              sizes="100vw"
              placeholder={hero.blurDataURL ? "blur" : undefined}
              blurDataURL={hero.blurDataURL}
              className="anim-kenburns object-cover"
            />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-night via-night/60 to-night/35" aria-hidden="true" />
        <div className="container-page relative flex min-h-[72vh] flex-col justify-end pb-14 pt-32">
          <div className="flex flex-wrap items-center gap-3">
            <Chip tone="sand">{STORY_CATEGORY_LABELS[story.category]}</Chip>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-cream/85">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {story.readMinutes} min read
            </span>
          </div>
          <h1 className="mt-5 max-w-3xl text-balance font-display text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-6xl">
            {story.title}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-cream/85">
            {story.excerpt}
          </p>
          <p className="mt-5 text-sm font-semibold text-cream/70">
            {story.author} · {formatDate(story.publishedAt)}
          </p>
        </div>
      </header>

      {/* the journey — full width, between the hero and the article */}
      <StoryTimeline steps={timelineSteps} shots={journeyShots} title={story.title} />

      {/* body */}
      <div className="container-page grid gap-12 py-14 lg:grid-cols-[minmax(0,44rem)_1fr]">
        <div className="min-w-0">
          {bodyBlocks.map((block, i) => (
            <Block key={i} block={block} />
          ))}

          {story.photos.length > 0 && (
            <section aria-labelledby="story-photos-h" className="mt-12">
              <h2 id="story-photos-h" className="font-display text-2xl font-bold text-forest-deep">
                Photos from this story
              </h2>
              <div className="mt-5">
                <PhotoGallery photos={story.photos} fallbackPalette={story.heroPalette} />
              </div>
            </section>
          )}

          {/* contextual CTA */}
          <aside className="mt-14 rounded-3xl bg-forest p-8 text-center text-cream">
            <Heart className="mx-auto h-7 w-7 text-sand" aria-hidden="true" />
            {animal &&
            (animal.adoption === "available" ||
              animal.adoption === "foster_needed") ? (
              <>
                <p className="mt-3 font-display text-2xl font-bold">
                  {animal.name}&apos;s next chapter could be yours to write.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <ButtonLink href={`/adopt/apply/${animal.slug}`} variant="light" size="lg">
                    Adopt {animal.name}
                  </ButtonLink>
                  <ButtonLink href="/donate#give" variant="accent" size="lg">
                    Fund the next rescue
                  </ButtonLink>
                </div>
              </>
            ) : (
              <>
                <p className="mt-3 font-display text-2xl font-bold">
                  Stories like this one run on support like yours.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <ButtonLink href="/donate#give" variant="light" size="lg">
                    Donate
                  </ButtonLink>
                  <ButtonLink href="/volunteer" variant="accent" size="lg">
                    Volunteer
                  </ButtonLink>
                </div>
              </>
            )}
          </aside>
        </div>

        {/* sidebar */}
        <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
          {animal && (
            <div>
              <h2 className="eyebrow mb-4 text-terracotta-deep">
                The paw in this story
              </h2>
              <AnimalCard animal={animal} />
            </div>
          )}
          <div>
            <h2 className="eyebrow mb-4 text-terracotta-deep">Keep reading</h2>
            <div className="space-y-4">
              {related.map((s) => (
                <StoryCard key={s.slug} story={s} />
              ))}
            </div>
          </div>
        </aside>
      </div>

      <div className="border-t border-line bg-parchment py-10 text-center">
        <Link
          href="/stories"
          className="text-sm font-bold text-forest underline-offset-4 hover:underline"
        >
          ← All stories
        </Link>
      </div>
    </article>
  );
}
