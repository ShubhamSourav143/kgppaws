import { expect, test, describe, beforeAll, afterAll } from "vitest";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { enqueueJob, claimNextJob, heartbeat, completeJob, runHousekeeping } from "./queue";
import * as fs from "fs";
import * as path from "path";

const envStr = fs.readFileSync(path.resolve(process.cwd(), ".env.local"), "utf-8");
const envVars = Object.fromEntries(
  envStr.split("\n")
    .filter(line => line && !line.startsWith("#"))
    .map(line => line.split("=").map(s => s.trim()))
);

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;

// Only run if we have a service role key
const shouldRun = !!SUPABASE_URL && !!SUPABASE_SERVICE_ROLE_KEY;

describe.runIf(shouldRun)("Sync Queue Integration", () => {
  let supabase: SupabaseClient;

  beforeAll(() => {
    supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
  });

  // Clean up any stray test jobs
  afterAll(async () => {
    await supabase.from("sync_jobs").delete().eq("tab", "TestTab");
  });

  test("enqueueJob dedups concurrent identical requests", async () => {
    const args = {
      tab: "TestTab",
      direction: "sheets_to_db" as const,
      triggeredBy: "cron" as const,
    };

    const res1 = await enqueueJob(supabase, args);
    expect(res1.state).toBe("queued");
    expect(res1.jobId).toBeTruthy();

    const res2 = await enqueueJob(supabase, args);
    expect(res2.state).toBe("already_running");
    expect(res2.jobId).toBe(res1.jobId);
  });

  test("claimNextJob claims exactly one job and establishes lease", async () => {
    const job = await claimNextJob(supabase);
    expect(job).toBeTruthy();
    expect(job?.tab).toBe("TestTab");
    expect(job?.state).toBe("running");

    // The lease is now held. A second claim should return null 
    // because no other tabs are queued, and TestTab is leased.
    const job2 = await claimNextJob(supabase);
    expect(job2).toBeNull();
  });

  test("heartbeat updates the heartbeat_at timestamp", async () => {
    // get current job
    const { data } = await supabase.from("sync_jobs").select("id, heartbeat_at").eq("tab", "TestTab").single();
    const before = data!.heartbeat_at;

    // wait a tiny bit
    await new Promise(r => setTimeout(r, 100));
    await heartbeat(supabase, data!.id);

    const { data: data2 } = await supabase.from("sync_jobs").select("heartbeat_at").eq("id", data!.id).single();
    expect(new Date(data2!.heartbeat_at).getTime()).toBeGreaterThan(new Date(before).getTime());
  });

  test("completeJob transitions to succeeded", async () => {
    const { data } = await supabase.from("sync_jobs").select("id").eq("tab", "TestTab").single();
    await completeJob(supabase, {
      jobId: data!.id,
      finalState: "succeeded",
      rowsRead: 10,
      rowsWritten: 5,
    });

    const { data: final } = await supabase.from("sync_jobs").select("state, rows_read, rows_written").eq("id", data!.id).single();
    expect(final?.state).toBe("succeeded");
    expect(final?.rows_read).toBe(10);
    expect(final?.rows_written).toBe(5);
  });

  test("runHousekeeping retries expired jobs", async () => {
    // create a fake expired running job
    await supabase.from("sync_jobs").insert({
      tab: "TestTabHousekeeping",
      direction: "sheets_to_db",
      state: "running",
      heartbeat_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 mins ago (expired)
      attempt: 1,
      max_attempts: 4,
      triggered_by: "cron",
    }).select("id").single();

    const stats = await runHousekeeping(supabase);
    expect(stats.expired).toBeGreaterThanOrEqual(1);
    expect(stats.retried).toBeGreaterThanOrEqual(1);

    // Should have created a new queued job for attempt 2
    const { data: retries } = await supabase.from("sync_jobs").select("attempt, state").eq("tab", "TestTabHousekeeping").order("attempt", { ascending: false });
    expect(retries![0].attempt).toBe(2);
    expect(retries![0].state).toBe("queued");
    
    // clean up
    await supabase.from("sync_jobs").delete().eq("tab", "TestTabHousekeeping");
  });
});
