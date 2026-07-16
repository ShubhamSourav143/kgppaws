import Link from "next/link";
import { Clock } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { STORY_CATEGORY_LABELS } from "@/lib/demo/stories";
import { formatDate, cn } from "@/lib/utils";
import type { Story } from "@/types";

/** Cinematic story cover card — gradient art direction per story. */
export function StoryCard({
  story,
  large = false,
  className,
}: {
  story: Story;
  large?: boolean;
  className?: string;
}) {
  const [from, to] = story.heroPalette;
  return (
    <Link
      href={`/stories/${story.slug}`}
      className={cn(
        "group relative flex flex-col justify-end overflow-hidden rounded-3xl p-6 text-cream shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift sm:p-8",
        large ? "min-h-[26rem]" : "min-h-[19rem]",
        className
      )}
      style={{ background: `linear-gradient(155deg, ${from}, ${to})` }}
    >
      {/* texture + vignette */}
      <div className="grain absolute inset-0" aria-hidden="true" />
      <div
        className="absolute inset-0 bg-gradient-to-t from-charcoal/55 via-transparent to-transparent transition-opacity duration-500 group-hover:opacity-80"
        aria-hidden="true"
      />
      {/* oversized ghost paw */}
      <svg
        viewBox="0 0 48 48"
        aria-hidden="true"
        className="absolute -right-8 -top-8 h-40 w-40 opacity-[0.08] transition-transform duration-700 group-hover:rotate-12"
        fill="currentColor"
      >
        <ellipse cx="14" cy="15" rx="5" ry="6.5" transform="rotate(-18 14 15)" />
        <ellipse cx="34" cy="15" rx="5" ry="6.5" transform="rotate(18 34 15)" />
        <ellipse cx="6.5" cy="26" rx="4.2" ry="5.5" transform="rotate(-32 6.5 26)" />
        <ellipse cx="41.5" cy="26" rx="4.2" ry="5.5" transform="rotate(32 41.5 26)" />
        <path d="M24 22c6.5 0 12 5.2 12 11.2 0 4.6-3.4 7.3-7.2 6.4-2-.5-3.4-.8-4.8-.8s-2.8.3-4.8.8c-3.8.9-7.2-1.8-7.2-6.4C12 27.2 17.5 22 24 22Z" />
      </svg>

      <div className="relative space-y-3">
        <div className="flex items-center gap-2">
          <Chip tone="sand">{STORY_CATEGORY_LABELS[story.category]}</Chip>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-cream/80">
            <Clock className="h-3 w-3" aria-hidden="true" />
            {story.readMinutes} min read
          </span>
        </div>
        <h3
          className={cn(
            "text-balance font-display font-bold leading-[1.12]",
            large ? "text-3xl sm:text-4xl" : "text-2xl"
          )}
        >
          {story.title}
        </h3>
        {large && (
          <p className="max-w-lg text-sm leading-relaxed text-cream/85">
            {story.excerpt}
          </p>
        )}
        <p className="text-xs text-cream/65">
          {story.author} · {formatDate(story.publishedAt)}
        </p>
      </div>
    </Link>
  );
}
