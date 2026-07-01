import { test, expect, loginAs } from "./fixtures/auth";

test.describe("UC-AUTH", () => {
  test("UC-AUTH-01 đăng nhập thành công", async ({ page }) => {
    await loginAs(page, "admin");
    await expect(page.getByText(/bảng điều khiển|dashboard/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test("UC-AUTH sai mật khẩu hiển thị lỗi", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("admin@demo.local");
    await page.getByLabel("Mật khẩu").fill("wrong-password");
    await page.getByRole("button", { name: "Đăng nhập" }).click();
    await expect(page.getByText("Đăng nhập thất bại")).toBeVisible();
  });
});
