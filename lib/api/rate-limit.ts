/**
 * Minimal fixed-window rate limiter for the unauthenticated public endpoints.
 *
 * HONEST ABOUT WHAT THIS IS: the counter lives in the module scope of one
 * serverless instance, so the effective limit is (limit x number of warm
 * instances) and a cold start resets it. It is not a substitute for an edge
 * WAF or a Redis-backed limiter, and it will not stop a distributed flood.
 *
 * It is still worth having. /api/sheets writes rows with the RLS-bypassing
 * service role and pages the rescue coordinator's WhatsApp on every rescue
 * report; /api/upload/sign mints signed writes into a public bucket. Before
 * this, a single laptop could fill the volunteers' spreadsheet, exhaust the
 * Resend quota and bury a real emergency under alert fatigue with a `for`
 * loop. A per-instance cap turns that from trivial into deliberate.
 *
 * Upgrade path when traffic warrants it: swap the Map for Upstash/Vercel KV —
 * the call signature here is designed not to change.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/** Bound the Map so a spray of unique IPs can't grow it without limit. */
const MAX_TRACKED_KEYS = 10_000;

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the window resets — for the Retry-After header. */
  retryAfter: number;
}

/**
 * Identify the caller. Vercel sets x-forwarded-for; the leftmost entry is the
 * client. Falls back to a constant so a request with no forwarded header is
 * still counted (shared bucket) rather than silently exempt.
 */
export function clientKey(request: Request, scope: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  return `${scope}:${ip}`;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    if (buckets.size >= MAX_TRACKED_KEYS) {
      // Drop whatever has already expired; if nothing has, clear the lot. A
      // rebuilt window is a far better failure mode than unbounded memory.
      for (const [k, v] of buckets) {
        if (now >= v.resetAt) buckets.delete(k);
      }
      if (buckets.size >= MAX_TRACKED_KEYS) buckets.clear();
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  existing.count += 1;
  if (existing.count > limit) {
    return { ok: false, retryAfter: Math.ceil((existing.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfter: 0 };
}

/** Shared 429 so every limited endpoint answers identically. */
export function tooManyRequests(retryAfter: number): Response {
  return Response.json(
    { error: "Too many requests. Please wait a moment and try again." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}
