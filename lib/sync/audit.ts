/**
 * content_audit_log writer.
 *
 * Every applied row-level change (insert / update / soft_delete / archive /
 * unarchive) inserts a diff row into content_audit_log. The table has no
 * update/delete RLS policies at all — writes here are permanent.
 *
 * Diff shape:
 *   insert       → { field: { new: <value> }, ... }  (all non-null columns)
 *   update       → { field: { old: <value>, new: <value> }, ... }  (changed only)
 *   soft_delete  → { is_active: { old: true, new: false } }
 *   archive      → { archived_at: { old: null, new: <ts> } }
 *   unarchive    → { archived_at: { old: <ts>, new: null } }
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type AuditOperation =
  | "insert"
  | "update"
  | "soft_delete"
  | "archive"
  | "unarchive";
export type AuditSource = "sheets" | "app" | "trigger" | "system";

export interface AuditEntry {
  sync_job_id?: string | null;
  table_name: string;
  row_id: string;
  operation: AuditOperation;
  source: AuditSource;
  actor?: string | null;
  diff: Record<string, { old?: unknown; new?: unknown }>;
}

export async function writeAudit(
  supabase: SupabaseClient,
  entries: AuditEntry[]
): Promise<void> {
  if (entries.length === 0) return;
  const { error } = await supabase.from("content_audit_log").insert(
    entries.map((e) => ({
      sync_job_id: e.sync_job_id ?? null,
      table_name: e.table_name,
      row_id: e.row_id,
      operation: e.operation,
      source: e.source,
      actor: e.actor ?? null,
      diff: e.diff,
    }))
  );
  if (error) throw new Error(`writeAudit failed: ${error.message}`);
}

/**
 * Compute a field-level diff between two rows. Only includes fields whose
 * values differ. Keys prefixed with an underscore or in EXCLUDED_KEYS are
 * skipped (they're sync-metadata, not content).
 */
const EXCLUDED_KEYS = new Set([
  "id",
  "row_version",
  "sync_status",
  "last_synced_at",
  "last_sync_error",
  "sync_source",
  "created_at",
  "updated_at",
  "archived_at",
]);

export function computeDiff(
  oldRow: Record<string, unknown> | null,
  newRow: Record<string, unknown>
): Record<string, { old?: unknown; new?: unknown }> {
  const diff: Record<string, { old?: unknown; new?: unknown }> = {};
  if (oldRow === null) {
    for (const [k, v] of Object.entries(newRow)) {
      if (EXCLUDED_KEYS.has(k)) continue;
      if (v === null || v === undefined) continue;
      diff[k] = { new: v };
    }
    return diff;
  }
  for (const [k, newV] of Object.entries(newRow)) {
    if (EXCLUDED_KEYS.has(k)) continue;
    const oldV = oldRow[k];
    if (!valuesEqual(oldV, newV)) {
      diff[k] = { old: oldV, new: newV };
    }
  }
  return diff;
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || a === undefined || b === undefined) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!valuesEqual(a[i], b[i])) return false;
    return true;
  }
  if (typeof a === "object" && typeof b === "object") {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return false;
}
