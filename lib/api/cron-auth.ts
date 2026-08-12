/**
 * Shared authentication for cron-triggered endpoints.
 *
 * Vercel Cron invokes the path in vercel.json with an HTTP **GET** and, when
 * CRON_SECRET is set on the project, an `Authorization: Bearer <CRON_SECRET>`
 * header — it does NOT send `x-cron-secret`. The handlers here originally only
 * checked `x-cron-secret`, so every scheduled run 401'd (and, being POST-only,
 * 404'd before that). Both forms are accepted now: `Authorization: Bearer …`
 * for Vercel, `x-cron-secret` for the manual curl/script callers documented in
 * docs/DEPLOYMENT.md.
 *
 * Fails closed: with CRON_SECRET unset nothing is authorized, so a
 * misconfigured deploy can't leave the sync engine open to the internet.
 */

import type { NextRequest } from "next/server";

/** Length-independent, branch-free comparison — no early return on first mismatch. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function isCronAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const bearer = request.headers.get("authorization");
  if (bearer && safeEqual(bearer, `Bearer ${secret}`)) return true;

  const legacy = request.headers.get("x-cron-secret");
  if (legacy && safeEqual(legacy, secret)) return true;

  return false;
}

/** Shared 401 body so every cron endpoint answers an unauthorized caller identically. */
export function cronUnauthorized(): Response {
  return Response.json({ error: "unauthorized" }, { status: 401 });
}
