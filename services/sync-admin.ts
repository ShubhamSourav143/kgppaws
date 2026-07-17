import { createServerSupabase } from "@/lib/supabase/server";

export interface SyncJobRow {
  id: string;
  tab: string;
  direction: string;
  scope: string;
  state: string;
  attempt: number;
  triggeredBy: string;
  enqueuedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  rowsRead: number | null;
  rowsWritten: number | null;
  conflicts: number | null;
  durationMs: number | null;
  lastError: unknown;
}

export interface TabHealth {
  tab: string;
  category: string;
  direction: string;
  enabled: boolean;
  lastSuccess: string | null;
  lastFailure: string | null;
  errorRowsInSheet: number;
  archivedRowsInDb: number;
  activeRowsInDb: number;
}

export interface OpenConflict {
  id: string;
  detectedAt: string;
  tableName: string;
  rowId: string;
  type: string;
  sheetPayload: Record<string, unknown> | null;
  dbPayload: Record<string, unknown> | null;
}

export async function listRecentJobs(limit = 100): Promise<SyncJobRow[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("sync_jobs")
    .select("*")
    .order("enqueued_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((j) => ({
    id: j.id,
    tab: j.tab,
    direction: j.direction,
    scope: j.scope,
    state: j.state,
    attempt: j.attempt,
    triggeredBy: j.triggered_by,
    enqueuedAt: j.enqueued_at,
    startedAt: j.started_at,
    finishedAt: j.finished_at,
    rowsRead: j.rows_read,
    rowsWritten: j.rows_written,
    conflicts: j.conflicts,
    durationMs: j.duration_ms,
    lastError: j.last_error,
  }));
}

export async function listTabsHealth(): Promise<TabHealth[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data: tabs } = await supabase.from("tab_config").select("*").order("tab_name");
  const out: TabHealth[] = [];
  for (const t of tabs ?? []) {
    const { data: lastSuccess } = await supabase
      .from("sync_jobs")
      .select("finished_at")
      .eq("tab", t.tab_name)
      .eq("state", "succeeded")
      .order("finished_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { data: lastFailure } = await supabase
      .from("sync_jobs")
      .select("finished_at")
      .eq("tab", t.tab_name)
      .eq("state", "failed")
      .order("finished_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Row counts (only for primary table; ignore missing / not-yet-created tables)
    let activeRowsInDb = 0;
    let archivedRowsInDb = 0;
    let errorRowsInSheet = 0;
    if (t.db_primary_table) {
      const { count: active } = await supabase
        .from(t.db_primary_table)
        .select("*", { count: "exact", head: true })
        .is("archived_at", null);
      activeRowsInDb = active ?? 0;
      const { count: archived } = await supabase
        .from(t.db_primary_table)
        .select("*", { count: "exact", head: true })
        .not("archived_at", "is", null);
      archivedRowsInDb = archived ?? 0;
      const { count: errored } = await supabase
        .from(t.db_primary_table)
        .select("*", { count: "exact", head: true })
        .eq("sync_status", "error");
      errorRowsInSheet = errored ?? 0;
    }
    out.push({
      tab: t.tab_name,
      category: t.category,
      direction: t.direction,
      enabled: t.enabled,
      lastSuccess: lastSuccess?.finished_at ?? null,
      lastFailure: lastFailure?.finished_at ?? null,
      errorRowsInSheet,
      activeRowsInDb,
      archivedRowsInDb,
    });
  }
  return out;
}

export async function listOpenConflicts(limit = 100): Promise<OpenConflict[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("sync_conflicts")
    .select("*")
    .is("resolution", null)
    .order("detected_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((c) => ({
    id: c.id,
    detectedAt: c.detected_at,
    tableName: c.table_name,
    rowId: c.row_id,
    type: c.type,
    sheetPayload: c.sheet_payload,
    dbPayload: c.db_payload,
  }));
}
