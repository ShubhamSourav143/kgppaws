import Link from "next/link";
import { ArrowUpRight, HeartHandshake, ShieldCheck, Soup, Syringe } from "lucide-react";
import { Reveal, Stagger, Item } from "@/components/fx/Reveal";
import { TextReveal } from "@/components/fx/TextReveal";

const IMPACT_CHIPS = [
  { icon: Soup, amount: "₹150", text: "feeds a campus dog for a week" },
  { icon: Syringe, amount: "₹350", text: "covers an anti-rabies vaccine" },
  { icon: ShieldCheck, amount: "₹1,800", text: "funds a sterilization surgery" },
];

/** Dusk-gradient giving moment: honest impact chips and a clear ask. */
export function DonateCta() {
  return (
    <section
      aria-labelledby="donate-h"
      className="aurora relative overflow-hidden bg-gradient-to-b from-night via-night-soft to-forest-deep py-24 text-ivory sm:py-32"
    >
      <div className="container-page">
        <div className="max-w-2xl">
          <Reveal effect="fade">
            <p className="eyebrow mb-5 text-marigold">Fuel the care</p>
          </Reveal>
          <TextReveal
            as="h2"
            text="Kindness here is very, very concrete."
            className="text-balance font-display text-4xl font-bold leading-[1.05] sm:text-5xl"
          />
          <Reveal delay={0.15}>
            <p className="mt-6 text-lg leading-relaxed text-ivory/70">
              Every rupee is logged against a campaign and only counted once
              verified — you can trace exactly which paw it reached.
            </p>
          </Reveal>
        </div>

        <Stagger className="mt-10 grid gap-3 sm:grid-cols-3" gap={0.09}>
          {IMPACT_CHIPS.map((c) => (
            <Item key={c.amount} effect="rise">
              <p className="flex h-full items-center gap-4 rounded-2xl border border-ivory/10 bg-ivory/[0.05] px-5 py-4 backdrop-blur-sm">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-saffron/20 text-saffron-glow">
                  <c.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="text-sm text-ivory/85">
                  <strong className="font-display text-lg text-marigold">{c.amount}</strong>{" "}
                  {c.text}
                </span>
              </p>
            </Item>
          ))}
        </Stagger>
        <Reveal delay={0.15}>
          <p className="mt-3 text-xs text-ivory/40">
            Illustrative examples — each live campaign lists its actual, itemized costs.
          </p>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link
              href="/donate#give"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-saffron-deep via-saffron to-marigold px-8 py-4 font-bold text-ivory shadow-ember transition-all hover:brightness-105"
            >
              <HeartHandshake className="h-5 w-5" aria-hidden="true" />
              Donate
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
            </Link>
            <Link
              href="/adopt"
              className="inline-flex items-center gap-2 rounded-full border border-ivory/25 px-8 py-4 font-semibold text-ivory transition-colors hover:bg-ivory/10"
            >
              Adopt a paw
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
