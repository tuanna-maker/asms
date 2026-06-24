import { describe, expect, it } from "vitest";
import {
  isInReportDateRange,
  matchesReportCustomerFilter,
  resolveReportDateRange,
} from "@/lib/report-filters";

describe("report-filters date range", () => {
  it("resolveReportDateRange theo năm", () => {
    const range = resolveReportDateRange({ year: "2026" });
    expect(range).not.toBeNull();
    expect(range!.start.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(range!.end.toISOString()).toBe("2026-12-31T23:59:59.999Z");
  });

  it("resolveReportDateRange theo from/to quý", () => {
    const range = resolveReportDateRange({ year: "2026", from: "2026-01-01", to: "2026-03-31" });
    expect(isInReportDateRange("2026-02-15T00:00:00.000Z", range)).toBe(true);
    expect(isInReportDateRange("2026-04-01T00:00:00.000Z", range)).toBe(false);
  });

  it("matchesReportCustomerFilter", () => {
    expect(matchesReportCustomerFilter("c1", { customerId: "c1" })).toBe(true);
    expect(matchesReportCustomerFilter("c2", { customerId: "c1" })).toBe(false);
    expect(matchesReportCustomerFilter("c2", { year: "2026" })).toBe(true);
  });
});
