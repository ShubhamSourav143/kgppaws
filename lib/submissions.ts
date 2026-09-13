import { createServiceSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";
import { submitToGoogleSheet } from "@/lib/google-sheets";
import { sendNotifications, type NotificationChannel } from "@/lib/notifications";
import type { UploadedFile } from "@/lib/uploads";

/**
 * The one entry point every public form goes through. Each `form` kind
 * has its own persist* function below that:
 *   1. Inserts the row into the right Supabase table (attachments jsonb
 *      column includes the full metadata from Storage — URL, path,
 *      filename, mime, size)
 *   2. Fires the same data at the Google Apps Script webhook so the
 *      volunteer team's Sheet stays in sync with row + previewable
 *      image cells + clickable PDF links
 *
 * The DB write is authoritative — if it fails we surface the error to
 * the browser and block the form. The Sheet write is best-effort — if
 * it fails we still succeed the request; the sync engine (or a manual
 * re-run) can backfill later. This matches the user-facing invariant:
 * "if the confirmation screen appears, the report is stored."
 */

export type SubmissionForm = "bite" | "report" | "volunteer" | "adoption";

export interface SubmissionInput {
  form: SubmissionForm;
  /**
   * UUID minted by the client BEFORE any upload starts, so the file
   * paths in Storage, the DB row, and the Sheet row all share one id.
   * Required for forms that carry uploads (bite, report). Optional
   * where none do.
   */
  submissionId?: string;
  data: Record<string, string>;
  attachments?: UploadedFile[];
}

export interface SubmissionResult {
  ok: boolean;
  /** Public code (e.g. BITE-2026-00042) for the user's confirmation screen. */
  code?: string;
  error?: string;
}

export async function persistSubmission(
  input: SubmissionInput
): Promise<SubmissionResult> {
  switch (input.form) {
    case "bite":
      return persistBite(input);
    case "report":
      return persistReport(input);
    case "volunteer":
      return persistVolunteer(input);
    case "adoption":
      return persistAdoption(input);
    default:
      return { ok: false, error: `Unknown form kind: ${input.form}` };
  }
}

/* ————————————————————————— bite reports ————————————————————————— */

async function persistBite(input: SubmissionInput): Promise<SubmissionResult> {
  const supabase = createServiceSupabase();
  const d = input.data;
  const attachments = input.attachments ?? [];
  const code = generateCode("BITE");
  let dbOk = false;

  if (supabase) {
    const { error } = await supabase.from("bite_reports").insert({
      id: input.submissionId,
      report_code: code,
      reporter_name: d.fullName ?? "",
      reporter_phone: d.phone ?? "",
      location_text: d.location ?? "",
      incident_date: emptyToNull(d.incidentDate),
      incident_time: d.incidentTime ?? "",
      maps_link: d.mapsLink ?? "",
      description: d.description ?? "",
      attachments,
      status: "received",
    });
    if (error) {
      // Logged, never echoed: a Postgres error carries table/column/constraint
      // names and this endpoint answers anonymous callers.
      console.error("[submissions/bite] insert failed:", error.message);
    } else {
      dbOk = true;
    }
  }

  const sheetOk = await forwardToSheet("bite", {
    reportCode: code,
    timestamp: new Date().toISOString(),
    fullName: d.fullName ?? "",
    phone: d.phone ?? "",
    location: d.location ?? "",
    incidentDate: d.incidentDate ?? "",
    incidentTime: d.incidentTime ?? "",
    mapsLink: d.mapsLink ?? "",
    description: d.description ?? "",
    dogPhotoUrl: urlForSlot(attachments, "dogPhoto"),
    woundPhotoUrl: urlForSlot(attachments, "wound"),
    medicalReportUrl: urlForSlot(attachments, "medical"),
    dogPhotoName: nameForSlot(attachments, "dogPhoto"),
    woundPhotoName: nameForSlot(attachments, "wound"),
    medicalReportName: nameForSlot(attachments, "medical"),
  });

  const durability = durabilityError(dbOk, sheetOk);
  if (durability) return { ok: false, error: durability };

  await notify({
    kind: "bite",
    channels: ["email"],
    code,
    title: "Bite Incident Report",
    fields: [
      { label: "Reporter", value: d.fullName ?? "" },
      { label: "Phone", value: d.phone ?? "" },
      { label: "Location", value: d.location ?? "" },
      { label: "Incident date", value: d.incidentDate ?? "" },
      { label: "Incident time", value: d.incidentTime ?? "" },
      { label: "Maps", value: d.mapsLink ?? "" },
    ],
    body: d.description,
    attachments,
  });

  return { ok: true, code };
}

/* ————————————————————————— rescue reports ————————————————————————— */

async function persistReport(input: SubmissionInput): Promise<SubmissionResult> {
  const supabase = createServiceSupabase();
  const d = input.data;
  const attachments = input.attachments ?? [];
  const code = generateCode("PAWS-RESCUE");
  const primaryPhoto = attachments.find((a) => a.slot === "photo");
  let dbOk = false;

  if (supabase) {
    const { error } = await supabase.from("rescue_reports").insert({
      id: input.submissionId,
      report_code: code,
      animal_type: (d.animal || "other") as "dog" | "cat" | "other",
      problem: (d.problem || "other") as
        | "injured"
        | "sick"
        | "unable_to_walk"
        | "bleeding"
        | "vehicle_accident"
        | "distressed"
        | "puppies_kittens_at_risk"
        | "missing"
        | "deceased"
        | "other",
      severity: (d.severity || "moderate") as
        | "emergency"
        | "urgent"
        | "moderate"
        | "low",
      zone_id: d.zoneId || "unknown",
      location_note: d.location ?? "",
      description: d.description ?? "",
      reporter_contact: d.contact ?? null,
      photo_path: primaryPhoto?.path ?? null,
      // Present only when the reporter granted location. Stored as numbers so
      // the columns stay usable for distance queries, and left null rather
      // than 0 when absent — 0,0 is a real place in the Gulf of Guinea.
      lat: parseCoord(d.lat),
      lng: parseCoord(d.lng),
      attachments,
      status: "reported",
    });
    if (error) {
      console.error("[submissions/report] insert failed:", error.message);
    } else {
      dbOk = true;
    }
  }

  const sheetOk = await forwardToSheet("report", {
    id: code,
    timestamp: new Date().toISOString(),
    animal: d.animal ?? "",
    problem: d.problem ?? "",
    severity: d.severity ?? "",
    location: d.location ?? "",
    // The floating report modal collects a Google Maps link; it was being
    // dropped here while the bite form's equivalent was forwarded.
    mapsLink: d.mapsLink ?? "",
    description: d.description ?? "",
    contact: d.contact ?? "",
    photoUrl: primaryPhoto?.url ?? "",
    photoName: primaryPhoto?.filename ?? "",
  });

  const durability = durabilityError(dbOk, sheetOk);
  if (durability) return { ok: false, error: durability };

  await notify({
    kind: "report",
    // Rescue is the one form that also pages WhatsApp — life-safety.
    channels: ["email", "whatsapp"],
    code,
    title: "Animal Rescue Report",
    fields: [
      { label: "Animal", value: d.animal ?? "" },
      { label: "Problem", value: d.problem ?? "" },
      { label: "Severity", value: (d.severity ?? "").toUpperCase() },
      { label: "Location", value: d.location ?? "" },
      { label: "Maps", value: d.mapsLink ?? "" },
      { label: "Contact", value: d.contact ?? "" },
    ],
    body: d.description,
    attachments,
    adminUrl: `https://kgp-paws.vercel.app/report/${code}`,
  });

  return { ok: true, code };
}

/* ————————————————————————— volunteers ————————————————————————— */

async function persistVolunteer(input: SubmissionInput): Promise<SubmissionResult> {
  const supabase = createServiceSupabase();
  const d = input.data;
  let dbOk = false;

  if (supabase) {
    const { error } = await supabase.from("volunteers").insert({
      id: input.submissionId,
      full_name: d.name ?? "",
      email: d.email ?? "",
      phone: d.phone ?? "",
      affiliation: d.affiliation ?? "",
      hall_dept: d.hall ?? null,
      interests: (d.workOptions ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      status: "applied",
    });
    if (error) {
      console.error("[submissions/volunteer] insert failed:", error.message);
    } else {
      dbOk = true;
    }
  }

  const sheetOk = await forwardToSheet("volunteer", {
    timestamp: new Date().toISOString(),
    name: d.name ?? "",
    phone: d.phone ?? "",
    email: d.email ?? "",
    affiliation: d.affiliation ?? "",
    hall: d.hall ?? "",
    workOptions: d.workOptions ?? "",
  });

  const durability = durabilityError(dbOk, sheetOk);
  if (durability) return { ok: false, error: durability };

  await notify({
    kind: "volunteer",
    channels: ["email"],
    title: "Volunteer Registration",
    fields: [
      { label: "Name", value: d.name ?? "" },
      { label: "Phone", value: d.phone ?? "" },
      { label: "Email", value: d.email ?? "" },
      { label: "Affiliation", value: d.affiliation ?? "" },
      { label: "Hall / dept", value: d.hall ?? "" },
      { label: "Roles wanted", value: d.workOptions ?? "" },
    ],
  });

  return { ok: true };
}

/* ————————————————————————— adoption applications ————————————————————————— */

async function persistAdoption(input: SubmissionInput): Promise<SubmissionResult> {
  const supabase = createServiceSupabase();
  const d = input.data;
  const code = generateCode("APP");
  let dbOk = false;

  if (supabase && d.animalSlug) {
    // adoption_applications.animal_id references animals(id); look up by slug.
    const { data: animal } = await supabase
      .from("animals")
      .select("id")
      .eq("slug", d.animalSlug)
      .maybeSingle();

    if (animal?.id) {
      const { error } = await supabase.from("adoption_applications").insert({
        id: input.submissionId,
        app_code: code,
        animal_id: animal.id,
        applicant: {
          name: d.name ?? "",
          email: d.email ?? "",
          phone: d.phone ?? "",
          address: d.address ?? "",
          mapsLink: d.mapsLink ?? "",
        },
        living: {},
        experience: {},
        motivation: d.concern ?? "",
        status: "submitted",
      });
      if (error) {
        console.error("[submissions/adoption] insert failed:", error.message);
      } else {
        dbOk = true;
      }
    } else {
      console.warn(
        `[submissions/adoption] animal slug '${d.animalSlug}' not found; skipping DB insert but still forwarding to Sheet`
      );
    }
  }

  const sheetOk = await forwardToSheet("adoption", {
    id: code,
    timestamp: new Date().toISOString(),
    animalName: d.animalName ?? "",
    animalSlug: d.animalSlug ?? "",
    name: d.name ?? "",
    email: d.email ?? "",
    phone: d.phone ?? "",
    address: d.address ?? "",
    mapsLink: d.mapsLink ?? "",
    concern: d.concern ?? "",
  });

  const durability = durabilityError(dbOk, sheetOk);
  if (durability) return { ok: false, error: durability };

  await notify({
    kind: "adoption",
    channels: ["email"],
    code,
    title: `Adoption Request — ${d.animalName ?? d.animalSlug ?? ""}`,
    fields: [
      { label: "Animal", value: d.animalName ?? "" },
      { label: "Applicant", value: d.name ?? "" },
      { label: "Email", value: d.email ?? "" },
      { label: "Phone", value: d.phone ?? "" },
      { label: "Address", value: d.address ?? "" },
      { label: "Maps", value: d.mapsLink ?? "" },
    ],
    body: d.concern,
  });

  return { ok: true, code };
}

/* ————————————————————————— helpers ————————————————————————— */

async function forwardToSheet(
  form: "bite" | "report" | "volunteer" | "adoption",
  data: Record<string, string>
): Promise<boolean> {
  try {
    return await submitToGoogleSheet({ form, data });
  } catch (err) {
    // Sheet is a mirror — a failed forward is loggable but not
    // user-facing on its own. Sync-engine reconciliation covers the gap.
    // The boolean still matters: it is one of the two durable sinks
    // durabilityError() checks before we tell someone their report is filed.
    console.warn(
      `[submissions] forwardToSheet(${form}) failed:`,
      err instanceof Error ? err.message : err
    );
    return false;
  }
}

/**
 * Decide whether a submission is safe to confirm to the user.
 *
 * The user-facing invariant is "if the confirmation screen appears, the
 * report is stored". That used to be unenforced: when
 * `createServiceSupabase()` returned null the DB insert was skipped by an
 * `if (supabase)` guard, `forwardToSheet` swallowed its own failure, and the
 * function returned ok:true regardless — so a deploy with
 * NEXT_PUBLIC_SUPABASE_URL set but SUPABASE_SERVICE_ROLE_KEY missing showed
 * "Thank you for reporting this incident" for a bite report that reached no
 * database, no spreadsheet and no inbox.
 *
 * Demo mode is deliberately exempt. With Supabase not configured at all the
 * app is a labelled demo (see lib/config.ts) and the UI already says so, so a
 * submission that only ever lived in the browser is the expected behaviour.
 * The failure being closed here is the half-configured PRODUCTION deploy:
 * Supabase configured, yet neither durable sink accepted the row.
 *
 * Returns an error string to fail with, or null when it is safe to confirm.
 */
function durabilityError(dbOk: boolean, sheetOk: boolean): string | null {
  if (!isSupabaseConfigured) return null; // demo mode — nothing to promise
  if (dbOk || sheetOk) return null;
  return "We could not store this submission. Please call the volunteer helpline so it is not lost.";
}

/**
 * Fires notification channels for one submission. Wraps sendNotifications
 * in an outer try/catch so the caller (persistBite, persistReport, …)
 * cannot fail its own successful DB write on a notification bug — the
 * user-facing invariant is "if you see the thank-you screen, your report
 * is stored", not "your report is stored AND everyone was paged."
 *
 * `channels` shape is passed by the caller, so a future form kind opts
 * into any combination without a change here. Rescue is currently the
 * only kind that pages WhatsApp.
 */
async function notify(input: {
  kind: "bite" | "report" | "adoption" | "volunteer";
  channels: NotificationChannel[];
  code?: string;
  title: string;
  fields: Array<{ label: string; value: string }>;
  body?: string;
  attachments?: UploadedFile[];
  adminUrl?: string;
}): Promise<void> {
  try {
    await sendNotifications(input);
  } catch (err) {
    console.warn(
      `[submissions] notify(${input.kind}) threw:`,
      err instanceof Error ? err.message : err
    );
  }
}

function urlForSlot(files: UploadedFile[], slot: string): string {
  return files.find((f) => f.slot === slot)?.url ?? "";
}

function nameForSlot(files: UploadedFile[], slot: string): string {
  return files.find((f) => f.slot === slot)?.filename ?? "";
}

function emptyToNull(v: string | undefined | null): string | null {
  return v && v.trim() ? v : null;
}

/** Form fields arrive as strings; a missing or unparseable coordinate is null, never 0. */
function parseCoord(v: string | undefined | null): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Alphabet without the characters people confuse when reading a code back
 * over the phone: no O/0, no I/1, no S/5. 29 symbols.
 */
const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRTUVWXYZ";
const CODE_LENGTH = 8;

/**
 * Public reference for one submission, e.g. BITE-2026-7KQ4XM2P.
 *
 * Was `Math.random()` over 5 digits (100k values) written into a column with a
 * UNIQUE constraint. By the birthday bound that is a coin flip at roughly 370
 * reports and near-certain well before a thousand — and a collision does not
 * degrade gracefully, it fails a real person's report with a 500. 8 symbols
 * from a 31-character alphabet is ~8.5e11 values, and crypto.getRandomValues
 * removes the Math.random() bias as well.
 */
export function generateCode(prefix: string): string {
  const year = new Date().getUTCFullYear();
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const byte of bytes) {
    out += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  }
  return `${prefix}-${year}-${out}`;
}
