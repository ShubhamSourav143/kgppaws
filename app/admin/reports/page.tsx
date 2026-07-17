"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, MapPin, UserCheck } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { DemoNotice } from "@/components/ui/Section";
import {
  DEMO_REPORTS,
  PROBLEM_LABELS,
  SEVERITY_LABELS,
} from "@/lib/demo/reports";
import { getLocalReports } from "@/lib/local-store";
import { zoneName } from "@/lib/demo/zones";
import {
  REPORT_STATUS_LABELS,
  REPORT_STATUS_ORDER,
  cn,
} from "@/lib/utils";
import type { RescueReport, ReportStatus } from "@/types";

const VOLUNTEERS = ["— unassigned —", "Morning team", "Evening team", "Night response", "Transport crew"];

const SEVERITY_RANK = { emergency: 0, urgent: 1, moderate: 2, low: 3 } as const;

export default function AdminReportsPage() {
  const [reports] = useState<RescueReport[]>(() =>
    [...getLocalReports(), ...DEMO_REPORTS].sort(
      (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
    )
  );
  const [statusOverride, setStatusOverride] = useState<Record<string, ReportStatus>>({});
  const [assignee, setAssignee] = useState<Record<string, string>>({});

  const effectiveStatus = (r: RescueReport) => statusOverride[r.id] ?? r.status;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-display text-2xl font-bold text-forest-deep">
          Report management
        </h2>
        <p className="mt-1 text-sm text-moss">
          Sorted by severity. Assign a team, advance the status — the reporter
          sees every update on their tracking page.
        </p>
      </header>

      <ul className="space-y-4">
        {reports.map((r) => {
          const status = effectiveStatus(r);
          const resolved = status === "resolved";
          return (
            <li
              key={r.id}
              className={cn(
                "rounded-3xl border bg-parchment p-5",
                r.severity === "emergency" && !resolved
                  ? "border-terracotta/50"
                  : "border-line"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link
                  href={`/report/${r.id}`}
                  className="inline-flex items-center gap-1.5 font-mono text-sm font-bold text-forest-deep underline-offset-4 hover:underline"
                >
                  {r.id}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
                <div className="flex flex-wrap gap-1.5">
                  <Chip tone={r.severity === "emergency" ? "terracotta" : r.severity === "urgent" ? "clay" : "sand"}>
                    {SEVERITY_LABELS[r.severity]}
                  </Chip>
                  <Chip tone="mist">{PROBLEM_LABELS[r.problem]}</Chip>
                  <Chip tone={resolved ? "forest" : "outline"}>
                    {REPORT_STATUS_LABELS[status]}
                  </Chip>
                </div>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-charcoal/85">
                {r.description}
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-moss">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {zoneName(r.zoneId)} — {r.locationNote}
                <span className="rounded-full bg-sand-light px-2 py-0.5 text-[10px] font-bold text-forest-deep">
                  exact location: volunteers only
                </span>
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 flex items-center gap-1.5 text-xs font-bold text-forest-deep">
                    <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    Assigned team
                  </span>
                  <select
                    value={assignee[r.id] ?? VOLUNTEERS[0]}
                    onChange={(e) =>
                      setAssignee((a) => ({ ...a, [r.id]: e.target.value }))
                    }
                    className="w-full rounded-xl border border-line bg-cream px-3 py-2.5 text-sm focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/15"
                  >
                    {VOLUNTEERS.map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-forest-deep">
                    Status
                  </span>
                  <select
                    value={status}
                    onChange={(e) =>
                      setStatusOverride((s) => ({
                        ...s,
                        [r.id]: e.target.value as ReportStatus,
                      }))
                    }
                    className="w-full rounded-xl border border-line bg-cream px-3 py-2.5 text-sm focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/15"
                  >
                    {REPORT_STATUS_ORDER.map((s) => (
                      <option key={s} value={s}>
                        {REPORT_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {r.linkedAnimalSlug ? (
                <p className="mt-3 text-xs text-moss">
                  Linked animal:{" "}
                  <Link
                    href={`/animal/${r.linkedAnimalSlug}`}
                    className="font-bold text-forest underline underline-offset-2"
                  >
                    {r.linkedAnimalSlug}
                  </Link>
                </p>
              ) : (
                <p className="mt-3 text-xs text-moss">
                  No linked animal — in production you can link an existing
                  profile or create a new animal identity from this report.
                </p>
              )}
            </li>
          );
        })}
      </ul>

      <DemoNotice>
        Demo mode: assignments and status changes apply to this browser
        session only. Live mode writes report_updates rows + notifications.
      </DemoNotice>
    </div>
  );
}
