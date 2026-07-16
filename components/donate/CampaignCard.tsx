"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Users } from "lucide-react";
import { Progress } from "@/components/ui/Progress";
import { Chip } from "@/components/ui/Chip";
import { CAMPAIGN_CATEGORY_LABELS } from "@/lib/demo/campaigns";
import { formatINR, formatDate, pct } from "@/lib/utils";
import type { DonationCampaign } from "@/types";

export function CampaignCard({ campaign }: { campaign: DonationCampaign }) {
  const [open, setOpen] = useState(false);
  const percent = pct(campaign.raised, campaign.goal);

  return (
    <section
      id={campaign.slug}
      aria-labelledby={`c-${campaign.slug}`}
      className="scroll-mt-28 rounded-3xl border border-line bg-parchment p-6 shadow-soft sm:p-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Chip tone="mist">{CAMPAIGN_CATEGORY_LABELS[campaign.category]}</Chip>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-moss">
          <Users className="h-3.5 w-3.5" aria-hidden="true" />
          {campaign.supporters} supporters
        </span>
      </div>

      <h2
        id={`c-${campaign.slug}`}
        className="mt-3 font-display text-2xl font-bold text-forest-deep sm:text-3xl"
      >
        {campaign.title}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-charcoal/80 sm:text-base">
        {campaign.story}
      </p>

      <div className="mt-6 space-y-2">
        <Progress value={percent} label={`${campaign.title} funding progress`} />
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p>
            <strong className="font-display text-2xl text-forest-deep">
              {formatINR(campaign.raised)}
            </strong>{" "}
            <span className="text-sm text-moss">
              raised of {formatINR(campaign.goal)}
            </span>
          </p>
          <p className="text-sm font-bold text-terracotta-deep">{percent}%</p>
        </div>
      </div>

      {/* transparency drawer */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-forest underline-offset-4 hover:underline"
      >
        Updates & expense log
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-4 grid gap-6 border-t border-line pt-5 sm:grid-cols-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-moss">
                  Campaign updates
                </h3>
                <ul className="mt-3 space-y-3">
                  {campaign.updates.map((u) => (
                    <li key={u.id} className="text-sm">
                      <p className="text-xs font-bold text-terracotta-deep">
                        {formatDate(u.date)}
                      </p>
                      <p className="mt-0.5 leading-relaxed text-charcoal/80">{u.note}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-moss">
                  Where the money went
                </h3>
                <ul className="mt-3 space-y-2.5">
                  {campaign.expenses.map((e) => (
                    <li key={e.id} className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="text-charcoal/80">
                        {e.label}
                        <span className="block text-xs text-moss">{formatDate(e.date)}</span>
                      </span>
                      <span className="shrink-0 font-bold text-forest-deep">
                        {formatINR(e.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
