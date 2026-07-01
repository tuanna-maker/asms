import { test, expect, loginAs } from "./fixtures/auth";

for (const [name, path] of [
  ["dashboard", "/"],
  ["handovers", "/ban-giao"],
  ["warranties", "/bao-hanh"],
  ["materials", "/vat-tu"],
  ["feedbacks", "/phan-anh"],
  ["reports", "/bao-cao"],
  ["documents", "/tai-lieu"],
  ["workflows", "/quy-trinh"],
  ["settings", "/cai-dat"],
  ["notifications", "/thong-bao"],
  ["tasks", "/cong-viec"],
  ["training", "/dao-tao"],
  ["research", "/de-tai"],
  ["products", "/san-pham"],
] as const) {
  test.describe(`smoke ${name}`, () => {
    test(`admin load ${path}`, async ({ page }) => {
      await loginAs(page, "admin");
      await page.goto(path);
      await expect(page.locator("body")).not.toContainText("Application error");
      await expect(page).not.toHaveURL(/\/login$/);
    });
  });
}

test.describe("UC-DASH", () => {
  test("dashboard tabs visible", async ({ page }) => {
    await loginAs(page, "admin");
    await page.goto("/");
    await expect(page.getByText(/tổng quan|khách hàng|cảnh báo/i).first()).toBeVisible({ timeout: 15_000 });
  });
});
