import { expect, test } from "@playwright/test";

/**
 * Regression test for the exact bug found manually during Module M-A
 * (see docs/CHANGELOG.md, 2026-07-16): the service worker never registered
 * because its effect waited on window's "load" event, which had usually
 * already fired by the time the effect ran. This automates the same
 * "kill the network mid-session" check that first caught it.
 */

test("a previously-visited profile still renders with no network, and an unvisited page falls back to the offline shell", async ({
  page,
}) => {
  await page.goto("/animal/simba");
  await page.evaluate(() => navigator.serviceWorker.ready);

  // Reload once while still online so this exact navigation response is
  // captured by the SW's network-first cache-on-success path.
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "Simba" })).toBeVisible();

  await page.context().setOffline(true);
  try {
    await page.reload();
    await expect(page.getByRole("heading", { level: 1, name: "Simba" })).toBeVisible();
    // Appears twice (header + QR tag card) — either proves it's cache-served.
    await expect(page.getByText("PAWS-KGP-DOG-0012").first()).toBeVisible();

    // A page never opened this session has nothing to serve from cache.
    await page.goto("/animal/mishti");
    await expect(page.getByText(/you.re offline/i)).toBeVisible();
  } finally {
    await page.context().setOffline(false);
  }
});

test("the manifest and icons are reachable", async ({ request }) => {
  const manifest = await request.get("/manifest.webmanifest");
  expect(manifest.ok()).toBe(true);
  const body = await manifest.json();
  expect(body.short_name).toBe("KGP PAWS");
  expect(body.icons.length).toBeGreaterThanOrEqual(3);

  for (const icon of body.icons) {
    const res = await request.get(icon.src);
    expect(res.ok(), `icon ${icon.src} should be reachable`).toBe(true);
  }
});
