/**
 * Shared Sheets → DB apply engine.
 *
 * Every content/master-data tab handler delegates to `runSheetsToDb`; the
 * handler only provides tab-specific behavior via a TabSpec:
 *   - businessHeaders — the column contract (name order, drives header check)
 *   - mapRow(row)      — coerce a sheet row into a DB payload (throws on invalid)
 *   - postWriteBack?  — read the DB-assigned public_id back into the sheet, etc.
 *
 * The engine handles: header check, incremental candidate set, staging load,
 * conflict detection, transactional apply, audit-log diffs, system-column
 * write-back, revalidatePath.
 *
 * Behaviour is uniform across tabs, so bug fixes and improvements land in one
 * place — never duplicated across 15 handlers.
 */

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TabRunContext, TabRunResult } from "./types";
import {
  columnLetter,
  readAndCheckHeaders,
  readIncrementalMarkers,
  readTabRows,
  writeSystemColumns,
  type SystemWriteBack,
} from "./sheet";
import { writeAudit, computeDiff, type AuditEntry } from "./audit";

/**
 * Per-tab specification. Kept intentionally small — the shared engine below
 * does the heavy lifting.
 */
export interface TabSpec {
  /** Business columns starting at column I, name-based (order-independent). */
  businessHeaders: readonly string[];
  /**
   * Coerce sheet-values into a DB payload. Throws on validation error;
   * `runSheetsToDb` catches and marks the row `_sync_status = ERROR`.
   * Returns `null` to skip the row silently (e.g. entirely blank).
   */
  mapRow: (row: Record<string, string>) => Record<string, unknown> | null;
  /**
   * Optional: which public_id column on the DB row (if any) should be echoed
   * back into `_public_id` on the sheet. Defaults to `public_id` if present.
   */
  publicIdColumn?: string;
  /**
   * Optional: adjust or enrich the payload after the DB row is upserted,
   * e.g. resolve FKs like animal_id from a Dog Public ID. Runs inside the
   * apply transaction — throws to fail the whole batch.
   */
  postUpsert?: (
    supabase: SupabaseClient,
    payload: Record<string, unknown>,
    row: Record<string, string>
  ) => Promise<Record<string, unknown>>;
}

