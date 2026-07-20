import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";
import { SmartImage } from "@/components/media/SmartImage";
import { STORY_CATEGORY_LABELS } from "@/lib/demo/stories";
import { formatDate, cn } from "@/lib/utils";
import type { Story } from "@/types";

const STICKERS: Record<string, string> = {
  rescue: "bg-saffron text-ivory",
  recovery: "bg-forest-bright text-ivory",
  adoption: "bg-chakra text-ivory",
  "campus-paw": "bg-marigold text-night",
  "volunteer-diary": "bg-earth text-ivory",
  education: "bg-sage text-night",
};

/** Scrapbook page: taped paper card with palette art or a real photo. */
export function StoryCard({
  story,
  large = false,
  tilt = "rotate-0",
  className,
}: {
  story: Story;
  large?: boolean;
  tilt?: string;
  className?: string;
}) {
  const photo = story.photos.find((p) => p.url);
  const [from, to] = story.heroPalette;

  return (
    <article
      className={cn(
        "group relative transition-transform duration-300 hover:z-10 hover:rotate-0 hover:scale-[1.02]",
        tilt,
        className
      )}
    >
      <Link
        href={`/stories/${story.slug}`}
        className={cn(
          "paper relative block h-full rounded-2xl p-3 shadow-card transition-shadow duration-300 hover:shadow-lift",
          large ? "sm:p-4" : ""
        )}
      >
        {/* tape */}
        <span
          aria-hidden="true"
          className="absolute -top-2.5 left-1/2 z-10 h-5 w-20 -translate-x-1/2 rotate-1 rounded-sm bg-gold-soft/80 shadow-sm"
        />

        {/* visual */}
        <div className={cn("relative overflow-hidden rounded-xl", large ? "aspect-[16/8]" : "aspect-[16/10]")}>
          {photo ? (
            <SmartImage
              src={photo.url}
              alt={photo.caption || story.title}
              fill
              sizes={large ? "(min-width: 1024px) 60rem, 100vw" : "(min-width: 768px) 28rem, 100vw"}
              className="h-full w-full"
              imgClassName="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div
              className="grain h-full w-full transition-transform duration-700 group-hover:scale-105"
              style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
              role="img"
              aria-label={`Illustrated cover for ${story.title}`}
            >
              <span className="absolute bottom-3 right-4 font-display text-6xl italic text-ivory/25">
                {story.title.charAt(0)}
              </span>
            </div>
          )}
          <span
            className={cn(
              "absolute left-3 top-3 -rotate-2 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm",
              STICKERS[story.category] ?? "bg-forest text-ivory"
            )}
          >
            {STORY_CATEGORY_LABELS[story.category] ?? story.category}
          </span>
        </div>

        {/* copy */}
        <div className={cn("px-2 pb-3 pt-4", large && "sm:px-4")}>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-moss">
            {formatDate(story.publishedAt)} ·{" "}
            <Clock className="-mt-0.5 inline h-3 w-3" aria-hidden="true" /> {story.readMinutes} min
          </p>
          <h3
            className={cn(
              "mt-2 text-balance font-display font-bold leading-snug text-forest-deep",
              large ? "text-2xl sm:text-4xl" : "text-xl"
            )}
          >
            {story.title}
          </h3>
          <p
            className={cn(
              "mt-2 font-display italic leading-relaxed text-charcoal/70",
              large ? "line-clamp-3 text-lg" : "line-clamp-2 text-[15px]"
            )}
          >
            {story.excerpt}
          </p>
          <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-saffron-deep">
            Read the story
            <ArrowUpRight
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden="true"
            />
          </span>
        </div>
      </Link>
    </article>
  );
}
