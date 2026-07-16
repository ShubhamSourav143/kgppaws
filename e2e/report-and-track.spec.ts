import { expect, test } from "@playwright/test";

test("submitting a report returns a tracking code that resolves on the tracker page", async ({
  page,
}) => {
  await page.goto("/report");

  await page.getByRole("button", { name: "Dog" }).click();
  await page.getByRole("button", { name: "Injured" }).click();
  await page.getByRole("button", { name: "Urgent" }).click();
  await page
    .getByLabel(/nearest campus landmark/i)
    .selectOption({ label: "Technology Market" });
  await page
    .getByPlaceholder(/won't let anyone near/i)
    .fill("Tan dog limping badly near the tea stalls, very wary of people.");

  await page.getByRole("button", { name: "Submit report" }).click();

  await expect(page.getByRole("heading", { name: "Report received." })).toBeVisible();
  const code = await page.locator("p.font-mono").innerText();
  expect(code).toMatch(/^PAWS-RESCUE-2026-\d{5}$/);

  await page.getByRole("link", { name: "Track this report" }).click();
  await expect(page).toHaveURL(new RegExp(`/report/${code}$`));
  await expect(page.getByRole("heading", { name: code })).toBeVisible();
  await expect(
    page.getByText("Tan dog limping badly near the tea stalls")
  ).toBeVisible();
  // "Reported" legitimately renders twice (status chip + stepper label) —
  // either one confirms the freshly submitted report's current status.
  await expect(page.getByText("Reported", { exact: true }).first()).toBeVisible();
});

test("tracking an unknown report code shows a not-found state instead of crashing", async ({
  page,
}) => {
  await page.goto("/report/PAWS-RESCUE-2026-99999");
  await expect(
    page.getByRole("heading", { name: /couldn.t find that report/i })
  ).toBeVisible();
});

test("the seeded demo report can be tracked from a fresh browser", async ({ page }) => {
  await page.goto("/report/PAWS-RESCUE-2026-00124");
  await expect(page.getByRole("heading", { name: "PAWS-RESCUE-2026-00124" })).toBeVisible();
  // Renders twice (status chip + stepper label); either confirms the status.
  await expect(page.getByText("Treatment Started").first()).toBeVisible();
});
