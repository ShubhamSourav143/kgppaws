import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase/server";

/**
 * POST /api/donate/confirm
 *
 * UPI donation confirmation. Donor submits UTR + amount after paying via
 * QR. Never marks anything verified from client input — that's an admin
 * action. RLS grants only the allow-listed columns to public insert.
 */

const BodySchema = z.object({
  campaignSlug: z.string().min(1).max(100),
  donorName: z.string().min(1).max(100),
  donorEmail: z.string().email().optional(),
  donorPhone: z.string().max(30).optional(),
  amount: z.number().int().min(1).max(10_000_000),
  utr: z.string().min(1).max(50),
  purpose: z.string().max(300).optional(),
  message: z.string().max(1000).optional(),
});

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "donations API requires Supabase; still in demo mode" },
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

  const { error } = await supabase.from("donation_confirmations").insert({
    campaign_slug: body.campaignSlug,
    donor_name: body.donorName,
    donor_email: body.donorEmail ?? null,
    donor_phone: body.donorPhone ?? null,
    amount: body.amount,
    utr: body.utr,
    purpose: body.purpose ?? null,
    message: body.message ?? null,
  });
  if (error) {
    return NextResponse.json({ error: "insert_failed", details: error.message }, { status: 500 });
  }

  const service = createServiceSupabase();
  if (service) {
    await service.from("notification_outbox").insert({
      channel: "email",
      template: "donation_confirmation",
      payload: {
        campaign: body.campaignSlug,
        amount: body.amount,
        donor: body.donorName,
      },
    });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
