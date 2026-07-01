import { test as base, expect, type Page } from "@playwright/test";

export const DEMO_USERS = {
  admin: { email: "admin@demo.local", password: "Password123!" },
  manager: { email: "manager@demo.local", password: "Password123!" },
  technician: { email: "technician@demo.local", password: "Password123!" },
  sales: { email: "sales@demo.local", password: "Password123!" },
  viewer: { email: "viewer@demo.local", password: "Password123!" },
} as const;

export type DemoRole = keyof typeof DEMO_USERS;

export async function loginAs(page: Page, role: DemoRole) {
  const u = DEMO_USERS[role];
  await page.goto("/login");
  await page.getByLabel("Email").fill(u.email);
  await page.getByLabel("Mật khẩu").fill(u.password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

export const test = base.extend<{ role: DemoRole }>({
  role: ["admin", { option: true }],
});

export { expect };
