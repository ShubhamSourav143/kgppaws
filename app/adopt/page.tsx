import type { Metadata } from "next";
import { PawPrint } from "lucide-react";
import { listAnimals } from "@/services/animals";
import { getAdoptionContent } from "@/services/content";
import { AdoptExplorer } from "@/components/adopt/AdoptExplorer";
import { Reveal } from "@/components/fx/Reveal";
import { TextReveal } from "@/components/fx/TextReveal";

export const metadata: Metadata = {
  title: "Adopt",
  description:
    "Maybe your best friend is waiting. Meet the adoptable dogs and cats of IIT Kharagpur — vaccinated, assessed, and full of personality.",
  alternates: { canonical: "/adopt" },
};

export default async function AdoptPage() {
  const [animals, content] = await Promise.all([
    listAnimals(),
    getAdoptionContent(),
  ]);

  const intro = content.find((c) => c.section === "intro");

  return (
    <div className="bg-cream pb-24">
      <header className="aurora relative -mt-16 overflow-hidden bg-night pb-16 pt-32 text-ivory md:-mt-20 md:pt-40">
        <div className="container-page max-w-3xl">
          <Reveal effect="fade">
            <p className="eyebrow mb-5 inline-flex items-center gap-2 text-marigold">
              <PawPrint className="h-4 w-4" aria-hidden="true" />
              Adopt or foster
            </p>
          </Reveal>
          <TextReveal
            as="h1"
            text={intro?.title || "Maybe your best friend is waiting."}
            className="text-balance font-display text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl"
          />
          <Reveal delay={0.2}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ivory/70">
              {intro?.body ||
                "Every adoptable paw here is vaccinated, temperament-assessed and cared for by volunteers who know them by name."}
            </p>
          </Reveal>
        </div>
      </header>

      <div className="container-page">
        <AdoptExplorer animals={animals} />
      </div>
    </div>
  );
}
