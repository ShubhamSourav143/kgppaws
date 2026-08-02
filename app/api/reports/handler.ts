import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase/server";

/**
 * POST /api/reports
 *
 * Public write. Anonymous-friendly. Inserts into rescue_reports, writes a
 * notification_outbox row, returns a public report code.
 *
 * The DB→Sheets trigger (migration 0009) enqueues a sync job automatically.
 */

const BodySchema = z.object({
  animalType: z.enum(["dog", "cat", "other"]),
  problem: z.enum([
    "injured",
    "sick",
    "unable_to_walk",
    "bleeding",
    "vehicle_accident",
    "distressed",
    "puppies_kittens_at_risk",
    "missing",
    "deceased",
    "other",
  ]),
  severity: z.enum(["emergency", "urgent", "moderate", "low"]),
  zoneId: z.string().min(1).max(64),
  locationNote: z.string().max(500).optional(),
  description: z.string().min(1).max(2000),
  contact: z.string().max(200).optional(),
  photoPath: z.string().max(500).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "reports API requires Supabase; still in demo mode" },
      { status: 503 }
    );
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch (e) {
    return NextResponse.json(
      { error: "invalid body", details: e instanceof Error ? e.message : String(e) },
      { status: 400 }
    );
  }

  const reportCode = generateReportCode();

  const insertPayload = {
    report_code: reportCode,
    animal_type: body.animalType,
    problem: body.problem,
    severity: body.severity,
    zone_id: body.zoneId,
    location_note: body.locationNote ?? null,
    description: body.description,
    reporter_contact: body.contact ?? null,
    photo_path: body.photoPath ?? null,
    lat: body.lat ?? null,
    lng: body.lng ?? null,
    status: "reported" as const,
  };

  const { error } = await supabase.from("rescue_reports").insert(insertPayload);
  if (error) {
    return NextResponse.json({ error: "insert_failed", details: error.message }, { status: 500 });
  }

  // Best-effort outbox write via service role so it isn't blocked by RLS on notifications.
  const service = createServiceSupabase();
  if (service) {
    await service.from("notification_outbox").insert({
      channel: "email",
      template: "new_report",
      payload: { reportCode, severity: body.severity, animalType: body.animalType, zone: body.zoneId },
    });
    await service.from("notification_outbox").insert({
      channel: "whatsapp",
      template: "new_report",
      payload: { reportCode, severity: body.severity, animalType: body.animalType, zone: body.zoneId },
    });
  }

  return NextResponse.json({ reportCode }, { status: 201 });
}

function generateReportCode(): string {
  const year = new Date().getUTCFullYear();
  const rand = Math.floor(Math.random() * 100000).toString().padStart(5, "0");
  return `PAWS-RESCUE-${year}-${rand}`;
}