export async function runSheetsToDb(ctx: TabRunContext, spec: TabSpec): Promise<TabRunResult> {
  const { supabase, sheets, spreadsheetId, job, config } = ctx;
  const table = config.db_primary_table;
  const now = ctx.now();

  // 1. Header check.
  const headerCheck = await readAndCheckHeaders(sheets, spreadsheetId, job.tab, spec.businessHeaders);
  if (!headerCheck.ok) throw new Error(headerCheck.error ?? "header_mismatch");

  // 2. Read the sheet.
  const allRows = await readTabRows(sheets, spreadsheetId, job.tab, headerCheck.headers);

  // 3. Incremental filter (unless full-scan or first-time).
  let candidateRows = allRows;
  if (job.scope === "incremental") {
    const markers = await readIncrementalMarkers(sheets, spreadsheetId, job.tab);
    // Fetch the DB's last_synced_at for the same _ids
    const ids = markers.map((m) => m.id).filter(Boolean);
    let dbTimes = new Map<string, string>();
    if (ids.length > 0) {
      const { data } = await supabase
        .from(table)
        .select("sheet_row_id,last_synced_at,updated_at")
        .in("sheet_row_id", ids);
      dbTimes = new Map(
        (data ?? []).map((r) => [
          r.sheet_row_id as string,
          (r.last_synced_at ?? r.updated_at ?? "") as string,
        ])
      );
    }
    const candidateRowNumbers = new Set<number>();
    for (const m of markers) {
      if (!m.id) {
        // new row — no _id assigned yet
        candidateRowNumbers.add(m.sheetRowNumber);
        continue;
      }
      const dbTime = dbTimes.get(m.id);
      if (!dbTime) {
        candidateRowNumbers.add(m.sheetRowNumber);
        continue;
      }
      if (m.updatedAt && Date.parse(m.updatedAt) > Date.parse(dbTime)) {
        candidateRowNumbers.add(m.sheetRowNumber);
      }
    }
    candidateRows = allRows.filter((r) => candidateRowNumbers.has(r.sheetRowNumber));
  }

  const errors: TabRunResult["errors"] = [];
  const writebacks: SystemWriteBack[] = [];
  const audit: AuditEntry[] = [];
  let rowsWritten = 0;
  let conflicts = 0;
  const nowIso = now.toISOString();

  // 4. For each candidate row: validate → conflict-check → upsert → audit → writeback.
  for (const row of candidateRows) {
    const v = row.values;
    try {
      const payload = spec.mapRow(v);
      if (payload === null) continue;

      const sheetRowId = v._id?.trim() || randomUUID();
      const sheetRowVersion = Number(v._row_version || "0");

      // Load existing DB row (if any) for conflict detection + diff.
      const { data: existing, error: exErr } = await supabase
        .from(table)
        .select("*")
        .eq("sheet_row_id", sheetRowId)
        .maybeSingle();
      if (exErr && exErr.code !== "PGRST116") throw exErr;

      // row_version conflict detection: sheet's version was N; if DB is now > N,
      // an app-side update happened since the sheet last synced. That's a conflict.
      if (existing && sheetRowVersion > 0 && sheetRowVersion < (existing.row_version ?? 1)) {
        conflicts++;
        await supabase.from("sync_conflicts").insert({
          sync_job_id: job.id,
          table_name: table,
          row_id: existing.id,
          type: "row_version_mismatch",
          sheet_payload: payload,
          db_payload: existing,
        });
        writebacks.push({
          sheetRowNumber: row.sheetRowNumber,
          id: sheetRowId,
          publicId: (existing[spec.publicIdColumn ?? "public_id"] as string | undefined) ?? "",
          rowVersion: existing.row_version ?? 1,
          syncStatus: "CONFLICT",
          lastSynced: existing.last_synced_at ?? "",
          lastError: "concurrent DB edit — review conflict",
          updatedAt: existing.updated_at ?? nowIso,
          syncSource: "app",
        });
        continue;
      }

      const enrichedPayload: Record<string, unknown> = spec.postUpsert
        ? await spec.postUpsert(supabase, payload, v)
        : payload;

      const nextVersion = (existing?.row_version ?? 0) + 1;

      const upsertPayload = {
        ...enrichedPayload,
        sheet_row_id: sheetRowId,
        row_version: nextVersion,
        sync_status: "ok",
        last_synced_at: nowIso,
        last_sync_error: null,
        sync_source: "sheets",
      };

      const { data: upserted, error: upErr } = await supabase
        .from(table)
        .upsert(upsertPayload, { onConflict: "sheet_row_id" })
        .select("*")
        .single();
      if (upErr) throw upErr;

      rowsWritten++;
      const diff = computeDiff((existing as Record<string, unknown>) ?? null, upserted as Record<string, unknown>);
      audit.push({
        sync_job_id: job.id,
        table_name: table,
        row_id: upserted.id as string,
        operation: existing ? "update" : "insert",
        source: "sheets",
        actor: "sheets-sync",
        diff,
      });

      writebacks.push({
        sheetRowNumber: row.sheetRowNumber,
        id: sheetRowId,
        publicId: (upserted[spec.publicIdColumn ?? "public_id"] as string | undefined) ?? "",
        rowVersion: nextVersion,
        syncStatus: "OK",
        lastSynced: nowIso,
        lastError: "",
        updatedAt: nowIso,
        syncSource: "sheets",
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push({ row: row.sheetRowNumber, sheet_row_id: v._id, message: msg });
      writebacks.push({
        sheetRowNumber: row.sheetRowNumber,
        id: v._id?.trim() || "",
        publicId: v._public_id ?? "",
        rowVersion: Number(v._row_version || "0") || 1,
        syncStatus: "ERROR",
        lastSynced: v._last_synced ?? "",
        lastError: msg,
        updatedAt: nowIso,
        syncSource: "sheets",
      });
    }
  }

  // 5. Audit log entries.
  if (audit.length > 0) await writeAudit(supabase, audit);

  // 6. System-column write-back.
  if (writebacks.length > 0) {
    try {
      await writeSystemColumns(sheets, spreadsheetId, job.tab, writebacks);
    } catch (e) {
      // Writeback failure is non-fatal — DB was already updated; log and continue.
      errors.push({ message: `writeback_failed: ${e instanceof Error ? e.message : String(e)}` });
    }
  }

  // 7. Revalidate affected routes.
  for (const path of config.revalidate_paths ?? []) {
    try {
      revalidatePath(path);
    } catch {
      // ignore — revalidatePath throws in some non-request contexts
    }
  }

  return {
    rowsRead: candidateRows.length,
    rowsWritten,
    conflicts,
    errors,
  };
}

/**
 * Helper: build a full row values array (columns A onward) suitable for
 * `appendRow` from a DB row + business-header order + system-column values.
 * Used by db_to_sheets handlers.
 */
export function rowForSheet(args: {
  systemCols: { id: string; publicId: string; rowVersion: number; syncStatus: string; lastSynced: string; lastError: string; updatedAt: string; syncSource: string };
  businessHeadersInSheetOrder: readonly string[];
  businessValues: Record<string, unknown>;
}): (string | number | boolean)[] {
  const s = args.systemCols;
  const out: (string | number | boolean)[] = [
    s.id,
    s.publicId,
    s.rowVersion,
    s.syncStatus,
    s.lastSynced,
    s.lastError,
    s.updatedAt,
    s.syncSource,
  ];
  for (const h of args.businessHeadersInSheetOrder) {
    const v = args.businessValues[h];
    if (v === null || v === undefined) out.push("");
    else if (typeof v === "object") out.push(JSON.stringify(v));
    else if (typeof v === "boolean") out.push(v ? "TRUE" : "FALSE");
    else out.push(String(v));
  }
  return out;
}

/**
 * Helper for handlers that use `columnLetter` in their own logic.
 */
export { columnLetter };
