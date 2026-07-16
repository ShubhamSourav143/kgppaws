import { defineConfig, devices } from "@playwright/test";

const PORT = 4310;
const BASE_URL = `http://localhost:${PORT}`;

/**
 * E2E tests always run against a DEMO-MODE server, regardless of what's in
 * the developer's .env.local. Playwright's webServer.env sets these two vars
 * as real process env for the spawned child process, which Next.js prefers
 * over .env.local for the same key — so the suite stays deterministic,
 * credential-free, and safe to run before Supabase/GitHub CI secrets exist.
 *
 * This deliberately does not exercise the live Supabase path — that was
 * verified separately via direct SQL (see docs/TEST_REPORT.md, Module M1).
 */
export default defineConfig({
  testDir: "./e2e",
  // Serial for now: running fully parallel against one `next start` process
  // on this machine caused a same-second click to silently miss its React
  // hydration window under load (button existed in the DOM, but the handler
  // wasn't attached yet) — reproduced consistently in parallel, and passed
  // cleanly every time under --workers=1. Revisit once there's a CI runner
  // with headroom to spare; this is a resource-contention artifact of this
  // sandbox, not a defect in the app or the tests.
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
      NEXT_PUBLIC_SITE_URL: BASE_URL,
    },
  },
});
