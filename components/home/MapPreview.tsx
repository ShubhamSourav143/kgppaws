import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/ui/Section";
import { ButtonLink } from "@/components/ui/Button";
import { CampusMap } from "@/components/map/CampusMap";
import { Map } from "lucide-react";
import type { Animal } from "@/types";

export function MapPreview({ animals }: { animals: Animal[] }) {
  return (
    <section className="bg-parchment py-20 sm:py-28" aria-labelledby="map-h">
      <div className="container-page">
        <Reveal>
          <SectionHeading
            eyebrow="Campus Paws Map"
            title="Nine zones. Dozens of residents."
            sub="Tap a paw marker to meet the animals of that corner of campus."
            align="center"
          />
        </Reveal>
        <Reveal delay={0.15}>
          <div className="mx-auto mt-12 max-w-4xl">
            <CampusMap animals={animals} compact />
          </div>
        </Reveal>
        <Reveal delay={0.25}>
          <div className="mt-8 text-center">
            <ButtonLink href="/map" size="lg">
              <Map className="h-4 w-4" aria-hidden="true" />
              Explore the Paws Map
            </ButtonLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
