import { describe, expect, it } from "vitest";
import {
  SEVERITY_LABELS,
  STATUS_LABELS,
  formatFeedbackDate,
  toDateInputValue,
} from "@/lib/customer-feedback-labels";

describe("customer-feedback-labels", () => {
  it("maps severity and status to Vietnamese", () => {
    expect(SEVERITY_LABELS.high).toBe("Cao");
    expect(STATUS_LABELS.processing).toBe("Đang xử lý");
  });

  it("formatFeedbackDate returns dd/mm/yyyy", () => {
    expect(formatFeedbackDate("2026-05-21T10:00:00.000Z")).toMatch(/^\d{2}\/\d{2}\/2026$/);
    expect(formatFeedbackDate(null)).toBe("—");
  });

  it("toDateInputValue returns ISO date slice", () => {
    expect(toDateInputValue("2026-01-15T00:00:00.000Z")).toBe("2026-01-15");
  });
});
