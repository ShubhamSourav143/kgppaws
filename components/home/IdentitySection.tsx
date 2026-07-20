import Link from "next/link";
import { ArrowUpRight, QrCode, ScanLine, HeartPulse } from "lucide-react";
import { Tag3D } from "@/components/three/Tag3D";
import { Reveal, Stagger, Item } from "@/components/fx/Reveal";
import { TextReveal } from "@/components/fx/TextReveal";
import type { Animal } from "@/types";

const STEPS = [
  {
    icon: QrCode,
    title: "Every collar carries a QR",
    text: "Weatherproof tags link each animal to their living profile — identity that survives graduating batches.",
  },
  {
    icon: ScanLine,
    title: "One scan opens their story",
    text: "Health record, temperament, vaccination status, and exactly how to help — no app required.",
  },
  {
    icon: HeartPulse,
    title: "Care becomes continuous",
    text: "Vets and volunteers update the same record, so nothing about an animal's history is ever lost.",
  },
];

/** The flagship: PAWS Digital Animal Identity, with the collar tag in real 3D. */
export function IdentitySection({ animal }: { animal?: Animal }) {
  return (
    <section
      aria-labelledby="identity-h"
      className="relative overflow-hidden bg-gradient-to-b from-chakra-ink via-[#17395f] to-night py-24 text-ivory sm:py-32"
    >
      {/* starfield dots */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: "radial-gradient(rgba(253,251,246,0.5) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />
      <div className="container-page relative grid items-center gap-14 lg:grid-cols-2 lg:gap-10">
        <div>
          <Reveal effect="fade">
            <p className="eyebrow mb-5 text-gold-soft">The PAWS Digital Identity</p>
          </Reveal>
          <TextReveal
            as="h2"
            text="One scan. Their entire story."
            className="font-display text-4xl font-bold leading-[1.04] sm:text-5xl lg:text-6xl"
          />
          <Reveal delay={0.15}>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-ivory/70">
              This is what makes KGP PAWS different: campus animals aren&rsquo;t
              anonymous. Each one wears a collar tag that opens their profile —
              try dragging the tag.
            </p>
          </Reveal>

          <Stagger className="mt-10 space-y-6" gap={0.12}>
            {STEPS.map((s, i) => (
              <Item key={s.title} effect="slide-right">
                <div className="flex gap-5">
                  <div className="flex flex-col items-center">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-ivory/10 text-marigold backdrop-blur-sm">
                      <s.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    {i < STEPS.length - 1 && <span className="mt-2 w-px flex-1 bg-ivory/15" />}
                  </div>
                  <div className="pb-2">
                    <h3 className="font-display text-xl font-bold">{s.title}</h3>
                    <p className="mt-1.5 max-w-md text-sm leading-relaxed text-ivory/65">{s.text}</p>
                  </div>
                </div>
              </Item>
            ))}
          </Stagger>

          {animal && (
            <Reveal delay={0.2}>
              <Link
                href={`/animal/${animal.slug}`}
                className="group mt-9 inline-flex items-center gap-2 font-bold text-marigold transition-colors hover:text-gold-soft"
              >
                See {animal.name}&rsquo;s live profile
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
              </Link>
            </Reveal>
          )}
        </div>

        {animal && (
          <Reveal effect="scale" amount={0.3} className="relative">
            <div
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(232,129,58,0.25),transparent_65%)]"
            />
            <Tag3D
              name={animal.name}
              pawsId={animal.pawsId}
              qrToken={animal.qrToken}
              className="relative mx-auto h-[26rem] w-full max-w-md sm:h-[30rem]"
            />
            <p className="mt-2 text-center text-xs font-semibold uppercase tracking-[0.25em] text-ivory/45">
              Drag to spin · scan the back
            </p>
          </Reveal>
        )}
      </div>
    </section>
  );
}
