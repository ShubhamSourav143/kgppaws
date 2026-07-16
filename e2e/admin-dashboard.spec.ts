import { expect, test } from "@playwright/test";

test("demo mode is active on the test server (guards the whole E2E suite's premise)", async ({
  page,
}) => {
  await page.goto("/login");
  // Exact match: "Demo mode" also appears (non-exact) inside the footer's
  // unrelated "Demo mode — sample data" site-wide badge.
  await expect(page.getByText("Demo mode", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /explore as admin/i })).toBeVisible();
});

test("exploring as admin lands on the operations dashboard with live stats", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /explore as admin/i }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Operations" })).toBeVisible();
  await expect(page.getByText("OPEN RESCUE REPORTS")).toBeVisible();
  // exact: the sidebar nav link "Animals" vs. the stat-card link "Animals in care"
  await expect(page.getByRole("link", { name: "Animals", exact: true })).toBeVisible();
});

test("exploring as volunteer lands on the volunteer dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /explore as volunteer/i }).click();
  await expect(page).toHaveURL(/\/dashboard\/volunteer$/);
  await expect(page.getByRole("heading", { name: /on duty/i })).toBeVisible();
});

test("a signed-out visitor hitting /admin directly is challenged, not shown the dashboard", async ({
  page,
}) => {
  await page.goto("/admin");
  // RequireRole guard: no session yet, so the sign-in challenge renders
  // instead of dashboard content. The real authority is Postgres RLS (see
  // docs/DATABASE_SCHEMA.md) — this only checks the client-side UX guard.
  await expect(page.getByRole("heading", { name: /sign in to continue/i })).toBeVisible();
  await expect(page.getByText("OPEN RESCUE REPORTS")).not.toBeVisible();
});
