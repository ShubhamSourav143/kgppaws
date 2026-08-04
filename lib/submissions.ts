import { createServiceSupabase } from "@/lib/supabase/server";
import { submitToGoogleSheet } from "@/lib/google-sheets";
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
      console.error("[submissions/bite] insert failed:", error.message);
      return {
        ok: false,
        error: `Database write failed: ${error.message}`,
      };
    }
  }

  await forwardToSheet("bite", {
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

  return { ok: true, code };
}

/* ————————————————————————— rescue reports ————————————————————————— */

async function persistReport(input: SubmissionInput): Promise<SubmissionResult> {
  const supabase = createServiceSupabase();
  const d = input.data;
  const attachments = input.attachments ?? [];
  const code = generateCode("PAWS-RESCUE");
  const primaryPhoto = attachments.find((a) => a.slot === "photo");

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
      attachments,
      status: "reported",
    });
    if (error) {
      console.error("[submissions/report] insert failed:", error.message);
      return {
        ok: false,
        error: `Database write failed: ${error.message}`,
      };
    }
  }

  await forwardToSheet("report", {
    id: code,
    timestamp: new Date().toISOString(),
    animal: d.animal ?? "",
    problem: d.problem ?? "",
    severity: d.severity ?? "",
    location: d.location ?? "",
    description: d.description ?? "",
    contact: d.contact ?? "",
    photoUrl: primaryPhoto?.url ?? "",
    photoName: primaryPhoto?.filename ?? "",
  });

  return { ok: true, code };
}

/* ————————————————————————— volunteers ————————————————————————— */

async function persistVolunteer(input: SubmissionInput): Promise<SubmissionResult> {
  const supabase = createServiceSupabase();
  const d = input.data;

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
      return {
        ok: false,
        error: `Database write failed: ${error.message}`,
      };
    }
  }

  await forwardToSheet("volunteer", {
    timestamp: new Date().toISOString(),
    name: d.name ?? "",
    phone: d.phone ?? "",
    email: d.email ?? "",
    affiliation: d.affiliation ?? "",
    hall: d.hall ?? "",
    workOptions: d.workOptions ?? "",
  });

  return { ok: true };
}

/* ————————————————————————— adoption applications ————————————————————————— */

async function persistAdoption(input: SubmissionInput): Promise<SubmissionResult> {
  const supabase = createServiceSupabase();
  const d = input.data;
  const code = generateCode("APP");

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
        return {
          ok: false,
          error: `Database write failed: ${error.message}`,
        };
      }
    } else {
      console.warn(
        `[submissions/adoption] animal slug '${d.animalSlug}' not found; skipping DB insert but still forwarding to Sheet`
      );
    }
  }

  await forwardToSheet("adoption", {
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

  return { ok: true, code };
}

/* ————————————————————————— helpers ————————————————————————— */

async function forwardToSheet(
  form: "bite" | "report" | "volunteer" | "adoption",
  data: Record<string, string>
) {
  try {
    await submitToGoogleSheet({ form, data });
  } catch (err) {
    // Sheet is a mirror — a failed forward is loggable but not
    // user-facing. Sync-engine reconciliation covers the gap.
    console.warn(
      `[submissions] forwardToSheet(${form}) failed:`,
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

function generateCode(prefix: string): string {
  const year = new Date().getUTCFullYear();
  const rand = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");
  return `${prefix}-${year}-${rand}`;
}
