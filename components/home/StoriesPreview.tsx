import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/ui/Section";
import { ButtonLink } from "@/components/ui/Button";
import { StoryCard } from "@/components/stories/StoryCard";
import { ArrowRight } from "lucide-react";
import type { Story } from "@/types";

/** Stories of Second Chances — three featured rescue narratives. */
export function StoriesPreview({ stories }: { stories: Story[] }) {
  const [first, ...rest] = stories.slice(0, 3);
  if (!first) return null;

  return (
    <section className="bg-cream py-20 sm:py-28" aria-labelledby="stories-h">
      <div className="container-page">
        <Reveal>
          <SectionHeading
            eyebrow="Stories of Second Chances"
            title="Found injured. Treated. Recovered. Trusted humans again."
            sub="Real rescue, treatment and recovery stories — told with the respect they deserve."
          />
        </Reveal>

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <Reveal className="lg:row-span-2">
            <StoryCard story={first} large className="h-full" />
          </Reveal>
          {rest.map((s, i) => (
            <Reveal key={s.slug} delay={0.12 * (i + 1)}>
              <StoryCard story={s} />
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2}>
          <div className="mt-10 text-center">
            <ButtonLink href="/stories" variant="outline" size="lg">
              Read all stories
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
