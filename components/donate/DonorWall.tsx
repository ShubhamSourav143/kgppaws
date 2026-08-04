"use client";

import { useMemo, useState } from "react";
import { Search, ShieldCheck, Heart } from "lucide-react";
import { formatINR, formatDate, parseDateSafe, cn } from "@/lib/utils";
import { DemoNotice } from "@/components/ui/Section";

export interface DonorRow {
  id: string;
  name: string;
  /** Raw date string from the source. Validated at display time. */
  date: string;
  amount: number;
}

/**
 * Donor wall — the public half of the transparency story.
 *
 * Only donors who opted in are ever named; everyone else appears as
 * "Anonymous". Rows sort newest first; rows with a missing or unparseable
 * date sink to the bottom rather than breaking the page or floating up top
 * on a lexicographic accident.
 */
export function DonorWall({
  donors,
  isDemo,
}: {
  donors: DonorRow[];
  isDemo: boolean;
}) {
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return donors
      .filter((d) => (!q ? true : d.name.toLowerCase().includes(q)))
      .slice()
      .sort((a, b) => {
        const da = parseDateSafe(a.date);
        const db = parseDateSafe(b.date);
        // invalid dates always to the bottom
        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;
        return db.getTime() - da.getTime();
      });
  }, [donors, query]);

  const total = useMemo(() => rows.reduce((s, d) => s + d.amount, 0), [rows]);

  return (
    <section aria-labelledby="donors-h" className="bg-parchment py-20 sm:py-28">
      <div className="container-page">
        <div className="max-w-2xl">
          <p className="eyebrow mb-4 text-saffron-deep">Transparency</p>
          <h2
            id="donors-h"
            className="font-display text-3xl font-bold leading-tight text-forest-deep sm:text-4xl lg:text-5xl"
          >
            Recent Donors{" "}
            <span aria-hidden="true" className="text-terracotta">
              ❤️
            </span>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-charcoal/70">
            Every contribution is logged and every rupee spent is published back
            here. Donors are named only where they asked to be.
          </p>
        </div>

        <div className="mt-10 overflow-hidden rounded-3xl border border-line bg-ivory shadow-card">
          {/* controls */}
          <div className="flex border-b border-line p-4 sm:p-5">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-moss"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search donors…"
                aria-label="Search donors"
                className="w-full rounded-full border border-line bg-cream py-2.5 pl-10 pr-4 text-sm placeholder:text-moss/70 focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/15"
              />
            </div>
          </div>

          {/* scrolling table */}
          <div className="max-h-[26rem] overflow-y-auto overscroll-contain">
            <table className="w-full border-collapse text-left text-sm">
              <caption className="sr-only">
                Recent donations, newest first
              </caption>
              <thead className="sticky top-0 z-10">
                <tr className="bg-mist/95 backdrop-blur-sm">
                  <Th className="pl-5">Donor</Th>
                  <Th className="hidden sm:table-cell">Date</Th>
                  <Th className="pr-5 text-right">Amount</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d, i) => (
                  <tr
                    key={d.id}
                    className={cn(
                      "border-t border-line/70 transition-colors hover:bg-sand-light/60",
                      i % 2 === 1 && "bg-cream/50"
                    )}
                  >
                    <td className="py-3.5 pl-5 pr-3">
                      <span className="flex items-center gap-2.5">
                        <span
                          aria-hidden="true"
                          className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-saffron/12 text-[11px] font-bold text-saffron-deep"
                        >
                          {d.name === "Anonymous" ? (
                            <Heart className="h-3.5 w-3.5" />
                          ) : (
                            d.name.charAt(0)
                          )}
                        </span>
                        <span className="font-semibold text-charcoal/90">
                          {d.name}
                        </span>
                      </span>
                    </td>
                    <td className="hidden whitespace-nowrap py-3.5 pr-3 text-moss sm:table-cell">
                      {formatDate(d.date)}
                    </td>
                    <td className="whitespace-nowrap py-3.5 pr-5 text-right font-bold text-forest-deep">
                      {formatINR(d.amount)}
                    </td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr>
                    <td colSpan={3} className="px-5 py-12 text-center text-moss">
                      No donations match that search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-cream/60 px-5 py-3.5 text-sm">
            <p className="text-moss">
              Showing <strong className="text-forest-deep">{rows.length}</strong>{" "}
              {rows.length === 1 ? "donation" : "donations"}
            </p>
            <p className="font-bold text-forest-deep">{formatINR(total)}</p>
          </div>
        </div>

        <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-moss">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Donations appear here only after payment-gateway verification. Donors
          who do not opt in to being named are shown as Anonymous.
        </p>
        {isDemo && (
          <DemoNotice className="mt-2">
            Demo data — these are illustrative entries, not real donations. In
            production this wall is built from verified donation records.
          </DemoNotice>
        )}
      </div>
    </section>
  );
}

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={cn(
        "py-3 pr-3 text-xs font-bold uppercase tracking-wider text-forest-deep",
        className
      )}
    >
      {children}
    </th>
  );
}
