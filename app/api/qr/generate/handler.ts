import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import QRCode from "qrcode";
import { randomUUID } from "node:crypto";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase/server";
import { SITE } from "@/lib/config";

/**
 * POST /api/qr/generate
 *
 * Admin-authenticated. Generates a QR PNG for a given animal:
 *   1. Ensure the animal has a public_id (assigned by DB trigger on insert)
 *   2. Issue a new qr_tags row (token = uuid) unless one is already active
 *   3. Render QR code (error-correction H for outdoor wear) → return PNG
 *
 * The URL encoded in the QR is /dog/<public_id> — human-readable and stable.
 * The token in qr_tags is retained as the revocable fallback via /p/<token>.
 */

const BodySchema = z.object({
  animalId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  if (!supabase) return NextResponse.json({ error: "supabase not configured" }, { status: 503 });
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  // Approved staff/moderators/admins can mint animal QR codes. Signups
  // that are still pending admin approval (see migration 0012) are
  // filtered out by the is_approved gate — until an admin flips it, they
  // cannot generate QR codes for animals.
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role, is_approved")
    .eq("user_id", userData.user.id);
  const approvedRoles = new Set(
    (roleData ?? [])
      .filter((r: { is_approved?: boolean }) => r.is_approved !== false)
      .map((r) => r.role)
  );
  if (
    !approvedRoles.has("admin") &&
    !approvedRoles.has("super_admin") &&
    !approvedRoles.has("volunteer")
  ) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
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

  const service = createServiceSupabase();
  if (!service) return NextResponse.json({ error: "service role not configured" }, { status: 503 });

  const { data: animal, error: aErr } = await service
    .from("animals")
    .select("id, public_id, name")
    .eq("id", body.animalId)
    .maybeSingle();
  if (aErr || !animal) {
    return NextResponse.json({ error: "animal not found" }, { status: 404 });
  }

  // Ensure an active tag exists; reuse when possible.
  const { data: existingTag } = await service
    .from("qr_tags")
    .select("*")
    .eq("animal_id", animal.id)
    .eq("active", true)
    .maybeSingle();

  let token: string;
  if (existingTag) {
    token = existingTag.token as string;
  } else {
    token = randomUUID();
    const { error: tagErr } = await service.from("qr_tags").insert({
      animal_id: animal.id,
      token,
      active: true,
    });
    if (tagErr) {
      return NextResponse.json({ error: "tag insert failed", details: tagErr.message }, { status: 500 });
    }
  }

  const targetUrl = `${SITE.url}/dog/${animal.public_id}`;
  const png = await QRCode.toBuffer(targetUrl, {
    errorCorrectionLevel: "H",
    margin: 2,
    scale: 12,
  });

  return new NextResponse(png as unknown as BodyInit, {
    status: 200,
    headers: {
      "content-type": "image/png",
      "content-disposition": `attachment; filename=\"${animal.public_id}.png\"`,
      "x-paws-token": token,
      "x-paws-target": targetUrl,
    },
  });
}
