import type { Metadata } from "next";
import { ShieldCheck, ReceiptText } from "lucide-react";
import { listCampaigns } from "@/services/campaigns";
import { getDonateContent } from "@/services/content";
import { CampaignCard } from "@/components/donate/CampaignCard";
import { DonatePanel } from "@/components/donate/DonatePanel";
import { Reveal } from "@/components/motion/Reveal";
import { DemoNotice } from "@/components/ui/Section";
import { formatINR, formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Donate",
  description:
    "Small help. Real impact. Support campus feeding, emergency treatment, vaccination and sterilization for the animals of IIT Kharagpur — with full expense transparency.",
  alternates: { canonical: "/donate" },
};

export default async function DonatePage() {
  const [campaigns, content] = await Promise.all([
    listCampaigns(),
    getDonateContent()
  ]);
  const allExpenses = campaigns
    .flatMap((c) => c.expenses.map((e) => ({ ...e, campaign: c.title })))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 8);

  const intro = content.find(c => c.section === "intro");

  return (
    <div className="pb-24">
      <header className="aurora relative -mt-16 overflow-hidden bg-gradient-to-b from-night via-night-soft to-forest-deep pb-16 pt-32 text-ivory md:-mt-20 md:pt-40">
        <div className="container-page max-w-3xl">
          <p className="eyebrow mb-5 text-marigold">Fuel the care</p>
          <h1 className="text-balance font-display text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
            {intro?.title || "Small help. Real impact."}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ivory/70">
            {intro?.body}
          </p>
        </div>
      </header>

      <div className="container-page mt-12 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        {/* campaigns */}
        <div className="min-w-0 space-y-6">
          {campaigns.map((c, i) => (
            <Reveal key={c.slug} delay={Math.min(i * 0.06, 0.25)}>
              <CampaignCard campaign={c} />
            </Reveal>
          ))}
        </div>

        {/* donation panel */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <DonatePanel campaigns={campaigns} />

          {/* recent transparency ledger */}
          <section
            aria-labelledby="ledger-h"
            className="mt-8 rounded-3xl border border-line bg-parchment p-6 shadow-soft"
          >
            <h2
              id="ledger-h"
              className="flex items-center gap-2 font-display text-xl font-bold text-forest-deep"
            >
              <ReceiptText className="h-5 w-5 text-terracotta" aria-hidden="true" />
              Recent expenses
            </h2>
            <ul className="mt-4 space-y-3">
              {allExpenses.map((e) => (
                <li key={e.id} className="flex items-start justify-between gap-3 text-sm">
                  <div>
                    <p className="font-semibold text-charcoal/90">{e.label}</p>
                    <p className="text-xs text-moss">
                      {e.campaign} · {formatDate(e.date)}
                    </p>
                  </div>
                  <p className="shrink-0 font-bold text-forest-deep">{formatINR(e.amount)}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-moss">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Expense entries are published by admins from the operations
              dashboard. Donor identities are never shown publicly.
            </p>
            <DemoNotice className="mt-3" />
          </section>
        </aside>
      </div>
    </div>
  );
}
