import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase/server";

/**
 * POST /api/adopt/apply
 *
 * Public write. Anonymous submissions permitted; if the caller is signed-in,
 * their user id is attached as applicant_id. Never accepts staff-only fields
 * (status/internal_notes/approved_by) from the client — those are always set
 * on the server or by admins later.
 */

const ApplicantSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().max(30).optional(),
  affiliation: z.string().max(200).optional(),
});
const LivingSchema = z.object({
  situation: z.string().max(300),
  otherPets: z.string().max(300).optional(),
  outdoorSpace: z.string().max(200).optional(),
});
const ExperienceSchema = z.object({
  previous: z.string().max(500).optional(),
  currentPets: z.string().max(300).optional(),
});
const BodySchema = z.object({
  animalSlug: z.string().min(1).max(100),
  applicant: ApplicantSchema,
  living: LivingSchema,
  experience: ExperienceSchema,
  motivation: z.string().min(10).max(2000),
});

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "adoption API requires Supabase; still in demo mode" },
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

  const { data: animal, error: aErr } = await supabase
    .from("animals")
    .select("id, slug, name")
    .eq("slug", body.animalSlug)
    .maybeSingle();
  if (aErr) {
    return NextResponse.json({ error: "animal lookup failed", details: aErr.message }, { status: 500 });
  }
  if (!animal) {
    return NextResponse.json({ error: "unknown animal" }, { status: 404 });
  }

  const { data: userData } = await supabase.auth.getUser();
  const applicantId = userData?.user?.id ?? null;

  const appCode = generateAppCode();

  const { error } = await supabase.from("adoption_applications").insert({
    app_code: appCode,
    animal_id: animal.id,
    applicant_id: applicantId,
    applicant: body.applicant,
    living: body.living,
    experience: body.experience,
    motivation: body.motivation,
    status: "submitted",
  });
  if (error) {
    return NextResponse.json({ error: "insert_failed", details: error.message }, { status: 500 });
  }

  const service = createServiceSupabase();
  if (service) {
    await service.from("notification_outbox").insert({
      channel: "email",
      template: "adoption_application",
      payload: { appCode, animalName: animal.name, applicant: body.applicant.name },
    });
  }

  return NextResponse.json({ applicationCode: appCode }, { status: 201 });
}

function generateAppCode(): string {
  const year = new Date().getUTCFullYear();
  const rand = Math.floor(Math.random() * 100000).toString().padStart(5, "0");
  return `PAWS-ADOPT-${year}-${rand}`;
}
