"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bike,
  Calendar,
  Camera,
  CheckCircle2,
  ClipboardList,
  MapPin,
  PawPrint,
  Siren,
  Soup,
} from "lucide-react";
import { RequireRole } from "@/components/auth/RequireRole";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { Chip } from "@/components/ui/Chip";
import { DemoNotice } from "@/components/ui/Section";
import { DEMO_REPORTS, SEVERITY_LABELS, PROBLEM_LABELS } from "@/lib/demo/reports";
import { DEMO_VOLUNTEER_TASKS } from "@/lib/demo/metrics";
import { DEMO_ANIMALS } from "@/lib/demo/animals";
import { zoneName } from "@/lib/demo/zones";
import { REPORT_STATUS_LABELS, formatDate, cn } from "@/lib/utils";
import type { VolunteerTask } from "@/types";

const TASK_ICONS: Record<VolunteerTask["kind"], typeof Soup> = {
  feeding: Soup,
  rescue: Siren,
  transport: Bike,
  photo: Camera,
  admin: ClipboardList,
};

const ACTIVITIES = [
  { date: "2026-07-19", title: "Sterilization camp prep meeting", where: "Gymkhana common room" },
  { date: "2026-08-02", title: "August sterilization camp — day 1", where: "Vet partner clinic" },
  { date: "2026-08-09", title: "Vaccination drive, phase 2", where: "Market & gate areas" },
];

