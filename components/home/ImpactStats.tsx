import { Dog, Cat, Syringe, Scissors, HeartPulse, Home } from "lucide-react";
import { Counter } from "@/components/fx/Counter";
import { Reveal, Stagger, Item } from "@/components/fx/Reveal";
import { TextReveal } from "@/components/fx/TextReveal";
import type { ContentSectionRow } from "@/services/content";
import type { ImpactMetrics } from "@/types";

/** Dark aurora band with odometer counters — the "numbers with a heartbeat". */
export function ImpactStats({
  metrics,
  cms,
}: {
  metrics: ImpactMetrics;
  cms?: ContentSectionRow;
}) {
  const STATS = [
    { icon: Dog, value: metrics.dogsSupported, label: "Dogs supported" },
    { icon: Cat, value: metrics.catsSupported, label: "Cats supported" },
    { icon: Syringe, value: metrics.vaccinated, label: "Vaccinated" },
    { icon: Scissors, value: metrics.sterilized, label: "Sterilized" },
    { icon: HeartPulse, value: metrics.treated, label: "Treated & healed" },
    { icon: Home, value: metrics.adopted, label: "Adopted home" },
  ];

  return (
    <section aria-labelledby="impact-h" className="aurora relative overflow-hidden bg-night py-24 text-ivory sm:py-32">
      <div className="container-page">
        <div className="max-w-2xl">
          <Reveal effect="fade">
            <p className="eyebrow mb-5 text-marigold">{cms?.title || "Impact, counted honestly"}</p>
          </Reveal>
          <TextReveal
            as="h2"
            text={cms?.subtitle || "Small hands. Big numbers."}
            className="font-display text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl"
          />
          <Reveal delay={0.2}>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-ivory/65">
              {cms?.body || metrics.note}
            </p>
          </Reveal>
        </div>

        <Stagger className="mt-14 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-6" gap={0.07}>
          {STATS.map((s) => (
            <Item key={s.label} effect="rise" className="h-full">
              <div className="group flex h-full flex-col gap-3 rounded-3xl border border-ivory/10 bg-ivory/[0.04] p-5 backdrop-blur-sm transition-colors duration-300 hover:border-chakra-glow/40 hover:bg-chakra/10 sm:p-6">
                <s.icon className="h-5 w-5 text-chakra-glow" aria-hidden="true" />
                <p className="font-display text-3xl font-bold tabular-nums text-ivory sm:text-4xl">
                  <Counter value={s.value} />
                </p>
                <p className="text-xs font-semibold uppercase tracking-wider text-ivory/55">
                  {s.label}
                </p>
              </div>
            </Item>
          ))}
        </Stagger>

        <Reveal delay={0.25}>
          <p className="mt-8 text-xs text-ivory/40">
            Updated {new Date(metrics.asOf).toLocaleDateString("en-IN", { month: "long", year: "numeric" })} · numbers maintained by society admins, never invented.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
