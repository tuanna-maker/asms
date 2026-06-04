import { describe, expect, it } from "vitest";

import { getDefaultCrudForModule } from "../../config/role-permissions-defaults";
import { roleCanPerformAction } from "./service";

describe("roleCanPerformAction", () => {
  it("admin luôn có mọi quyền (không cần DB)", async () => {
    await expect(roleCanPerformAction("admin", "hop-dong", "delete")).resolves.toBe(true);
    await expect(roleCanPerformAction("admin", "cai-dat.phan-quyen", "update")).resolves.toBe(true);
  });
});

describe("DEFAULT_ROLE_PERMISSIONS", () => {
  it("technician không đọc hop-dong", () => {
    expect(getDefaultCrudForModule("technician", "hop-dong").read).toBe(false);
  });

  it("sales có quyền tạo hop-dong", () => {
    expect(getDefaultCrudForModule("sales", "hop-dong").create).toBe(true);
  });

  it("viewer không đọc de-tai", () => {
    expect(getDefaultCrudForModule("viewer", "de-tai").read).toBe(false);
  });
});
