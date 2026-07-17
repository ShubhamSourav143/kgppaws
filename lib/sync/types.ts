/**
 * Shared types for the sync engine (M-CMS-1).
 *
 * The engine is designed so that adding a new tab means adding one file under
 * `lib/sync/tabs/` — the type layer is fixed here.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { sheets_v4 } from "googleapis";

// ---------- Job queue ----------

export type SyncDirection = "sheets_to_db" | "db_to_sheets" | "drive_to_storage";
export type SyncScope = "full" | "incremental" | "row";
export type SyncState = "queued" | "running" | "succeeded" | "failed" | "conflict";
export type SyncTriggeredBy = "cron" | "admin" | "trigger" | "apps_script" | "compat_shim";

export interface SyncJob {
  id: string;
  tab: string;
  direction: SyncDirection;
  scope: SyncScope;
  row_id: string | null;
  state: SyncState;
  attempt: number;
  max_attempts: number;
  next_run_at: string | null;
  last_error: unknown;
  heartbeat_at: string | null;
  enqueued_at: string;
  started_at: string | null;
  finished_at: string | null;
  triggered_by: SyncTriggeredBy;
  actor_id: string | null;
  rows_read: number | null;
  rows_written: number | null;
  conflicts: number | null;
  duration_ms: number | null;
}

// ---------- Per-tab config (from tab_config table) ----------

export type TabCategory = "content" | "master_data" | "transaction_data";

export type ArchivePolicy =
  | { kind: "none" }
  | { kind: "status_based"; archive_when: string }
  | { kind: "time_window"; column: string; keep: string }
  | { kind: "size_threshold"; order_by: string; keep_newest: number }
  | { kind: "manual" };

export interface TabConfig {
  tab_name: string;
  category: TabCategory;
  direction: SyncDirection;
  db_tables: string[];
  db_primary_table: string;
  archive_policy: ArchivePolicy;
  revalidate_paths: string[];
  active_column: boolean;
  enabled: boolean;
}

// ---------- System columns (exactly 8, in this order, on every editable tab) ----------

export const SYSTEM_COLUMNS = [
  "_id",
  "_public_id",
  "_row_version",
  "_sync_status",
  "_last_synced",
  "_last_error",
  "_updated_at",
  "_sync_source",
] as const;

export type SystemColumn = (typeof SYSTEM_COLUMNS)[number];

// ---------- Per-tab implementation contract ----------

/**
 * Every tab that participates in sync registers a TabHandler in
 * `lib/sync/tabs/registry.ts`. The handler is the seam between the shared
 * worker (queue, locks, audit, retry) and the tab-specific concerns
 * (column layout, validation, DB mapping).
 *
 * M-CMS-1 ships this interface + an empty registry. Per-tab handlers land
 * in M-CMS-2 through M-CMS-4.
 */
export interface TabHandler {
  /** Exact tab name as it appears in the spreadsheet. */
  tabName: string;

  /**
   * Expected header row (columns A–?). System columns A–H are added by the
   * framework — the handler declares only the business columns starting at
   * column I. Header check fails the whole run if the sheet doesn't match.
   */
  businessHeaders: readonly string[];

  /** Runs Sheets → DB on the incremental candidate set (or full set). */
  applySheetsToDb?: (ctx: TabRunContext) => Promise<TabRunResult>;

  /** Runs DB → Sheets for a single row (insert or update). */
  applyDbToSheets?: (ctx: TabRunContext) => Promise<TabRunResult>;
}

/**
 * Runtime context passed to every tab handler invocation. Encapsulates
 * clients + job metadata so handlers stay pure (no direct process.env reads).
 */
export interface TabRunContext {
  job: SyncJob;
  config: TabConfig;
  supabase: SupabaseClient;
  sheets: sheets_v4.Sheets;
  spreadsheetId: string;
  now: () => Date;
}

export interface TabRunResult {
  rowsRead: number;
  rowsWritten: number;
  conflicts: number;
  errors: Array<{ row?: number; sheet_row_id?: string; message: string }>;
}