export function VolunteerDashboard() {
  const [tasks, setTasks] = useState(DEMO_VOLUNTEER_TASKS);

  const openReports = DEMO_REPORTS.filter((r) => r.status !== "resolved");
  const underTreatment = DEMO_ANIMALS.filter(
    (a) => a.healthStatus === "under_treatment" || a.healthStatus === "recovering"
  );
  const tasksDue = tasks.filter((t) => !t.done).length;

  const toggleTask = (id: string) =>
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  return (
    <RequireRole roles={["volunteer", "admin", "super_admin"]}>
      {(user) => (
        <div className="container-page py-10 sm:py-14">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow mb-2 text-terracotta-deep">Volunteer dashboard</p>
              <h1 className="font-display text-4xl font-bold text-forest-deep">
                On duty: {user.name.split(" ")[0]}
              </h1>
            </div>
            <SignOutButton />
          </header>

          {/* overview stats */}
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Open reports", value: openReports.length, accent: true },
              { label: "Tasks due", value: tasksDue },
              { label: "In treatment / recovery", value: underTreatment.length },
              { label: "Upcoming activities", value: ACTIVITIES.length },
            ].map((s) => (
              <div
                key={s.label}
                className={cn(
                  "rounded-3xl border border-line p-5",
                  s.accent ? "bg-terracotta text-parchment" : "bg-parchment"
                )}
              >
                <p className={cn("font-display text-4xl font-bold", !s.accent && "text-forest-deep")}>
                  {s.value}
                </p>
                <p className={cn("mt-1 text-xs font-bold uppercase tracking-wider", s.accent ? "text-parchment/80" : "text-moss")}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
            <div className="min-w-0 space-y-10">
              {/* assigned reports */}
              <section aria-labelledby="vrep-h">
                <h2 id="vrep-h" className="flex items-center gap-2 font-display text-2xl font-bold text-forest-deep">
                  <Siren className="h-5 w-5 text-terracotta" aria-hidden="true" />
                  Assigned rescue reports
                </h2>
                <ul className="mt-5 space-y-3">
                  {openReports.map((r) => (
                    <li key={r.id}>
                      <Link
                        href={`/report/${r.id}`}
                        className="block rounded-2xl border border-line bg-parchment p-4 transition-colors hover:border-forest/30"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-mono text-sm font-bold text-forest-deep">{r.id}</p>
                          <div className="flex gap-1.5">
                            <Chip tone={r.severity === "emergency" ? "terracotta" : r.severity === "urgent" ? "clay" : "sand"}>
                              {SEVERITY_LABELS[r.severity]}
                            </Chip>
                            <Chip tone="mist">{REPORT_STATUS_LABELS[r.status]}</Chip>
                          </div>
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-charcoal/80">
                          {PROBLEM_LABELS[r.problem]} — {r.description}
                        </p>
                        <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-moss">
                          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                          {zoneName(r.zoneId)} · {r.locationNote}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-moss">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  As an authorized volunteer you can see exact location notes.
                  These are never public.
                </p>
              </section>

              {/* animal updates */}
              <section aria-labelledby="vanimals-h">
                <h2 id="vanimals-h" className="flex items-center gap-2 font-display text-2xl font-bold text-forest-deep">
                  <PawPrint className="h-5 w-5 text-terracotta" aria-hidden="true" />
                  Animals needing updates
                </h2>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {underTreatment.map((a) => (
                    <li key={a.slug}>
                      <Link
                        href={`/animal/${a.slug}`}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-parchment p-4 transition-colors hover:border-forest/30"
                      >
                        <div>
                          <p className="font-display text-lg font-bold text-forest-deep">{a.name}</p>
                          <p className="mt-0.5 text-xs text-moss">
                            Last update {formatDate(a.lastHealthUpdate)} · {zoneName(a.zoneId)}
                          </p>
                        </div>
                        <Chip tone="clay">{a.healthStatus === "under_treatment" ? "Treatment" : "Recovery"}</Chip>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <div className="space-y-10">
              {/* tasks */}
              <section aria-labelledby="vtasks-h" className="rounded-3xl border border-line bg-parchment p-6">
                <h2 id="vtasks-h" className="flex items-center gap-2 font-display text-xl font-bold text-forest-deep">
                  <CheckCircle2 className="h-5 w-5 text-terracotta" aria-hidden="true" />
                  My tasks
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {tasks.map((t) => {
                    const Icon = TASK_ICONS[t.kind];
                    return (
                      <li key={t.id}>
                        <label
                          className={cn(
                            "flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition-colors",
                            t.done
                              ? "border-line bg-cream opacity-60"
                              : "border-line bg-cream hover:border-forest/30"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={t.done}
                            onChange={() => toggleTask(t.id)}
                            className="mt-0.5 h-4 w-4 accent-[#173F35]"
                            aria-label={`Mark "${t.title}" ${t.done ? "not done" : "done"}`}
                          />
                          <span className="min-w-0 flex-1">
                            <span className={cn("block text-sm font-semibold text-forest-deep", t.done && "line-through")}>
                              {t.title}
                            </span>
                            <span className="mt-0.5 flex items-center gap-1.5 text-xs text-moss">
                              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                              due {formatDate(t.due)}
                            </span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </section>

              {/* upcoming */}
              <section aria-labelledby="vact-h" className="rounded-3xl border border-line bg-parchment p-6">
                <h2 id="vact-h" className="flex items-center gap-2 font-display text-xl font-bold text-forest-deep">
                  <Calendar className="h-5 w-5 text-terracotta" aria-hidden="true" />
                  Upcoming activities
                </h2>
                <ul className="mt-4 space-y-3">
                  {ACTIVITIES.map((a) => (
                    <li key={a.title} className="rounded-2xl bg-cream p-3.5">
                      <p className="text-xs font-black uppercase tracking-wide text-terracotta-deep">
                        {formatDate(a.date)}
                      </p>
                      <p className="mt-0.5 text-sm font-bold text-forest-deep">{a.title}</p>
                      <p className="text-xs text-moss">{a.where}</p>
                    </li>
                  ))}
                </ul>
              </section>

              {/* contributions */}
              <section aria-labelledby="vcontrib-h" className="rounded-3xl bg-forest p-6 text-cream">
                <h2 id="vcontrib-h" className="font-display text-xl font-bold">
                  My contributions
                </h2>
                <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: "Feedings", value: 86 },
                    { label: "Rescues", value: 12 },
                    { label: "Transports", value: 7 },
                  ].map((s) => (
                    <div key={s.label} className="rounded-2xl bg-cream/10 p-3">
                      <dd className="font-display text-2xl font-bold">{s.value}</dd>
                      <dt className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-sand">
                        {s.label}
                      </dt>
                    </div>
                  ))}
                </dl>
                <DemoNotice className="mt-4 !text-cream/60">
                  Demo values — computed from activity logs in production.
                </DemoNotice>
              </section>
            </div>
          </div>
        </div>
      )}
    </RequireRole>
  );
}
