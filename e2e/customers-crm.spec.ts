import { test, expect, loginAs } from "./fixtures/auth";

test.describe("UC-KH CRM", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "sales");
    await page.goto("/khach-hang");
  });

  test("UC-KH-01 danh sách KH", async ({ page }) => {
    await expect(page.getByText(/khách hàng/i).first()).toBeVisible();
  });

  test("UC-KH-03 validation tạo KH thiếu tên", async ({ page }) => {
    const createBtn = page.getByRole("button", { name: /^Tạo/i }).first();
    if (await createBtn.count()) {
      await createBtn.click();
      const saveBtn = page.getByRole("button", { name: /Lưu|Tạo/i }).first();
      if (await saveBtn.count()) {
        await saveBtn.click();
        await expect(page.getByText(/nhập tên|vui lòng/i).first()).toBeVisible({ timeout: 10_000 });
      }
    }
  });
});
