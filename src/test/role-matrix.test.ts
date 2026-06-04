import { describe, expect, it } from "vitest";
import { getAllowedModuleLabels, moduleAllowedForRole } from "@/lib/role-matrix";
import { getDefaultCrudForModule } from "../../backend/src/config/role-permissions-defaults";

describe("role matrix sync với ROUTE_PERMISSIONS", () => {
  it("technician không mở Hợp đồng; có Vật tư và Bàn giao", () => {
    expect(moduleAllowedForRole("technician", ["/hop-dong"])).toBe(false);
    expect(moduleAllowedForRole("technician", ["/vat-tu"])).toBe(true);
    expect(moduleAllowedForRole("technician", ["/ban-giao"])).toBe(true);
    const mods = getAllowedModuleLabels("technician");
    expect(mods).toContain("Vật tư");
    expect(mods).not.toContain("Hợp đồng");
  });

  it("sales có CRM và Báo cáo", () => {
    expect(getAllowedModuleLabels("sales")).toEqual(expect.arrayContaining(["Khách hàng", "Báo cáo"]));
  });

  it("technician và viewer truy cập màn Phản ánh", () => {
    expect(moduleAllowedForRole("technician", ["/phan-anh"])).toBe(true);
    expect(moduleAllowedForRole("viewer", ["/phan-anh"])).toBe(true);
    expect(getAllowedModuleLabels("technician")).toContain("Phản ánh");
  });

  it("viewer không truy cập Đề tài", () => {
    expect(moduleAllowedForRole("viewer", ["/de-tai"])).toBe(false);
  });
});

describe("DEFAULT_ROLE_PERMISSIONS khớp menu", () => {
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
