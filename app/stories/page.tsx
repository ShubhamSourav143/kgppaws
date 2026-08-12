import type { Metadata } from "next";
import {
  OurWorkHero,
  WorkSection,
  ShelterFamilySection,
  KnowledgeCentreSection,
  OurWorkFooterCta,
} from "@/components/our-work/OurWorkSections";
import { StoryCard } from "@/components/stories/StoryCard";
import { Reveal } from "@/components/motion/Reveal";
import { resolveOurWorkPhotos } from "@/lib/our-work/photos";
import { listStories } from "@/services/stories";

export const metadata: Metadata = {
  title: "Our Work",
  description:
    "A year of KGP PAWS on IIT Kharagpur's campus — feeding, rescue, sterilization, vaccination, chemotherapy, daily medical care and adoption, told through real photographs.",
  alternates: { canonical: "/stories" },
};

export default async function OurWorkPage() {
  const [{ shelter, sections, articles, heroShot }, stories] = await Promise.all([
    resolveOurWorkPhotos(),
    listStories(),
  ]);

  return (
    <div className="bg-cream">
      <OurWorkHero shot={heroShot} />

      <ShelterFamilySection members={shelter} />

      {sections.map((s) => (
        <WorkSection
          key={s.id}
          id={s.id}
          eyebrow={s.eyebrow}
          title={s.title}
          intro={s.intro}
          description={s.description}
          photos={s.photos}
          tone={s.tone}
          aspect={s.aspect}
        />
      ))}

      <KnowledgeCentreSection articles={articles} />

      {/*
        Rescue stories index. These /stories/[slug] articles previously had no
        inbound link from any public page, yet were advertised in sitemap.ts —
        so they were indexable but unreachable, and each article's "← All
        stories" link (which points here) led to a page that did not list them.
        Surfacing them here fixes both, using the existing StoryCard.
      */}
      {stories.length > 0 && (
        <section id="stories" className="border-t border-line bg-cream py-20 sm:py-28">
          <div className="container-page">
            <Reveal>
              <p className="eyebrow mb-4 text-saffron-deep">Rescue stories</p>
              <h2 className="max-w-2xl text-balance font-display text-3xl font-bold leading-tight text-forest-deep sm:text-4xl">
                The animals behind the work.
              </h2>
            </Reveal>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {stories.map((story) => (
                <StoryCard key={story.slug} story={story} />
              ))}
            </div>
          </div>
        </section>
      )}

      <OurWorkFooterCta />
    </div>
  );
}
