import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getSheetsClient, SPREADSHEET_ID } from "@/lib/google/client";
import { createServiceSupabase } from "@/lib/supabase/server";
import { isGoogleConfigured } from "@/lib/config";

/**
 * Sheets → Supabase sync for the "Dogs" tab. See docs/ARCHITECTURE.md §6 for
 * the full design and docs/GOOGLE_SHEETS_SCHEMA.md for the column layout.
 *
 * Scope of this first version (intentional — see docs/TASKS.md M2):
 *   - One direction only: Sheet is authoritative, DB is updated to match.
 *   - Only the columns with a direct, unambiguous DB column are synced.
 *     Breed/Weight/Story-vs-Bio nuances are deferred until this can be
 *     tested against a real spreadsheet — better to sync a correct subset
 *     than guess at a mapping nobody has verified.
 *   - DB → Sheet write-back (for admin-dashboard edits reaching the sheet)
 *     is not yet implemented.
 *
 * Cron-secret-gated: never callable by a plain request, since it performs
 * privileged writes via the service-role client.
 */

const DOGS_RANGE = "Dogs!A2:AC1000"; // header row is A1:AC1
const COLUMNS = [
  "_id", "_row_version", "_synced_at", "_status", // A-D
  "public_id", "name", "species", "sex", "age_label", // E-I
  "breed", "weight_kg", "color", "size", "zone_id", // J-N (breed/weight_kg not synced yet — see above)
  "tagline", "personality", "bio", "story", // O-R
  "friendliness", "vaccinated", "sterilized", // S-U
  "health_status", "health_note", "internal_note", // V-X
  "adoption_status", "good_with_people", "good_with_animals", "special_care", // Y-AB
  "active", // AC
] as const;

function rowToObject(row: string[]): Record<string, string> {
  const obj: Record<string, string> = {};
  COLUMNS.forEach((col, i) => (obj[col] = row[i] ?? ""));
  return obj;
}

function parseBool(v: string) {
  return ["true", "yes", "1", "y"].includes(v.trim().toLowerCase());
}

function parseList(v: string) {
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function POST(request: NextRequest) {
  if (request.headers.get("x-cron-secret") !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isGoogleConfigured) {
    // Not an error — this integration simply isn't turned on yet. A cron
    // job hitting this before credentials exist shouldn't page anyone.
    return NextResponse.json({ configured: false, ran: false }, { status: 200 });
  }

  const started = Date.now();
  const sheets = getSheetsClient();
  const supabase = createServiceSupabase();
  if (!sheets || !supabase) {
    return NextResponse.json(
      { configured: false, ran: false, reason: "Supabase service role not configured" },
      { status: 200 }
    );
  }

  let rowsRead = 0;
  let rowsWritten = 0;
  const errors: { row: number; message: string }[] = [];
  const writebacks: { row: number; values: string[] }[] = []; // new _id / public_id to write back

  try {
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: DOGS_RANGE,
    });
    const rows = data.values ?? [];
    rowsRead = rows.length;

    for (let i = 0; i < rows.length; i++) {
      const sheetRowNumber = i + 2; // 1-indexed, +1 for the header row
      try {
        const raw = rowToObject(rows[i]);
        if (!raw.name?.trim()) continue; // blank row — skip silently, not an error

        const sheetRowId = raw._id || randomUUID();
        const payload = {
          sheet_row_id: sheetRowId,
          sync_source: "sheets",
          synced_at: new Date().toISOString(),
          public_id: raw.public_id || undefined, // let the DB trigger assign if new
          name: raw.name.trim(),
          species: (raw.species || "dog").toLowerCase(),
          sex: (raw.sex || "unknown").toLowerCase(),
          age_label: raw.age_label || "Unknown age",
          color: raw.color || "",
          size: (raw.size || "medium").toLowerCase(),
          zone_id: raw.zone_id || "main-building",
          tagline: raw.tagline || "",
          personality: parseList(raw.personality),
          bio: raw.story || raw.bio || "",
          friendliness: (raw.friendliness || "cautious").toLowerCase(),
          vaccinated: parseBool(raw.vaccinated),
          sterilized: parseBool(raw.sterilized),
          health_status: (raw.health_status || "healthy").toLowerCase().replace(/ /g, "_"),
          health_note: raw.health_note || "",
          internal_note: raw.internal_note || "",
          adoption_status: (raw.adoption_status || "not_available").toLowerCase().replace(/ /g, "_"),
          good_with_people: parseBool(raw.good_with_people),
          good_with_animals: parseBool(raw.good_with_animals),
          special_care: parseBool(raw.special_care),
          is_public: raw.active ? parseBool(raw.active) : true,
        };

        const { data: upserted, error } = await supabase
          .from("animals")
          .upsert(payload, { onConflict: "sheet_row_id" })
          .select("public_id")
          .single();

        if (error) throw error;
        rowsWritten++;

        if (!raw._id || !raw.public_id) {
          writebacks.push({
            row: sheetRowNumber,
            values: [sheetRowId, "1", new Date().toISOString(), "", upserted.public_id],
          });
        }
      } catch (e) {
        errors.push({ row: sheetRowNumber, message: e instanceof Error ? e.message : String(e) });
      }
    }

    // Write back generated _id/public_id so re-runs recognise these rows.
    for (const wb of writebacks) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `Dogs!A${wb.row}:E${wb.row}`,
        valueInputOption: "RAW",
        requestBody: { values: [wb.values] },
      });
    }
  } catch (e) {
    errors.push({ row: 0, message: e instanceof Error ? e.message : String(e) });
  }

  await supabase.from("sync_log").insert({
    tab_name: "Dogs",
    direction: "sheets_to_db",
    rows_read: rowsRead,
    rows_written: rowsWritten,
    conflicts: 0,
    errors,
    duration_ms: Date.now() - started,
  });

  return NextResponse.json({
    configured: true,
    ran: true,
    rowsRead,
    rowsWritten,
    errors: errors.length,
  });
}
