import { describe, expect, it } from "vitest";
import { buildDashboardAlertSummaries, computeDashboardAlertMetrics } from "@/lib/dashboard-alerts";
import { emptyDashboardData } from "@/data/dashboardData";

describe("dashboard-alerts", () => {
  it("computeDashboardAlertMetrics tổng hợp chậm tiến độ", () => {
    const data = {
      ...emptyDashboardData,
      contract: { ...emptyDashboardData.contract, late: 2, total: 10 },
      handover: { ...emptyDashboardData.handover, late: 1, total: 5 },
      complaint: { ...emptyDashboardData.complaint, processing: 3, late: 1 },
    };
    const m = computeDashboardAlertMetrics(data);
    expect(m.totalLate).toBe(4);
    expect(m.overdueContracts).toBe(2);
    expect(m.pendingComplaints).toBe(3);
    expect(m.criticalCount).toBeGreaterThan(0);
    expect(m.hasIssues).toBe(true);
  });

  it("buildDashboardAlertSummaries trả về mục none khi không có vấn đề", () => {
    const alerts = buildDashboardAlertSummaries(emptyDashboardData);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].id).toBe("none");
  });
});
