"use client";

import Link from "next/link";
import { PawPrint, ScanLine, Smartphone, ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/ui/Section";
import { AnimalPortrait } from "@/components/animals/Portrait";
import { HealthChip, AdoptionChip } from "@/components/animals/chips";
import type { Animal } from "@/types";

/**
 * “One Scan. Their Entire Story.” — the QR journey demo:
 * physical dog → collar tag → phone scan → digital profile.
 */
export function ScanStory({ animal }: { animal: Animal }) {
  const steps = [
    {
      icon: PawPrint,
      title: "Meet a paw on campus",
      text: "Every supported animal wears a KGP PAWS collar.",
    },
    {
      icon: ScanLine,
      title: "Scan the collar tag",
      text: "Any phone camera reads the QR on their tag — no app needed.",
    },
    {
      icon: Smartphone,
      title: "Their story opens",
      text: "Name, health record, personality, how to help — instantly.",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-parchment py-20 sm:py-28" aria-labelledby="scanstory-h">
      <div className="container-page">
        <Reveal>
          <SectionHeading
            eyebrow="Paws Digital Identity"
            title="One Scan. Their Entire Story."
            sub="A collar tag turns a nameless street dog into someone you know. Scan it, and the campus introduces you properly."
            align="center"
          />
        </Reveal>

        <div className="mt-14 grid items-center gap-10 lg:grid-cols-[1fr_auto]">
          {/* steps */}
          <ol className="relative grid gap-8 sm:grid-cols-3">
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.12}>
                <li className="relative flex h-full flex-col items-start gap-3 rounded-3xl border border-line bg-cream p-6">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-forest text-cream">
                    <s.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="eyebrow text-[10px] text-terracotta-deep">
                    Step {i + 1}
                  </span>
                  <h3 className="font-display text-xl font-bold text-forest-deep">
                    {s.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-moss">{s.text}</p>
                </li>
              </Reveal>
            ))}
          </ol>

          {/* phone demo */}
          <Reveal delay={0.2} className="mx-auto">
            <Link
              href={`/animal/${animal.slug}?via=demo`}
              className="group block w-[240px] rounded-[2.6rem] border-[10px] border-charcoal bg-cream p-3 shadow-lift transition-transform hover:-translate-y-1.5"
              aria-label={`Open ${animal.name}'s digital profile — live demo`}
            >
              <div className="mx-auto mb-2 h-1.5 w-16 rounded-full bg-charcoal/20" />
              <AnimalPortrait animal={animal} className="aspect-square" />
              <div className="space-y-1.5 px-1 pb-1 pt-3">
                <div className="flex items-baseline justify-between">
                  <p className="font-display text-xl font-bold text-forest-deep">
                    {animal.name}
                  </p>
                  <span className="font-mono text-[9px] text-moss">{animal.pawsId}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  <HealthChip status={animal.healthStatus} />
                  <AdoptionChip status={animal.adoption} />
                </div>
                <p className="flex items-center gap-1 pt-1 text-xs font-bold text-terracotta-deep">
                  Open full profile
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </p>
              </div>
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
