import { expect, test } from "@playwright/test";

test("scanning a valid QR token resolves to that animal's profile with the scan greeting", async ({
  page,
}) => {
  await page.goto("/p/t7kd2mqx");
  await expect(page).toHaveURL(/\/animal\/simba\?via=qr$/);
  await expect(page.getByText(/you just met simba/i)).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Simba" })).toBeVisible();
  // The PAWS ID legitimately appears twice (identity header + QR tag flip
  // card) — either occurrence proves the profile loaded correctly.
  await expect(page.getByText("PAWS-KGP-DOG-0012").first()).toBeVisible();
});

test("visiting an animal profile directly (not via QR) skips the scan greeting", async ({
  page,
}) => {
  await page.goto("/animal/simba");
  await expect(page.getByRole("heading", { level: 1, name: "Simba" })).toBeVisible();
  await expect(page.getByText(/you just met simba/i)).not.toBeVisible();
});

test("scanning an unknown token lands on the scan-not-found page", async ({ page }) => {
  await page.goto("/p/this-token-does-not-exist");
  await expect(page).toHaveURL(/\/scan-not-found$/);
});
