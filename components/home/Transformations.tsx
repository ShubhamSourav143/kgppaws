import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { BeforeAfter } from "@/components/fx/BeforeAfter";
import { Reveal } from "@/components/fx/Reveal";
import { TextReveal } from "@/components/fx/TextReveal";
import type { MediaAsset } from "@/lib/media";
import type { Story } from "@/types";

export interface TransformationPair {
  name: string;
  before: string;
  after: string;
  href?: string;
  caption?: string;
}

/**
 * Pairs `x--before.*` / `x--after.*` files from public/images/transformation,
 * then merges story photo pairs (first photo = before, last = after).
 */
export function buildTransformationPairs(
  media: MediaAsset[],
  stories: Story[]
): TransformationPair[] {
  const bySubject = new Map<string, { before?: string; after?: string }>();
  for (const m of media) {
    const match = m.src.match(/\/([^/]+)--(before|after)\.[^.]+$/i);
    if (!match) continue;
    const key = match[1];
    const entry = bySubject.get(key) ?? {};
    entry[match[2].toLowerCase() as "before" | "after"] = m.src;
    bySubject.set(key, entry);
  }

  const pairs: TransformationPair[] = [];
  for (const [key, v] of bySubject) {
    if (v.before && v.after) {
      pairs.push({
        name: key.replace(/[-_]+/g, " ").replace(/^\w/, (c) => c.toUpperCase()),
        before: v.before,
        after: v.after,
      });
    }
  }

  for (const s of stories) {
    if (s.category !== "recovery" && s.category !== "rescue") continue;
    const withUrl = s.photos.filter((p) => p.url);
    if (withUrl.length >= 2) {
      pairs.push({
        name: s.title,
        before: withUrl[0].url,
        after: withUrl[withUrl.length - 1].url,
        href: `/stories/${s.slug}`,
        caption: s.excerpt,
      });
    }
  }
  return pairs;
}

/** Transformation Thursday — the drag-to-heal moment. Renders only with real pairs. */
export function Transformations({ pairs }: { pairs: TransformationPair[] }) {
  if (pairs.length === 0) return null;
  const [primary, ...rest] = pairs;

  return (
    <section aria-labelledby="transform-h" className="overflow-hidden bg-cream py-24 sm:py-32">
      <div className="container-page grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div>
          <Reveal effect="fade">
            <p className="eyebrow mb-5 inline-flex items-center gap-2 text-saffron-deep">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Transformation Thursday
            </p>
          </Reveal>
          <TextReveal
            as="h2"
            text="Drag the light across. This is what care does."
            className="text-balance font-display text-3xl font-bold leading-[1.1] text-forest-deep sm:text-4xl lg:text-[2.75rem]"
          />
          <Reveal delay={0.15}>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-charcoal/75">
              {primary.caption ||
                "Every recovery starts as a report from someone who cared enough to stop. Slide between the day we met them and today."}
            </p>
          </Reveal>
          {primary.href && (
            <Reveal delay={0.25}>
              <Link
                href={primary.href}
                className="group mt-8 inline-flex items-center gap-2 font-bold text-saffron-deep transition-colors hover:text-saffron"
              >
                Read {primary.name}&rsquo;s full journey
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
              </Link>
            </Reveal>
          )}
        </div>

        <Reveal effect="scale" amount={0.3}>
          <BeforeAfter
            before={primary.before}
            after={primary.after}
            alt={primary.name}
            className="aspect-[4/3] w-full"
          />
        </Reveal>
      </div>

      {rest.length > 0 && (
        <div className="scroller-x container-page mt-10 gap-5 pb-2">
          {rest.slice(0, 4).map((p) => (
            <BeforeAfter
              key={p.name}
              before={p.before}
              after={p.after}
              alt={p.name}
              className="aspect-[4/3] w-[80vw] max-w-sm shrink-0 snap-center"
            />
          ))}
        </div>
      )}
    </section>
  );
}
