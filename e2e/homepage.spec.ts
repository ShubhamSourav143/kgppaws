import { expect, test } from "@playwright/test";

test("homepage renders the hero, tagline and primary CTAs", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/KGP PAWS/);
  await expect(
    page.getByRole("heading", { level: 1, name: /Every Paw Has a\s*Story/i })
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Meet Our Paws" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Help an Animal" })).toBeVisible();
});

test("header report link navigates to the report page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /report an animal/i }).first().click();
  await expect(page).toHaveURL(/\/report$/);
});
