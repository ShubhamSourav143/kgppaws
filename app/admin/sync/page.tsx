import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";
import {
  listOpenConflicts,
  listRecentJobs,
  listTabsHealth,
  type SyncJobRow,
  type TabHealth,
} from "@/services/sync-admin";
import { SyncActions } from "@/components/admin/SyncActions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = { title: "Sync — Admin" };

export default async function AdminSyncPage() {
  if (!isSupabaseConfigured) {
    return (
      <div className="container-page py-16">
        <h1 className="font-display text-3xl text-forest">Sync dashboard</h1>
        <p className="mt-4 text-charcoal/80">
          The sync dashboard needs a live Supabase connection. Add
          <code className="mx-1 rounded bg-mist px-1.5 py-0.5">NEXT_PUBLIC_SUPABASE_URL</code>
          and
          <code className="mx-1 rounded bg-mist px-1.5 py-0.5">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
          to your environment, then reload.
        </p>
      </div>
    );
  }

  const supabase = await createServerSupabase();
  if (!supabase) redirect("/login?next=/admin/sync");
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) redirect("/login?next=/admin/sync");
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id);
  const roles = new Set((roleData ?? []).map((r) => r.role));
  if (!roles.has("admin") && !roles.has("super_admin")) {
    return (
      <div className="container-page py-16">
        <h1 className="font-display text-3xl text-forest">Access denied</h1>
        <p className="mt-4 text-charcoal/80">
          Sync operations require an admin role. Speak to a coordinator for access.
        </p>
      </div>
    );
  }

  const [jobs, tabs, conflicts] = await Promise.all([
    listRecentJobs(100),
    listTabsHealth(),
    listOpenConflicts(50),
  ]);

  const queueDepth = jobs.filter((j) => j.state === "queued" || j.state === "running").length;
  const lastFullSweep = jobs.find((j) => j.scope === "full" && j.state === "succeeded")?.finishedAt;

  return (
    <div className="container-page py-8 md:py-12">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-terracotta-deep">Operations</p>
          <h1 className="mt-1 font-display text-3xl text-forest md:text-4xl">Sync dashboard</h1>
        </div>
        <Link
          href="/admin"
          className="rounded-full border border-forest/20 px-4 py-2 text-sm font-semibold text-forest hover:bg-mist"
        >
          ← Admin overview
        </Link>
      </header>

      {/* Zone 1 — Health strip */}
      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <HealthCard label="Last full sweep" value={fmtAgo(lastFullSweep)} good={!!lastFullSweep} />
        <HealthCard label="Queue depth" value={`${queueDepth}`} good={queueDepth < 10} />
        <HealthCard
          label="Open conflicts"
          value={`${conflicts.length}`}
          good={conflicts.length === 0}
          urgent={conflicts.length > 5}
        />
        <HealthCard
          label="Sheet errors"
          value={`${tabs.reduce((a, t) => a + t.errorRowsInSheet, 0)}`}
          good={tabs.every((t) => t.errorRowsInSheet === 0)}
        />
      </div>

      {/* Zone 2 — Per-tab health */}
      <section className="mb-12">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-xl text-forest">Per-tab health</h2>
          <SyncActions kind="everything" />
        </div>
        <div className="overflow-x-auto rounded-2xl border border-line bg-parchment">
          <table className="w-full text-sm">
            <thead className="bg-mist text-left text-xs uppercase tracking-wide text-forest/70">
              <tr>
                <th className="px-4 py-3">Tab</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Last success</th>
                <th className="px-4 py-3">DB rows</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tabs.map((t) => (
                <TabRow key={t.tab} tab={t} />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Zone 3 — Job stream */}
      <section className="mb-12">
        <h2 className="mb-4 font-display text-xl text-forest">Recent jobs</h2>
        <div className="overflow-x-auto rounded-2xl border border-line bg-parchment">
          <table className="w-full text-sm">
            <thead className="bg-mist text-left text-xs uppercase tracking-wide text-forest/70">
              <tr>
                <th className="px-4 py-3">State</th>
                <th className="px-4 py-3">Tab</th>
                <th className="px-4 py-3">Direction</th>
                <th className="px-4 py-3">Scope</th>
                <th className="px-4 py-3">Attempt</th>
                <th className="px-4 py-3">Read → Written</th>
                <th className="px-4 py-3">When</th>
              </tr>
            </thead>
            <tbody>
              {jobs.slice(0, 30).map((j) => (
                <JobRow key={j.id} job={j} />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Zone 4 — Conflict inbox */}
      <section>
        <h2 className="mb-4 font-display text-xl text-forest">
          Conflict inbox {conflicts.length > 0 && <span className="ml-2 text-sm text-terracotta-deep">({conflicts.length} open)</span>}
        </h2>
        {conflicts.length === 0 ? (
          <p className="rounded-2xl border border-line bg-parchment px-6 py-8 text-center text-sm text-charcoal/70">
            No open conflicts. When a concurrent Sheets/dashboard edit is detected, it will appear here for resolution.
          </p>
        ) : (
          <div className="space-y-4">
            {conflicts.map((c) => (
              <div key={c.id} className="rounded-2xl border border-line bg-parchment p-5">
                <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
                  <span className="rounded-full bg-terracotta/15 px-3 py-0.5 font-semibold text-terracotta-deep">
                    {c.type.replace(/_/g, " ")}
                  </span>
                  <span className="text-charcoal/70">
                    {c.tableName} · {c.rowId.substring(0, 8)}
                  </span>
                  <span className="text-charcoal/60">{fmtAgo(c.detectedAt)}</span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <ConflictPayload label="Sheet says" payload={c.sheetPayload} />
                  <ConflictPayload label="DB says" payload={c.dbPayload} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <SyncActions kind="resolve" conflictId={c.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function HealthCard({
  label,
  value,
  good,
  urgent,
}: {
  label: string;
  value: string;
  good: boolean;
  urgent?: boolean;
}) {
  const tone = urgent
    ? "border-terracotta/40 bg-terracotta/8"
    : good
      ? "border-line bg-parchment"
      : "border-sand/60 bg-cream";
  return (
    <div className={`rounded-2xl border ${tone} p-5`}>
      <p className="text-xs uppercase tracking-wide text-charcoal/60">{label}</p>
      <p className="mt-1 font-display text-2xl text-forest">{value}</p>
    </div>
  );
}

function TabRow({ tab }: { tab: TabHealth }) {
  const status = !tab.enabled
    ? "disabled"
    : tab.errorRowsInSheet > 0
      ? `${tab.errorRowsInSheet} errors`
      : tab.lastSuccess
        ? "OK"
        : "not synced yet";
  return (
    <tr className="border-t border-line/60">
      <td className="px-4 py-3 font-semibold text-forest">{tab.tab}</td>
      <td className="px-4 py-3 capitalize text-charcoal/70">{tab.category.replace(/_/g, " ")}</td>
      <td className="px-4 py-3 text-charcoal/80">{fmtAgo(tab.lastSuccess)}</td>
      <td className="px-4 py-3 text-charcoal/80">
        {tab.activeRowsInDb}
        {tab.archivedRowsInDb > 0 && (
          <span className="ml-2 text-xs text-charcoal/50">+{tab.archivedRowsInDb} archived</span>
        )}
      </td>
      <td className="px-4 py-3">
        <span
          className={
            status === "OK"
              ? "rounded-full bg-forest/10 px-2 py-0.5 text-xs font-semibold text-forest"
              : status === "disabled"
                ? "rounded-full bg-charcoal/10 px-2 py-0.5 text-xs text-charcoal/70"
                : "rounded-full bg-terracotta/15 px-2 py-0.5 text-xs font-semibold text-terracotta-deep"
          }
        >
          {status}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <SyncActions kind="tab" tab={tab.tab} direction={tab.direction} />
      </td>
    </tr>
  );
}

function JobRow({ job }: { job: SyncJobRow }) {
  const tone =
    job.state === "succeeded"
      ? "text-forest"
      : job.state === "failed"
        ? "text-terracotta-deep"
        : job.state === "conflict"
          ? "text-terracotta-deep"
          : "text-charcoal/70";
  return (
    <tr className="border-t border-line/60">
      <td className={`px-4 py-3 font-semibold capitalize ${tone}`}>{job.state}</td>
      <td className="px-4 py-3">{job.tab}</td>
      <td className="px-4 py-3 text-charcoal/70">{job.direction}</td>
      <td className="px-4 py-3 text-charcoal/70">{job.scope}</td>
      <td className="px-4 py-3 text-charcoal/70">{job.attempt}</td>
      <td className="px-4 py-3 text-charcoal/80">
        {(job.rowsRead ?? "-") + " → " + (job.rowsWritten ?? "-")}
      </td>
      <td className="px-4 py-3 text-charcoal/60">{fmtAgo(job.enqueuedAt)}</td>
    </tr>
  );
}

function ConflictPayload({
  label,
  payload,
}: {
  label: string;
  payload: Record<string, unknown> | null;
}) {
  return (
    <div className="rounded-xl border border-line bg-cream p-4">
      <p className="mb-2 text-xs uppercase tracking-wide text-charcoal/60">{label}</p>
      <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words text-xs text-charcoal/85">
        {payload ? JSON.stringify(payload, null, 2) : "—"}
      </pre>
    </div>
  );
}

function fmtAgo(iso: string | null | undefined): string {
  if (!iso) return "—";
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "—";
  const secs = Math.max(1, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
