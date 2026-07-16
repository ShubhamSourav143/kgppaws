"use client";

import { useEffect, useState } from "react";
import { BadgeIndianRupee, Plus, ShieldAlert } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { Progress } from "@/components/ui/Progress";
import { Button } from "@/components/ui/Button";
import { DemoNotice } from "@/components/ui/Section";
import { DEMO_CAMPAIGNS, CAMPAIGN_CATEGORY_LABELS } from "@/lib/demo/campaigns";
import { getLocalDonations, type LocalDonationIntent } from "@/lib/local-store";
import { formatINR, formatDate, pct } from "@/lib/utils";
import type { CampaignExpense } from "@/types";

export default function AdminDonationsPage() {
  const [pledges, setPledges] = useState<LocalDonationIntent[]>([]);
  const [extraExpenses, setExtraExpenses] = useState<Record<string, CampaignExpense[]>>({});
  const [expenseForm, setExpenseForm] = useState<Record<string, { label: string; amount: string }>>({});

  useEffect(() => {
    setPledges(getLocalDonations());
  }, []);

  const addExpense = (slug: string) => {
    const f = expenseForm[slug];
    if (!f?.label.trim() || !Number(f.amount)) return;
    setExtraExpenses((e) => ({
      ...e,
      [slug]: [
        {
          id: `local-${Date.now()}`,
          date: new Date().toISOString().slice(0, 10),
          label: f.label.trim(),
          amount: Number(f.amount),
        },
        ...(e[slug] ?? []),
      ],
    }));
    setExpenseForm((f2) => ({ ...f2, [slug]: { label: "", amount: "" } }));
  };

  return (
    <div className="space-y-10">
      {/* verification queue */}
      <section aria-labelledby="verify-h">
        <h2 id="verify-h" className="flex items-center gap-2 font-display text-2xl font-bold text-forest-deep">
          <BadgeIndianRupee className="h-6 w-6 text-terracotta" aria-hidden="true" />
          Donation verification queue
        </h2>
        <p className="mt-1 text-sm text-moss">
          A donation counts toward campaign totals only after the payment
          gateway confirms it. Manual verification is reserved for offline
          UPI/bank transfers with reference numbers.
        </p>
        {pledges.length ? (
          <ul className="mt-4 space-y-2.5">
            {pledges.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-parchment p-4"
              >
                <div>
                  <p className="text-sm font-bold text-forest-deep">{p.campaignTitle}</p>
                  <p className="mt-0.5 font-mono text-xs text-moss">
                    {p.id} · {formatDate(p.createdAt.slice(0, 10))}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-display text-lg font-bold text-forest-deep">
                    {formatINR(p.amount)}
                  </p>
                  <Chip tone="clay">Awaiting gateway webhook</Chip>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-2xl border border-dashed border-forest/25 bg-parchment p-6 text-sm text-moss">
            No pending pledges. Pledges made from the donate page appear here.
          </p>
        )}
        <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-moss">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          There is no “mark as paid” button in demo mode by design — success
          states must come from payment verification, never a UI click alone.
        </p>
      </section>

      {/* campaigns + expense publishing */}
      <section aria-labelledby="camp-h">
        <h2 id="camp-h" className="font-display text-2xl font-bold text-forest-deep">
          Campaigns & transparency
        </h2>
        <ul className="mt-4 space-y-5">
          {DEMO_CAMPAIGNS.map((c) => {
            const expenses = [...(extraExpenses[c.slug] ?? []), ...c.expenses];
            const form = expenseForm[c.slug] ?? { label: "", amount: "" };
            return (
              <li key={c.slug} className="rounded-3xl border border-line bg-parchment p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-display text-xl font-bold text-forest-deep">{c.title}</p>
                  <div className="flex gap-1.5">
                    <Chip tone="mist">{CAMPAIGN_CATEGORY_LABELS[c.category]}</Chip>
                    <Chip tone={c.active ? "forest" : "outline"}>
                      {c.active ? "Active" : "Closed"}
                    </Chip>
                  </div>
                </div>
                <div className="mt-3 space-y-1.5">
                  <Progress value={pct(c.raised, c.goal)} label={`${c.title} progress`} />
                  <p className="text-sm text-moss">
                    <strong className="text-forest-deep">{formatINR(c.raised)}</strong> of{" "}
                    {formatINR(c.goal)} · {c.supporters} supporters
                  </p>
                </div>

                {/* expense log */}
                <details className="mt-4 group">
                  <summary className="cursor-pointer text-sm font-bold text-forest underline-offset-4 hover:underline">
                    Expense log ({expenses.length})
                  </summary>
                  <ul className="mt-3 space-y-2 border-l-2 border-line pl-4">
                    {expenses.map((e) => (
                      <li key={e.id} className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="text-charcoal/85">
                          {e.label}
                          <span className="ml-2 text-xs text-moss">{formatDate(e.date)}</span>
                          {e.id.startsWith("local-") && (
                            <Chip tone="sand" className="ml-2">unsaved demo entry</Chip>
                          )}
                        </span>
                        <span className="shrink-0 font-bold text-forest-deep">
                          {formatINR(e.amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {/* add expense */}
                  <div className="mt-4 flex flex-wrap items-end gap-2">
                    <label className="min-w-40 flex-1">
                      <span className="mb-1 block text-xs font-bold text-forest-deep">
                        New expense
                      </span>
                      <input
                        value={form.label}
                        onChange={(e) =>
                          setExpenseForm((f) => ({
                            ...f,
                            [c.slug]: { ...form, label: e.target.value },
                          }))
                        }
                        placeholder="e.g. Vet consultation"
                        className="w-full rounded-xl border border-line bg-cream px-3 py-2.5 text-sm placeholder:text-moss/50 focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/15"
                      />
                    </label>
                    <label className="w-32">
                      <span className="mb-1 block text-xs font-bold text-forest-deep">₹</span>
                      <input
                        type="number"
                        min={1}
                        value={form.amount}
                        onChange={(e) =>
                          setExpenseForm((f) => ({
                            ...f,
                            [c.slug]: { ...form, amount: e.target.value },
                          }))
                        }
                        placeholder="0"
                        className="w-full rounded-xl border border-line bg-cream px-3 py-2.5 text-sm placeholder:text-moss/50 focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/15"
                      />
                    </label>
                    <Button size="sm" onClick={() => addExpense(c.slug)}>
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      Publish
                    </Button>
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
        <DemoNotice className="mt-4">
          Demo mode: published expenses stay in this browser. Live mode writes
          campaign_expenses (public) with the admin&apos;s identity in the
          audit log.
        </DemoNotice>
      </section>
    </div>
  );
}
