import { test, expect } from "@playwright/test";

test.describe("Home page", () => {
  test("shows login page when not authenticated", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/login/);
  });
});
