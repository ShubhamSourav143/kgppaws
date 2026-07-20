import Link from "next/link";
import { ArrowUpRight, HeartPulse, Soup, Syringe } from "lucide-react";
import { AnimalPortrait } from "@/components/animals/Portrait";
import { Reveal, Stagger, Item } from "@/components/fx/Reveal";
import { TextReveal } from "@/components/fx/TextReveal";
import { Parallax } from "@/components/fx/Parallax";
import type { ContentSectionRow } from "@/services/content";
import type { Animal } from "@/types";

const PILLARS = [
  { icon: Soup, label: "Daily feeding rounds" },
  { icon: HeartPulse, label: "Rescue & treatment" },
  { icon: Syringe, label: "Vaccination & sterilization" },
];

/** Editorial "why we exist" — magazine split with a scrapbook portrait stack. */
export function Mission({
  cms,
  animals,
}: {
  cms?: ContentSectionRow;
  animals: Animal[];
}) {
  const [first, second] = animals;
  const title = cms?.title || "Campus animals live between systems. We're the system that catches them.";
  const body =
    cms?.body ||
    "A campus dog isn't a pet, and isn't quite a street dog either. She has a territory, a routine and hundreds of humans who know her name — but no single person responsible when she's hurt at midnight. KGP PAWS is that responsibility, organized.";

  return (
    <section aria-labelledby="mission-h" className="relative overflow-hidden bg-cream py-24 sm:py-32">
      <div
        aria-hidden="true"
        className="absolute -right-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,rgba(233,184,76,0.18),transparent_65%)]"
      />
      <div className="container-page grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
        <div>
          <Reveal effect="fade">
            <p className="eyebrow mb-5 text-saffron-deep">Why we exist</p>
          </Reveal>
          <TextReveal
            as="h2"
            text={title}
            className="text-balance font-display text-3xl font-bold leading-[1.12] text-forest-deep sm:text-4xl lg:text-[2.75rem]"
          />
          <Reveal delay={0.2}>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-charcoal/80">{body}</p>
          </Reveal>
          <Stagger className="mt-9 flex flex-wrap gap-3" gap={0.08} delay={0.1}>
            {PILLARS.map((p) => (
              <Item key={p.label} effect="scale">
                <span className="inline-flex items-center gap-2.5 rounded-full border border-forest/12 bg-ivory px-5 py-3 text-sm font-semibold text-forest shadow-soft">
                  <p.icon className="h-4 w-4 text-saffron-deep" aria-hidden="true" />
                  {p.label}
                </span>
              </Item>
            ))}
          </Stagger>
          <Reveal delay={0.3}>
            <Link
              href="/about"
              className="group mt-9 inline-flex items-center gap-2 font-bold text-saffron-deep transition-colors hover:text-saffron"
            >
              The full story of KGP PAWS
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
            </Link>
          </Reveal>
        </div>

        {/* scrapbook stack */}
        <div className="relative mx-auto h-[26rem] w-full max-w-sm lg:h-[30rem]" aria-hidden="true">
          {first && (
            <Parallax speed={-0.08} className="absolute left-0 top-4 w-64 -rotate-6 sm:w-72">
              <div className="paper rounded-2xl p-3 pb-12 shadow-lift">
                <span className="absolute -top-2.5 left-1/2 h-6 w-20 -translate-x-1/2 rotate-2 rounded-sm bg-gold-soft/80 shadow-sm" />
                <AnimalPortrait animal={first} photoUrl={first.photos.find((p) => p.url)?.url} className="aspect-square w-full overflow-hidden rounded-xl" />
                <p className="absolute bottom-3.5 left-0 right-0 text-center font-display text-lg italic text-charcoal/75">
                  {first.name} · {first.ageLabel}
                </p>
              </div>
            </Parallax>
          )}
          {second && (
            <Parallax speed={0.1} className="absolute bottom-0 right-0 w-56 rotate-4 sm:w-64">
              <div className="paper rounded-2xl p-3 pb-12 shadow-lift">
                <span className="absolute -top-2.5 left-1/2 h-6 w-20 -translate-x-1/2 -rotate-3 rounded-sm bg-sage/60 shadow-sm" />
                <AnimalPortrait animal={second} photoUrl={second.photos.find((p) => p.url)?.url} className="aspect-square w-full overflow-hidden rounded-xl" />
                <p className="absolute bottom-3.5 left-0 right-0 text-center font-display text-lg italic text-charcoal/75">
                  {second.name} · {second.zoneId.replace(/-/g, " ")}
                </p>
              </div>
            </Parallax>
          )}
          <span className="absolute -left-6 bottom-24 font-display text-5xl italic text-saffron/60">✦</span>
        </div>
      </div>
    </section>
  );
}
