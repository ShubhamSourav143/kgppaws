import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { isSupabaseConfigured } from "@/lib/config";

/**
 * Cookie-less anon client for build-time contexts (generateStaticParams,
 * sitemap) where there is no HTTP request and `cookies()` throws.
 *
 * There is no session to read at build time, so no auth context is lost:
 * these callers only ever read public data, which RLS already scopes to the
 * anon role.
 */
export function createStaticSupabase() {
  if (!isSupabaseConfigured) return null;
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

/**
 * Service-role client for privileged server-only writes: the Sheets sync
 * engine, Drive media ingest, QR admin operations. Bypasses RLS entirely —
 * never import this from anything reachable by a plain user request; only
 * from cron-secret-gated route handlers.
 *
 * Returns null until SUPABASE_SERVICE_ROLE_KEY is set, matching the same
 * "not configured yet" pattern as every other integration in this app.
 */
export function createServiceSupabase() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

/**
 * Server Supabase client (RSC / route handlers / server actions).
 * Returns null in demo mode — callers must fall back to demo data.
 *
 * All privileged queries (precise rescue coordinates, donor records,
 * internal notes) are additionally protected by Row Level Security —
 * see /supabase/migrations for the policies. Never rely on UI hiding.
 */
export async function createServerSupabase() {
  if (!isSupabaseConfigured) return null;

  let cookieStore: Awaited<ReturnType<typeof cookies>>;
  try {
    cookieStore = await cookies();
  } catch {
    // `cookies()` throws when there is no HTTP request — i.e. build-time
    // generateStaticParams/sitemap. Those read public data only, so fall
    // back to the cookie-less anon client rather than failing the build.
    return createStaticSupabase();
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — safe to ignore when
            // middleware refreshes sessions.
          }
        },
      },
    }
  );
}
