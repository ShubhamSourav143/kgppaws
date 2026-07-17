/**
 * Postgres advisory locks per tab.
 *
 * Every sync worker acquires the tab's lock before doing any work, so two
 * workers running in parallel never apply to the same tab simultaneously.
 * Different tabs proceed independently.
 *
 * The lock is released either by explicit call to releaseLock() OR
 * automatically by Postgres when the session ends (worker crash). We do NOT
 * rely on the session-close cleanup as the primary path because Supabase-JS
 * uses HTTP requests, not a persistent session — so releases here must be
 * explicit. See sync_try_acquire_lock / sync_release_lock in migration 0006.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export async function tryAcquireLock(
  supabase: SupabaseClient,
  tabName: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc("sync_try_acquire_lock", {
    tab_name: tabName,
  });
  if (error) throw new Error(`sync_try_acquire_lock failed: ${error.message}`);
  return Boolean(data);
}

export async function releaseLock(
  supabase: SupabaseClient,
  tabName: string
): Promise<void> {
  const { error } = await supabase.rpc("sync_release_lock", {
    tab_name: tabName,
  });
  if (error) {
    // Not fatal — Postgres will auto-release when the session ends. Log for
    // visibility but don't throw, because the worker's main path should
    // still record success/failure on the job.
    console.error(`sync_release_lock failed: ${error.message}`);
  }
}
