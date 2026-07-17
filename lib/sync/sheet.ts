/**
 * Google Sheets I/O for the sync engine.
 *
 * All access goes through here so the retry / rate-limit / batching behaviour
 * is uniform across tabs.
 */

import type { sheets_v4 } from "googleapis";
import { SYSTEM_COLUMNS } from "./types";

/**
 * The first business column is column I (index 8, 0-based) — columns A–H are
 * the system columns declared in types.ts.
 */
export const FIRST_BUSINESS_COL_INDEX = SYSTEM_COLUMNS.length;

/** Convert a 1-based column index into A / B / … / AA / AB. */
export function columnLetter(index1: number): string {
  let n = index1;
  let out = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out || "A";
}

export function sheetRange(tab: string, startRow: number, endRow: number, endColLetter: string): string {
  return `${tab}!A${startRow}:${endColLetter}${endRow}`;
}

/**
 * Read the header row and validate it against the expected system columns
 * (positional, A–H) + expected business columns (name-based, unordered).
 *
 * Returns a map from business-header-name → 0-based column index (relative to
 * column A). System columns are at their fixed positions.
 */
export interface HeaderCheck {
  ok: boolean;
  headers: string[];
  businessIndex: Map<string, number>;
  totalColumns: number;
  error?: string;
}

export async function readAndCheckHeaders(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  tab: string,
  expectedBusinessHeaders: readonly string[]
): Promise<HeaderCheck> {
  const totalCols = SYSTEM_COLUMNS.length + expectedBusinessHeaders.length;
  const lastLetter = columnLetter(totalCols + 4); // read a few extra to catch drift
  const range = `${tab}!A1:${lastLetter}1`;

  let raw: string[][] | undefined;
  try {
    const resp = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    raw = resp.data.values as string[][] | undefined;
  } catch (e) {
    return {
      ok: false,
      headers: [],
      businessIndex: new Map(),
      totalColumns: 0,
      error: `header_read_failed: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  const headers = (raw?.[0] ?? []).map((h) => (h ?? "").toString());

  // System columns must appear in order A–H with the exact names.
  for (let i = 0; i < SYSTEM_COLUMNS.length; i++) {
    if (headers[i] !== SYSTEM_COLUMNS[i]) {
      return {
        ok: false,
        headers,
        businessIndex: new Map(),
        totalColumns: headers.length,
        error: `header_mismatch: system column ${columnLetter(i + 1)} expected "${SYSTEM_COLUMNS[i]}" got "${headers[i] ?? "(empty)"}"`,
      };
    }
  }

  // Business columns must all appear (order-independent, no unknowns).
  const businessHeaders = headers.slice(SYSTEM_COLUMNS.length).filter((h) => h.length > 0);
  const expected = new Set(expectedBusinessHeaders);
  const missing = [...expected].filter((h) => !businessHeaders.includes(h));
  const unknown = businessHeaders.filter((h) => !expected.has(h));
  if (missing.length > 0) {
    return {
      ok: false,
      headers,
      businessIndex: new Map(),
      totalColumns: headers.length,
      error: `header_mismatch: missing business columns [${missing.join(", ")}]`,
    };
  }
  if (unknown.length > 0) {
    return {
      ok: false,
      headers,
      businessIndex: new Map(),
      totalColumns: headers.length,
      error: `header_mismatch: unknown business columns [${unknown.join(", ")}]`,
    };
  }

  const businessIndex = new Map<string, number>();
  headers.forEach((h, i) => {
    if (i >= SYSTEM_COLUMNS.length && h.length > 0) businessIndex.set(h, i);
  });

  return {
    ok: true,
    headers,
    businessIndex,
    totalColumns: SYSTEM_COLUMNS.length + businessHeaders.length,
  };
}

/**
 * Read the full tab range starting at row 2 (row 1 is the header). Returns an
 * array of row-object records keyed by header name; system columns keep their
 * literal names (_id, _public_id, …).
 */
export async function readTabRows(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  tab: string,
  headers: string[]
): Promise<Array<{ sheetRowNumber: number; values: Record<string, string> }>> {
  const lastLetter = columnLetter(Math.max(headers.length, 1));
  const range = `${tab}!A2:${lastLetter}10000`;
  const resp = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  const rows = (resp.data.values ?? []) as string[][];
  return rows.map((row, i) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, ci) => {
      obj[h] = (row[ci] ?? "").toString();
    });
    return { sheetRowNumber: i + 2, values: obj };
  });
}

/**
 * For incremental scan: read only the _id and _updated_at columns so we can
 * compute the candidate set cheaply.
 */
export async function readIncrementalMarkers(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  tab: string
): Promise<Array<{ sheetRowNumber: number; id: string; updatedAt: string }>> {
  const idCol = columnLetter(1); // A
  const updatedAtCol = columnLetter(7); // G
  // Two ranges in one batchGet, aligned row-by-row.
  const resp = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges: [`${tab}!${idCol}2:${idCol}10000`, `${tab}!${updatedAtCol}2:${updatedAtCol}10000`],
  });
  const ids = ((resp.data.valueRanges?.[0]?.values ?? []) as string[][]).map((r) => (r[0] ?? "").toString());
  const uas = ((resp.data.valueRanges?.[1]?.values ?? []) as string[][]).map((r) => (r[0] ?? "").toString());
  const max = Math.max(ids.length, uas.length);
  const out: Array<{ sheetRowNumber: number; id: string; updatedAt: string }> = [];
  for (let i = 0; i < max; i++) {
    out.push({
      sheetRowNumber: i + 2,
      id: (ids[i] ?? "").trim(),
      updatedAt: (uas[i] ?? "").trim(),
    });
  }
  return out;
}

/** Batched value updates. Groups per-row writes to system columns of applied rows. */
export interface SystemWriteBack {
  sheetRowNumber: number;
  id: string;
  publicId?: string;
  rowVersion: number;
  syncStatus: "OK" | "ERROR" | "CONFLICT";
  lastSynced: string;
  lastError: string;
  updatedAt: string;
  syncSource: "sheets" | "app" | "trigger" | "system";
}

export async function writeSystemColumns(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  tab: string,
  writes: SystemWriteBack[]
): Promise<void> {
  if (writes.length === 0) return;
  const data = writes.map((w) => ({
    range: `${tab}!A${w.sheetRowNumber}:H${w.sheetRowNumber}`,
    values: [
      [
        w.id,
        w.publicId ?? "",
        String(w.rowVersion),
        w.syncStatus,
        w.lastSynced,
        w.lastError,
        w.updatedAt,
        w.syncSource,
      ],
    ],
  }));
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: { valueInputOption: "RAW", data },
  });
}

/** Append a fully-formed row (system columns included) to the end of the tab. */
export async function appendRow(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  tab: string,
  values: unknown[]
): Promise<void> {
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${tab}!A1`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [values] },
  });
}
