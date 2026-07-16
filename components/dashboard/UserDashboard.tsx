"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  FileText,
  HandCoins,
  Heart,
  Home,
} from "lucide-react";
import { RequireRole } from "@/components/auth/RequireRole";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { AnimalCard } from "@/components/animals/AnimalCard";
import { Chip } from "@/components/ui/Chip";
import { ButtonLink } from "@/components/ui/Button";
import { DemoNotice } from "@/components/ui/Section";
import { DEMO_ANIMALS } from "@/lib/demo/animals";
import { DEMO_APPLICATIONS } from "@/lib/demo/metrics";
import {
  getLocalApplications,
  getLocalDonations,
  getLocalReports,
  getSavedAnimals,
  type LocalDonationIntent,
} from "@/lib/local-store";
import {
  APPLICATION_STATUS_LABELS,
  REPORT_STATUS_LABELS,
  formatINR,
  formatDate,
} from "@/lib/utils";
import type { AdoptionApplication, RescueReport } from "@/types";

function EmptyRow({ text, href, cta }: { text: string; href: string; cta: string }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-forest/25 bg-cream p-6 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-moss">{text}</p>
      <ButtonLink href={href} variant="outline" size="sm" className="shrink-0">
        {cta}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </ButtonLink>
    </div>
  );
}

export function UserDashboard() {
  const [saved, setSaved] = useState<string[]>([]);
  const [reports, setReports] = useState<RescueReport[]>([]);
  const [applications, setApplications] = useState<AdoptionApplication[]>([]);
  const [donations, setDonations] = useState<LocalDonationIntent[]>([]);

  useEffect(() => {
    const sync = () => {
      setSaved(getSavedAnimals());
      setReports(getLocalReports());
      setApplications([...getLocalApplications(), ...DEMO_APPLICATIONS]);
      setDonations(getLocalDonations());
    };
    sync();
    window.addEventListener("kgppaws:store", sync);
    return () => window.removeEventListener("kgppaws:store", sync);
  }, []);

  const savedAnimals = DEMO_ANIMALS.filter((a) => saved.includes(a.slug));
  const animalName = (slug: string) =>
    DEMO_ANIMALS.find((a) => a.slug === slug)?.name ?? slug;

  return (
    <RequireRole roles={["user", "volunteer", "admin", "super_admin"]}>
      {(user) => (
        <div className="container-page py-10 sm:py-14">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow mb-2 text-terracotta-deep">My dashboard</p>
              <h1 className="font-display text-4xl font-bold text-forest-deep">
                Hello, {user.name.split(" ")[0]}.
              </h1>
            </div>
            <SignOutButton />
          </header>

          <div className="mt-10 space-y-12">
            {/* saved paws */}
            <section aria-labelledby="saved-h">
              <h2
                id="saved-h"
                className="flex items-center gap-2 font-display text-2xl font-bold text-forest-deep"
              >
                <Heart className="h-5 w-5 text-terracotta" aria-hidden="true" />
                Saved paws
              </h2>
              {savedAnimals.length ? (
                <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {savedAnimals.map((a) => (
                    <li key={a.slug}>
                      <AnimalCard animal={a} className="h-full" />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-5">
                  <EmptyRow
                    text="No saved paws yet — tap the heart on any animal to keep them here."
                    href="/adopt"
                    cta="Browse animals"
                  />
                </div>
              )}
            </section>

            {/* applications */}
            <section aria-labelledby="apps-h">
              <h2
                id="apps-h"
                className="flex items-center gap-2 font-display text-2xl font-bold text-forest-deep"
              >
                <Home className="h-5 w-5 text-terracotta" aria-hidden="true" />
                Adoption applications
              </h2>
              {applications.length ? (
                <ul className="mt-5 space-y-3">
                  {applications.map((app) => (
                    <li
                      key={app.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-parchment p-4"
                    >
                      <div>
                        <p className="font-display text-lg font-bold text-forest-deep">
                          {animalName(app.animalSlug)}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-moss">
                          {app.id} · {formatDate(app.createdAt.slice(0, 10))}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Chip
                          tone={
                            app.status === "approved" || app.status === "adopted"
                              ? "forest"
                              : app.status === "not_selected"
                                ? "outline"
                                : "sand"
                          }
                        >
                          {APPLICATION_STATUS_LABELS[app.status]}
                        </Chip>
                        <Link
                          href={`/animal/${app.animalSlug}`}
                          className="text-sm font-bold text-forest underline-offset-4 hover:underline"
                        >
                          View paw
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-5">
                  <EmptyRow
                    text="No applications yet. Someone on the adopt page is waiting to meet you."
                    href="/adopt"
                    cta="Find a friend"
                  />
                </div>
              )}
            </section>

            {/* reports */}
            <section aria-labelledby="reports-h">
              <h2
                id="reports-h"
                className="flex items-center gap-2 font-display text-2xl font-bold text-forest-deep"
              >
                <FileText className="h-5 w-5 text-terracotta" aria-hidden="true" />
                My rescue reports
              </h2>
              {reports.length ? (
                <ul className="mt-5 space-y-3">
                  {reports.map((r) => (
                    <li key={r.id}>
                      <Link
                        href={`/report/${r.id}`}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-parchment p-4 transition-colors hover:border-forest/30"
                      >
                        <div>
                          <p className="font-mono text-sm font-bold text-forest-deep">
                            {r.id}
                          </p>
                          <p className="mt-0.5 line-clamp-1 text-xs text-moss">
                            {r.description}
                          </p>
                        </div>
                        <Chip tone={r.status === "resolved" ? "forest" : "terracotta"}>
                          {REPORT_STATUS_LABELS[r.status]}
                        </Chip>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-5">
                  <EmptyRow
                    text="No reports filed from this browser. Hopefully it stays that way."
                    href="/report"
                    cta="Report an animal"
                  />
                </div>
              )}
            </section>

            {/* donations */}
            <section aria-labelledby="donations-h">
              <h2
                id="donations-h"
                className="flex items-center gap-2 font-display text-2xl font-bold text-forest-deep"
              >
                <HandCoins className="h-5 w-5 text-terracotta" aria-hidden="true" />
                Donation history
              </h2>
              {donations.length ? (
                <>
                  <ul className="mt-5 space-y-3">
                    {donations.map((d) => (
                      <li
                        key={d.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-parchment p-4"
                      >
                        <div>
                          <p className="text-sm font-bold text-forest-deep">
                            {d.campaignTitle}
                          </p>
                          <p className="mt-0.5 text-xs text-moss">
                            {formatDate(d.createdAt.slice(0, 10))}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="font-display text-lg font-bold text-forest-deep">
                            {formatINR(d.amount)}
                          </p>
                          <Chip tone="clay">Pending verification</Chip>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <DemoNotice className="mt-3">
                    Demo mode: pledges are never marked successful without real
                    payment verification.
                  </DemoNotice>
                </>
              ) : (
                <div className="mt-5">
                  <EmptyRow
                    text="No donations yet. Even ₹100 keeps the feeding rickshaw rolling."
                    href="/donate"
                    cta="Support a paw"
                  />
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </RequireRole>
  );
}
