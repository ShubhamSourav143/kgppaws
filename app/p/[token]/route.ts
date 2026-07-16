import { NextRequest, NextResponse } from "next/server";
import { resolveQrToken } from "@/services/animals";

/**
 * QR resolution endpoint — kgppaws.org/p/{qrToken}
 *
 * Physical collar tags encode this URL. The opaque token is resolved to
 * the animal's *current* public profile, which lets admins replace lost
 * tags or re-point a token without reprinting history. Database UUIDs are
 * never encoded in public QR codes.
 *
 * Privacy: scan analytics (timestamp / coarse device class) can be logged
 * here in live mode — never scanner identity or location without consent.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const animal = await resolveQrToken(token.toLowerCase());

  if (!animal) {
    return NextResponse.redirect(new URL("/scan-not-found", request.url));
  }

  return NextResponse.redirect(
    new URL(`/animal/${animal.slug}?via=qr`, request.url)
  );
}
