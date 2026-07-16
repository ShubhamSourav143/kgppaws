import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading, DemoNotice } from "@/components/ui/Section";
import { ButtonLink } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { Chip } from "@/components/ui/Chip";
import { CAMPAIGN_CATEGORY_LABELS } from "@/lib/demo/campaigns";
import { formatINR, pct } from "@/lib/utils";
import type { DonationCampaign } from "@/types";

/** Where support goes — transparent campaign cards, backend-fed values. */
export function DonationImpact({ campaigns }: { campaigns: DonationCampaign[] }) {
  return (
    <section className="bg-cream py-20 sm:py-28" aria-labelledby="donate-h">
      <div className="container-page">
        <Reveal>
          <SectionHeading
            eyebrow="Donation Impact"
            title="Small help. Real impact."
            sub="Not a black box — every campaign shows exactly what came in and where it went."
          />
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.slice(0, 3).map((c, i) => (
            <Reveal key={c.slug} delay={i * 0.1} className="h-full">
              <Link
                href={`/donate#${c.slug}`}
                className="group flex h-full flex-col gap-4 rounded-3xl border border-line bg-parchment p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
              >
                <div className="flex items-center justify-between">
                  <Chip tone="mist">{CAMPAIGN_CATEGORY_LABELS[c.category]}</Chip>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-moss">
                    <Users className="h-3.5 w-3.5" aria-hidden="true" />
                    {c.supporters} supporters
                  </span>
                </div>
                <h3 className="font-display text-2xl font-bold text-forest-deep">
                  {c.title}
                </h3>
                <p className="line-clamp-3 text-sm leading-relaxed text-moss">
                  {c.story}
                </p>
                <div className="mt-auto space-y-2 pt-2">
                  <Progress value={pct(c.raised, c.goal)} label={`${c.title} progress`} />
                  <p className="text-sm">
                    <strong className="font-display text-lg text-forest-deep">
                      {formatINR(c.raised)}
                    </strong>{" "}
                    <span className="text-moss">raised of {formatINR(c.goal)}</span>
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-sm font-bold text-terracotta-deep">
                  Support this
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2}>
          <div className="mt-10 flex flex-col items-center gap-3">
            <ButtonLink href="/donate" variant="accent" size="lg">
              Support a Paw
            </ButtonLink>
            <DemoNotice>
              Demo campaign values shown. In production, totals come only from
              verified donations.
            </DemoNotice>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
