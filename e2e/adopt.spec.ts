import { expect, test } from "@playwright/test";

test("adopt page lists all demo animals by default", async ({ page }) => {
  await page.goto("/adopt");
  await expect(page.getByText("8 paws found")).toBeVisible();
});

test("search narrows results to a single matching animal", async ({ page }) => {
  await page.goto("/adopt");
  await page
    .getByRole("searchbox", { name: /search adoptable animals/i })
    .fill("biscuit");
  await expect(page.getByText("1 paw found")).toBeVisible();
  await expect(page.getByRole("link", { name: /simba/i }).first()).toBeVisible();
});

test("searching for something that matches nothing shows an empty state, not a crash", async ({
  page,
}) => {
  await page.goto("/adopt");
  await page
    .getByRole("searchbox", { name: /search adoptable animals/i })
    .fill("zzzznomatchzzzz");
  await expect(page.getByText("0 paws found")).toBeVisible();
});
