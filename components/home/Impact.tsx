import { Counter } from "@/components/motion/Counter";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading, DemoNotice } from "@/components/ui/Section";
import { formatDate } from "@/lib/utils";
import type { ImpactMetrics } from "@/types";
import type { ContentSectionRow } from "@/services/content";

/** Live impact — values come from admin-editable configuration, never hardcoded. */
export function Impact({ metrics, cms }: { metrics: ImpactMetrics, cms?: ContentSectionRow }) {
  const items = [
    { label: "Campus dogs supported", value: metrics.dogsSupported, suffix: "+" },
    { label: "Cats supported", value: metrics.catsSupported, suffix: "+" },
    { label: "Animals vaccinated", value: metrics.vaccinated, suffix: "" },
    { label: "Animals sterilized", value: metrics.sterilized, suffix: "" },
    { label: "Animals treated", value: metrics.treated, suffix: "" },
    { label: "Animals adopted", value: metrics.adopted, suffix: "" },
  ];

  return (
    <section className="bg-cream py-20 sm:py-24" aria-labelledby="impact-h">
      <div className="container-page">
        <Reveal>
          <header className="mx-auto max-w-2xl text-center">
            <SectionHeading
              eyebrow={cms?.subtitle ?? undefined}
              title={cms?.title ?? ""}
            />
          </header>
        </Reveal>
        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
          {items.map((item, i) => (
            <Reveal key={item.label} delay={i * 0.06}>
              <div className="text-center">
                <p className="font-display text-4xl font-bold text-forest-deep sm:text-5xl">
                  <Counter value={item.value} suffix={item.suffix} />
                </p>
                <p className="mt-2 text-xs font-bold uppercase tracking-wider text-moss">
                  {item.label}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="mt-10 text-center">
          <DemoNotice>
            Figures as of {formatDate(metrics.asOf)}. {metrics.note}
          </DemoNotice>
        </div>
      </div>
    </section>
  );
}
