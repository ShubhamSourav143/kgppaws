"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, StickyNote } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { DemoNotice } from "@/components/ui/Section";
import { DEMO_APPLICATIONS } from "@/lib/demo/metrics";
import { DEMO_ANIMALS } from "@/lib/demo/animals";
import { getLocalApplications } from "@/lib/local-store";
import { APPLICATION_STATUS_LABELS, formatDate } from "@/lib/utils";
import type { AdoptionApplication, ApplicationStatus } from "@/types";

const STATUSES = Object.keys(APPLICATION_STATUS_LABELS) as ApplicationStatus[];

export default function AdminAdoptionsPage() {
  const [apps, setApps] = useState<AdoptionApplication[]>([]);
  const [statusOverride, setStatusOverride] = useState<Record<string, ApplicationStatus>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [meetDates, setMeetDates] = useState<Record<string, string>>({});

  useEffect(() => {
    setApps([...getLocalApplications(), ...DEMO_APPLICATIONS]);
  }, []);

  const animalName = (slug: string) =>
    DEMO_ANIMALS.find((a) => a.slug === slug)?.name ?? slug;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-display text-2xl font-bold text-forest-deep">
          Adoption management
        </h2>
        <p className="mt-1 text-sm text-moss">
          {apps.length} applications. Internal notes are never visible to
          applicants.
        </p>
      </header>

      <ul className="space-y-4">
        {apps.map((app) => {
          const status = statusOverride[app.id] ?? app.status;
          return (
            <li key={app.id} className="rounded-3xl border border-line bg-parchment p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-display text-xl font-bold text-forest-deep">
                    {app.applicant.name} →{" "}
                    <Link
                      href={`/animal/${app.animalSlug}`}
                      className="underline decoration-terracotta/50 underline-offset-4 hover:decoration-terracotta"
                    >
                      {animalName(app.animalSlug)}
                    </Link>
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-moss">
                    {app.id} · {formatDate(app.createdAt.slice(0, 10))} · {app.applicant.affiliation}
                  </p>
                </div>
                <Chip
                  tone={
                    status === "approved" || status === "adopted"
                      ? "forest"
                      : status === "not_selected"
                        ? "outline"
                        : "sand"
                  }
                >
                  {APPLICATION_STATUS_LABELS[status]}
                </Chip>
              </div>

              <dl className="mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-moss">Home</dt>
                  <dd className="text-charcoal/85">
                    {app.living.housing} ({app.living.ownOrRent})
                    {app.living.hasOutdoorSpace ? " · outdoor space" : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-moss">Experience</dt>
                  <dd className="text-charcoal/85">
                    {app.experience.hadPetsBefore ? "Prior animal care" : "First-time"}
                    {app.experience.currentPets ? ` · ${app.experience.currentPets}` : ""} ·
                    alone {app.experience.hoursAloneDaily}
                  </dd>
                </div>
              </dl>
              <blockquote className="mt-3 rounded-2xl bg-cream p-3.5 text-sm italic leading-relaxed text-charcoal/80">
                “{app.motivation}”
              </blockquote>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-forest-deep">Status</span>
                  <select
                    value={status}
                    onChange={(e) =>
                      setStatusOverride((s) => ({
                        ...s,
                        [app.id]: e.target.value as ApplicationStatus,
                      }))
                    }
                    className="w-full rounded-xl border border-line bg-cream px-3 py-2.5 text-sm focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/15"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {APPLICATION_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 flex items-center gap-1 text-xs font-bold text-forest-deep">
                    <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                    Meet & greet
                  </span>
                  <input
                    type="date"
                    value={meetDates[app.id] ?? ""}
                    onChange={(e) =>
                      setMeetDates((m) => ({ ...m, [app.id]: e.target.value }))
                    }
                    className="w-full rounded-xl border border-line bg-cream px-3 py-2.5 text-sm focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/15"
                  />
                </label>
                <label className="block sm:col-span-1">
                  <span className="mb-1 flex items-center gap-1 text-xs font-bold text-forest-deep">
                    <StickyNote className="h-3.5 w-3.5" aria-hidden="true" />
                    Internal note (private)
                  </span>
                  <input
                    value={notes[app.id] ?? ""}
                    onChange={(e) =>
                      setNotes((n) => ({ ...n, [app.id]: e.target.value }))
                    }
                    placeholder="e.g. call after 6 PM"
                    className="w-full rounded-xl border border-line bg-cream px-3 py-2.5 text-sm placeholder:text-moss/50 focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/15"
                  />
                </label>
              </div>
            </li>
          );
        })}
      </ul>

      <DemoNotice>
        Demo mode: review actions stay in this browser. Live mode persists
        them with reviewer identity in the audit log, and applicants see
        status changes (never internal notes) on their dashboard.
      </DemoNotice>
    </div>
  );
}
