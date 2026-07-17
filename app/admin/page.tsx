"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { Progress } from "@/components/ui/Progress";
import { DEMO_REPORTS, SEVERITY_LABELS } from "@/lib/demo/reports";
import { DEMO_ANIMALS } from "@/lib/demo/animals";
import { DEMO_CAMPAIGNS } from "@/lib/demo/campaigns";
import { DEMO_APPLICATIONS } from "@/lib/demo/metrics";
import {
  getLocalApplications,
  getLocalDonations,
  getLocalReports,
} from "@/lib/local-store";
import {
  REPORT_STATUS_LABELS,
  formatINR,
  pct,
  cn,
} from "@/lib/utils";

const ACTIVITY = [
  { when: "Today, 07:02", what: "Morning feeding round completed — 9/9 stops" },
  { when: "Yesterday, 19:30", what: "Bunti's medicated bath logged by transport team" },
  { when: "Yesterday, 10:15", what: "Report 00124 moved to Treatment Started" },
  { when: "2 days ago", what: "New volunteer onboarded to the VS Hall route" },
];

export default function AdminOverviewPage() {
  const [localReportCount] = useState(() => getLocalReports().length);
  const [localAppCount] = useState(() => getLocalApplications().length);
  const [pledges] = useState(() => getLocalDonations().length);

  const openReports =
    DEMO_REPORTS.filter((r) => r.status !== "resolved").length + localReportCount;
  const urgent = DEMO_REPORTS.filter(
    (r) => r.status !== "resolved" && (r.severity === "emergency" || r.severity === "urgent")
  ).length;
  const underTreatment = DEMO_ANIMALS.filter(
    (a) => a.healthStatus === "under_treatment" || a.healthStatus === "recovering"
  ).length;
  const applications = DEMO_APPLICATIONS.length + localAppCount;
  const totalRaised = DEMO_CAMPAIGNS.reduce((s, c) => s + c.raised, 0);

  const stats = [
    { label: "Open rescue reports", value: openReports, href: "/admin/reports", accent: true },
    { label: "Urgent / emergency", value: urgent, href: "/admin/reports" },
    { label: "Animals in care", value: underTreatment, href: "/admin/animals" },
    { label: "Adoption applications", value: applications, href: "/admin/adoptions" },
    { label: "Active campaigns", value: DEMO_CAMPAIGNS.length, href: "/admin/donations" },
    { label: "Pledges to verify", value: pledges, href: "/admin/donations" },
  ];

  return (
    <div className="space-y-10">
      {/* stat grid */}
      <section aria-label="Key numbers">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className={cn(
                "group rounded-3xl border border-line p-5 transition-all hover:-translate-y-0.5 hover:shadow-soft",
                s.accent ? "bg-terracotta text-parchment" : "bg-parchment"
              )}
            >
              <p className={cn("font-display text-4xl font-bold", !s.accent && "text-forest-deep")}>
                {s.value}
              </p>
              <p
                className={cn(
                  "mt-1 flex items-center gap-1 text-xs font-bold uppercase tracking-wider",
                  s.accent ? "text-parchment/80" : "text-moss"
                )}
              >
                {s.label}
                <ArrowRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
              </p>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-2">
        {/* incoming reports */}
        <section aria-labelledby="ov-reports-h">
          <h2 id="ov-reports-h" className="font-display text-2xl font-bold text-forest-deep">
            Incoming reports
          </h2>
          <ul className="mt-4 space-y-2.5">
            {DEMO_REPORTS.filter((r) => r.status !== "resolved").map((r) => (
              <li key={r.id}>
                <Link
                  href="/admin/reports"
                  className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-parchment p-4 transition-colors hover:border-forest/30"
                >
                  <div>
                    <p className="font-mono text-sm font-bold text-forest-deep">{r.id}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-moss">{r.description}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <Chip tone={r.severity === "emergency" ? "terracotta" : "clay"}>
                      {SEVERITY_LABELS[r.severity]}
                    </Chip>
                    <Chip tone="mist">{REPORT_STATUS_LABELS[r.status]}</Chip>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* campaigns */}
        <section aria-labelledby="ov-campaigns-h">
          <h2 id="ov-campaigns-h" className="flex items-center gap-2 font-display text-2xl font-bold text-forest-deep">
            <TrendingUp className="h-5 w-5 text-terracotta" aria-hidden="true" />
            Campaign health
          </h2>
          <p className="mt-1 text-sm text-moss">
            {formatINR(totalRaised)} raised across all active campaigns (demo values).
          </p>
          <ul className="mt-4 space-y-3">
            {DEMO_CAMPAIGNS.slice(0, 4).map((c) => (
              <li key={c.slug} className="rounded-2xl border border-line bg-parchment p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-bold text-forest-deep">{c.title}</p>
                  <p className="text-xs font-bold text-moss">
                    {formatINR(c.raised)} / {formatINR(c.goal)}
                  </p>
                </div>
                <div className="mt-2">
                  <Progress value={pct(c.raised, c.goal)} label={`${c.title} progress`} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* activity feed */}
      <section aria-labelledby="ov-activity-h">
        <h2 id="ov-activity-h" className="font-display text-2xl font-bold text-forest-deep">
          Volunteer activity
        </h2>
        <ol className="mt-4 space-y-0 border-l-2 border-line pl-5">
          {ACTIVITY.map((a) => (
            <li key={a.what} className="relative pb-5">
              <span className="absolute -left-[1.65rem] top-1 h-3 w-3 rounded-full border-2 border-cream bg-terracotta" aria-hidden="true" />
              <p className="text-xs font-bold uppercase tracking-wide text-moss">{a.when}</p>
              <p className="mt-0.5 text-sm text-charcoal/85">{a.what}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
