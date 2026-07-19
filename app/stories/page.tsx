import type { Metadata } from "next";
import { PenLine, BookOpen } from "lucide-react";
import { listStories } from "@/services/stories";
import { StoriesGrid } from "@/components/stories/StoriesGrid";
import { Reveal } from "@/components/fx/Reveal";
import { TextReveal } from "@/components/fx/TextReveal";
import { Magnetic } from "@/components/fx/Magnetic";
import { SITE } from "@/lib/config";

export const metadata: Metadata = {
  title: "Stories",
  description:
    "Rescue, recovery, adoption and campus-paw stories from IIT Kharagpur — told with the respect the animals deserve.",
  alternates: { canonical: "/stories" },
};

export default async function StoriesPage() {
  const stories = await listStories();

  return (
    <div className="bg-cream pb-24">
      {/* header */}
      <header className="aurora relative -mt-16 overflow-hidden bg-night pb-20 pt-32 text-ivory md:-mt-20 md:pt-40">
        <div className="container-page max-w-3xl">
          <Reveal effect="fade">
            <p className="eyebrow mb-5 inline-flex items-center gap-2 text-marigold">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              The scrapbook
            </p>
          </Reveal>
          <TextReveal
            as="h1"
            text="Second chances, written down."
            className="text-balance font-display text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl"
          />
          <Reveal delay={0.2}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ivory/70">
              Rescues, recoveries, adoptions and dispatches from the 4:55 AM
              feeding round — every page taped in by someone who was there.
            </p>
          </Reveal>
        </div>
      </header>

      <div className="container-page">
        <StoriesGrid stories={stories} />

        {/* share a story */}
        <section
          id="share"
          aria-labelledby="share-h"
          className="paper relative mt-20 scroll-mt-28 overflow-hidden rounded-[2rem] border border-line p-8 text-center shadow-soft sm:p-14"
        >
          <span
            aria-hidden="true"
            className="absolute -top-3 left-1/2 h-6 w-28 -translate-x-1/2 -rotate-1 rounded-sm bg-gold-soft/80 shadow-sm"
          />
          <PenLine className="mx-auto h-8 w-8 text-saffron-deep" aria-hidden="true" />
          <h2 id="share-h" className="mt-4 font-display text-3xl font-bold text-forest-deep sm:text-4xl">
            Know a campus paw with a story?
          </h2>
          <p className="mx-auto mt-4 max-w-lg font-display text-lg italic leading-relaxed text-charcoal/70">
            A dog who walks someone to class every day. A cat who adopted an
            entire hostel wing. The best pages of this scrapbook come from the
            campus itself.
          </p>
          <div className="mt-8">
            <Magnetic strength={0.25}>
              <a
                href={`mailto:${SITE.email}?subject=A%20story%20for%20KGP%20PAWS`}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-saffron-deep to-saffron px-8 py-4 font-bold text-ivory shadow-ember transition-transform hover:-translate-y-0.5"
              >
                Share a story
              </a>
            </Magnetic>
          </div>
        </section>
      </div>
    </div>
  );
}
