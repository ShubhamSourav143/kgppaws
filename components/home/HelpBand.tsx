import Link from "next/link";
import { Clock, MapPin, Camera, Siren } from "lucide-react";
import { Reveal, Stagger, Item } from "@/components/fx/Reveal";
import { Magnetic } from "@/components/fx/Magnetic";
import type { ContentSectionRow } from "@/services/content";

const STEPS = [
  { icon: MapPin, text: "Tell us where — pick a campus zone" },
  { icon: Camera, text: "Add a photo if it's safe to take one" },
  { icon: Clock, text: "Volunteers are alerted in minutes" },
];

/** Urgent, unmissable — the 60-second report band. */
export function HelpBand({ cms }: { cms?: ContentSectionRow }) {
  return (
    <section
      aria-labelledby="help-h"
      className="relative overflow-hidden bg-gradient-to-br from-saffron-deep via-saffron to-marigold py-20 text-ivory sm:py-24"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            "radial-gradient(rgba(253,251,246,0.7) 1.5px, transparent 1.5px)",
          backgroundSize: "26px 26px",
        }}
      />
      <div className="container-page relative grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <Reveal effect="fade">
            <p className="eyebrow mb-4 text-ivory/85">
              {cms?.title || "Seen an animal in trouble?"}
            </p>
          </Reveal>
          <Reveal effect="blur">
            <h2 id="help-h" className="text-balance font-display text-4xl font-bold leading-[1.05] sm:text-5xl">
              {cms?.subtitle || "60 seconds. That's all a report takes."}
            </h2>
          </Reveal>
          <Stagger className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-6" gap={0.09}>
            {STEPS.map((s) => (
              <Item key={s.text} effect="rise">
                <p className="flex items-center gap-3 text-sm font-semibold text-ivory/90">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ivory/15 backdrop-blur-sm">
                    <s.icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  {s.text}
                </p>
              </Item>
            ))}
          </Stagger>
        </div>
        <Reveal effect="scale" className="lg:justify-self-end">
          <Magnetic strength={0.3}>
            <Link
              href="/report"
              className="inline-flex items-center gap-3 rounded-full bg-night px-9 py-5 text-lg font-bold text-ivory shadow-lift transition-all hover:-translate-y-0.5 hover:brightness-110 active:scale-95"
            >
              <Siren className="h-6 w-6 text-saffron-glow" aria-hidden="true" />
              {cms?.ctaLabel || "Report an animal now"}
            </Link>
          </Magnetic>
        </Reveal>
      </div>
    </section>
  );
}
