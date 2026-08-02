import Link from "next/link";
import { ArrowUpRight, BadgeCheck, HeartHandshake, MapPinned } from "lucide-react";
import { Reveal, Stagger, Item } from "@/components/fx/Reveal";
import { TextReveal } from "@/components/fx/TextReveal";

/**
 * "Who we are" — the introduction directly below the hero grid. Plain,
 * trustworthy Indian English; leads with the registered-non-profit fact and
 * the reach beyond the IIT Kharagpur campus. Server component; animation comes
 * from the fx/ leaf components.
 */

const TRUST = [
  {
    icon: BadgeCheck,
    title: "A registered non-profit",
    body: "The Kharagpur Pradyogiki Animal Welfare Society — a registered animal welfare society, run by students and volunteers.",
  },
  {
    icon: MapPinned,
    title: "The campus and beyond",
    body: "Our work is not limited to IIT Kharagpur. We support nearby campuses and the surrounding areas too.",
  },
  {
    icon: HeartHandshake,
    title: "Humane, lasting care",
    body: "We have taken the initiative to sterilize dogs in nearby campuses — responsible population management, done kindly.",
  },
];

export function Intro() {
  return (
    <section
      aria-labelledby="intro-h"
      className="relative overflow-hidden bg-cream py-24 sm:py-32"
    >
      <div
        aria-hidden="true"
        className="absolute -right-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,rgba(233,184,76,0.18),transparent_65%)]"
      />
      <div className="container-page relative grid gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-20">
        <div>
          <Reveal effect="fade">
            <p className="eyebrow mb-5 text-saffron-deep">Who we are</p>
          </Reveal>
          <TextReveal
            as="h2"
            text="Improving the lives of campus animals — and those beyond it."
            className="text-balance font-display text-3xl font-bold leading-[1.12] text-forest-deep sm:text-4xl lg:text-[2.75rem]"
          />
          <Reveal delay={0.15}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-charcoal/80">
              KGP PAWS — the Kharagpur Pradyogiki Animal Welfare Society — is a
              registered non-profit dedicated to improving the lives of campus
              animals. What began at IIT Kharagpur now reaches further: we
              rescue, treat, vaccinate and sterilize animals across nearby
              campuses and the surrounding areas too.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-charcoal/80">
              Responsible care also means responsible numbers. We have taken the
              initiative to sterilize dogs in neighbouring campuses — humane
              population management that means fewer animals born into hunger and
              disease, and a safer community for everyone who shares these roads.
            </p>
          </Reveal>
          <Reveal delay={0.25}>
            <Link
              href="/about"
              className="group mt-9 inline-flex items-center gap-2 font-bold text-saffron-deep transition-colors hover:text-saffron"
            >
              The full story of KGP PAWS
              <ArrowUpRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden="true"
              />
            </Link>
          </Reveal>
        </div>

        <Stagger className="flex flex-col gap-4" gap={0.09} delay={0.1}>
          {TRUST.map((t) => (
            <Item key={t.title} effect="rise">
              <div className="flex items-start gap-4 rounded-3xl border border-line bg-ivory p-5 shadow-card sm:p-6">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-saffron-deep to-saffron text-ivory shadow-ember">
                  <t.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold text-forest-deep">
                    {t.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-charcoal/70">
                    {t.body}
                  </p>
                </div>
              </div>
            </Item>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
