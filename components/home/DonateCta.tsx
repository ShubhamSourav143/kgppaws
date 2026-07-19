import Link from "next/link";
import { ArrowUpRight, HeartHandshake, ShieldCheck, Soup, Syringe } from "lucide-react";
import { Counter } from "@/components/fx/Counter";
import { Reveal, Stagger, Item } from "@/components/fx/Reveal";
import { TextReveal } from "@/components/fx/TextReveal";
import type { DonationCampaign } from "@/types";

const IMPACT_CHIPS = [
  { icon: Soup, amount: "₹150", text: "feeds a campus dog for a week" },
  { icon: Syringe, amount: "₹350", text: "covers an anti-rabies vaccine" },
  { icon: ShieldCheck, amount: "₹1,800", text: "funds a sterilization surgery" },
];

/** Dusk-gradient giving moment: one highlighted campaign + honest impact chips. */
export function DonateCta({ campaigns }: { campaigns: DonationCampaign[] }) {
  const active = campaigns.filter((c) => c.active);
  const featured = [...active].sort((a, b) => b.raised / b.goal - a.raised / a.goal)[0];
  const pct = featured ? Math.min(100, Math.round((featured.raised / featured.goal) * 100)) : 0;

  return (
    <section
      aria-labelledby="donate-h"
      className="aurora relative overflow-hidden bg-gradient-to-b from-night via-night-soft to-forest-deep py-24 text-ivory sm:py-32"
    >
      <div className="container-page grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        <div>
          <Reveal effect="fade">
            <p className="eyebrow mb-5 text-marigold">Fuel the care</p>
          </Reveal>
          <TextReveal
            as="h2"
            text="Kindness here is very, very concrete."
            className="text-balance font-display text-4xl font-bold leading-[1.05] sm:text-5xl"
          />
          <Reveal delay={0.15}>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-ivory/70">
              Every rupee is logged against a campaign and only counted once
              verified — you can trace exactly which paw it reached.
            </p>
          </Reveal>

          <Stagger className="mt-9 space-y-3" gap={0.09}>
            {IMPACT_CHIPS.map((c) => (
              <Item key={c.amount} effect="slide-right">
                <p className="flex items-center gap-4 rounded-2xl border border-ivory/10 bg-ivory/[0.05] px-5 py-4 backdrop-blur-sm">
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
                href="/donate"
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-saffron-deep via-saffron to-marigold px-8 py-4 font-bold text-ivory shadow-ember transition-all hover:brightness-105"
              >
                <HeartHandshake className="h-5 w-5" aria-hidden="true" />
                Donate
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
              </Link>
              <Link
                href="/donate#sponsor"
                className="inline-flex items-center gap-2 rounded-full border border-ivory/25 px-8 py-4 font-semibold text-ivory transition-colors hover:bg-ivory/10"
              >
                Sponsor an animal
              </Link>
            </div>
          </Reveal>
        </div>

        {featured && (
          <Reveal effect="scale" amount={0.3}>
            <Link
              href={`/donate#${featured.slug}`}
              className="group block rounded-[2rem] border border-ivory/12 bg-ivory/[0.06] p-8 backdrop-blur-md transition-colors hover:border-marigold/40 sm:p-10"
            >
              <p className="eyebrow text-gold-soft/80">Live campaign</p>
              <h3 className="mt-4 font-display text-2xl font-bold leading-snug sm:text-3xl">
                {featured.title}
              </h3>
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ivory/65">
                {featured.story}
              </p>

              <div className="mt-8">
                <div className="flex items-baseline justify-between">
                  <p className="font-display text-3xl font-bold text-marigold">
                    ₹<Counter value={featured.raised} />
                  </p>
                  <p className="text-sm text-ivory/60">
                    of ₹{featured.goal.toLocaleString("en-IN")} · {featured.supporters} supporters
                  </p>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${featured.title} funding progress`}
                  className="mt-3 h-3 overflow-hidden rounded-full bg-ivory/10"
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-saffron-deep via-saffron to-marigold transition-[width] duration-1000 ease-out"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-2 text-xs font-bold text-saffron-glow">{pct}% funded</p>
              </div>

              <span className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-marigold">
                Support this campaign
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
              </span>
            </Link>
          </Reveal>
        )}
      </div>
    </section>
  );
}
