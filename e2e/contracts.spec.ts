import { test, expect, loginAs } from "./fixtures/auth";

test.describe("UC-HD Hợp đồng", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin");
    await page.goto("/hop-dong");
  });

  test("UC-HD-01 danh sách HĐ load", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /hợp đồng/i }).first()).toBeVisible();
  });

  test("UC-HD-03 validation tạo HĐ trống", async ({ page }) => {
    const createBtn = page.getByRole("button", { name: /^Tạo/i }).first();
    if (await createBtn.count()) {
      await createBtn.click();
      const saveBtn = page.getByRole("button", { name: /Lưu|Tạo mới/i }).first();
      if (await saveBtn.count()) {
        await saveBtn.click();
        await expect(page.locator("[data-sonner-toast], [role=status]").first()).toBeVisible({ timeout: 10_000 });
      }
    }
  });
});
