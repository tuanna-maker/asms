import { describe, expect, it } from "vitest";
import { getAllowedModuleLabels, moduleAllowedForRole } from "@/lib/role-matrix";

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
});
