import type { Metadata } from "next";
import { PenLine } from "lucide-react";
import { listStories } from "@/services/stories";
import { StoriesGrid } from "@/components/stories/StoriesGrid";
import { ButtonLink } from "@/components/ui/Button";
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
    <div className="container-page py-10 sm:py-14">
      <header className="max-w-2xl">
        <p className="eyebrow mb-3 text-terracotta-deep">Stories</p>
        <h1 className="text-balance font-display text-4xl font-bold leading-[1.05] text-forest-deep sm:text-5xl lg:text-6xl">
          Second chances, written&nbsp;down.
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-moss">
          Rescues, recoveries, adoptions and dispatches from the 4:55 AM
          feeding round.
        </p>
      </header>

      <StoriesGrid stories={stories} />

      {/* share a story */}
      <section
        id="share"
        aria-labelledby="share-h"
        className="mt-16 scroll-mt-28 rounded-3xl bg-forest p-8 text-center text-cream sm:p-12"
      >
        <PenLine className="mx-auto h-8 w-8 text-sand" aria-hidden="true" />
        <h2 id="share-h" className="mt-4 font-display text-3xl font-bold">
          Know a campus paw with a story?
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-cream/85">
          A dog who walks someone to class every day. A cat who adopted a
          hostel wing. Send it to us — the best stories come from the campus
          itself.
        </p>
        <div className="mt-6">
          <ButtonLink
            href={`mailto:${SITE.email}?subject=A%20story%20for%20KGP%20PAWS`}
            variant="light"
            size="lg"
          >
            Share a story
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
