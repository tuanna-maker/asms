import { test, expect, loginAs } from "./fixtures/auth";

test.describe("RBAC menu", () => {
  test("sales không truy cập được trang vật tư", async ({ page }) => {
    await loginAs(page, "sales");
    await page.goto("/vat-tu");
    await expect(page).toHaveURL(/\/(login|403|khong-co-quyen|$)/i);
  });

  test("viewer không thấy nút Tạo trên hợp đồng", async ({ page }) => {
    await loginAs(page, "viewer");
    await page.goto("/hop-dong");
    await expect(page.getByRole("button", { name: /^Tạo/i })).toHaveCount(0);
  });
});
