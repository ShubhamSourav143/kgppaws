"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, CircleDashed, SearchX } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { ButtonLink } from "@/components/ui/Button";
import { DEMO_REPORTS, PROBLEM_LABELS, SEVERITY_LABELS } from "@/lib/demo/reports";
import { getLocalReports } from "@/lib/local-store";
import { zoneName } from "@/lib/demo/zones";
import {
  REPORT_STATUS_LABELS,
  REPORT_STATUS_ORDER,
  cn,
} from "@/lib/utils";
import type { RescueReport } from "@/types";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Report status tracker.
 * Demo mode: looks up seed reports + reports submitted from this browser.
 * Live mode: swap the lookup for a Supabase query (RLS lets reporters see
 * their own reports; volunteers see assigned ones).
 */
export function ReportTracker({ reportId }: { reportId: string }) {
  const [report, setReport] = useState<RescueReport | null | undefined>(undefined);

  useEffect(() => {
    const all = [...getLocalReports(), ...DEMO_REPORTS];
    setReport(
      all.find((r) => r.id.toLowerCase() === reportId.toLowerCase()) ?? null
    );
  }, [reportId]);

  if (report === undefined) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading report">
        <div className="h-8 w-2/3 animate-pulse rounded-full bg-sand-light" />
        <div className="h-40 animate-pulse rounded-3xl bg-sand-light" />
      </div>
    );
  }

  if (report === null) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-forest/25 bg-parchment p-12 text-center">
        <SearchX className="h-10 w-10 text-sand" aria-hidden="true" />
        <h1 className="font-display text-3xl font-bold text-forest-deep">
          We couldn&apos;t find that report.
        </h1>
        <p className="max-w-sm text-sm text-moss">
          Double-check the ID — it looks like{" "}
          <span className="font-mono font-bold">PAWS-RESCUE-2026-00124</span>.
          Reports submitted in demo mode are only visible in the browser that
          filed them.
        </p>
        <ButtonLink href="/report" variant="accent">
          File a new report
        </ButtonLink>
      </div>
    );
  }

  const currentIdx = REPORT_STATUS_ORDER.indexOf(report.status);
  const resolved = report.status === "resolved";

  return (
    <article>
      <header>
        <p className="eyebrow mb-2 text-terracotta-deep">Rescue report</p>
        <h1 className="break-all font-mono text-2xl font-bold text-forest-deep sm:text-3xl">
          {report.id}
        </h1>
        <div className="mt-4 flex flex-wrap gap-2">
          <Chip tone={resolved ? "forest" : "terracotta"}>
            {REPORT_STATUS_LABELS[report.status]}
          </Chip>
          <Chip tone="sand">{SEVERITY_LABELS[report.severity]}</Chip>
          <Chip tone="mist">{PROBLEM_LABELS[report.problem]}</Chip>
          <Chip tone="outline">{zoneName(report.zoneId)}</Chip>
        </div>
        <p className="mt-4 rounded-2xl border border-line bg-parchment p-4 text-sm leading-relaxed text-charcoal/85">
          “{report.description}”
          {report.locationNote && (
            <span className="mt-1 block text-xs text-moss">
              Location note: {report.locationNote}
            </span>
          )}
        </p>
      </header>

      {/* progress stepper */}
      <section aria-label="Report progress" className="mt-10">
        <ol className="space-y-0">
          {REPORT_STATUS_ORDER.map((status, i) => {
            const update = [...report.updates]
              .reverse()
              .find((u) => u.status === status);
            const done = i < currentIdx || resolved;
            const current = i === currentIdx && !resolved;
            const isLast = i === REPORT_STATUS_ORDER.length - 1;
            if (i > currentIdx && !update) {
              // future steps: render compact
              return (
                <li key={status} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-dashed border-line bg-cream text-moss/50">
                      <CircleDashed className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    {!isLast && <span className="w-0.5 flex-1 bg-line" />}
                  </div>
                  <p className="pb-6 pt-1.5 text-sm font-semibold text-moss/50">
                    {REPORT_STATUS_LABELS[status]}
                  </p>
                </li>
              );
            }
            return (
              <motion.li
                key={status}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.35 }}
                className="flex gap-4"
              >
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "grid h-8 w-8 shrink-0 place-items-center rounded-full",
                      done
                        ? "bg-forest text-cream"
                        : current
                          ? "bg-terracotta text-parchment"
                          : "bg-sand-light text-moss"
                    )}
                  >
                    {done ? (
                      <Check className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-current anim-pulse-soft" />
                    )}
                  </span>
                  {!isLast && (
                    <span
                      className={cn(
                        "w-0.5 flex-1",
                        done ? "bg-forest/40" : "bg-line"
                      )}
                    />
                  )}
                </div>
                <div className="pb-7 pt-0.5">
                  <p
                    className={cn(
                      "text-sm font-bold",
                      current ? "text-terracotta-deep" : "text-forest-deep"
                    )}
                  >
                    {REPORT_STATUS_LABELS[status]}
                  </p>
                  {update && (
                    <>
                      <p className="mt-0.5 text-xs font-semibold text-moss">
                        {formatDateTime(update.date)}
                      </p>
                      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-charcoal/80">
                        {update.note}
                      </p>
                    </>
                  )}
                </div>
              </motion.li>
            );
          })}
        </ol>
      </section>

      {report.linkedAnimalSlug && (
        <ButtonLink href={`/animal/${report.linkedAnimalSlug}`} variant="outline">
          View this animal&apos;s profile
        </ButtonLink>
      )}

      <p className="mt-8 text-xs italic text-moss/80">
        Status updates are posted by the assigned volunteer team.
        {report.demo && " This is demo data for illustration."}
      </p>
    </article>
  );
}
