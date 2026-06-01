import { describe, expect, it } from "vitest";
import { formatDisplayLabel, getProductStatusLabel } from "@/lib/display-labels";

describe("display-labels", () => {
  it("formatDisplayLabel trả nhãn tiếng Việt cho mã đã biết", () => {
    expect(formatDisplayLabel("online")).toBe("Trực tuyến");
    expect(formatDisplayLabel("developing")).toBe("Đang phát triển");
    expect(formatDisplayLabel("admin")).toBe("Quản trị");
  });

  it("getProductStatusLabel xử lý null/undefined", () => {
    expect(getProductStatusLabel(null)).toBe("—");
    expect(getProductStatusLabel("produced")).toBe("Sản xuất xong");
  });
});
