import type { DashboardData } from "@/data/dashboardData";

export type DashboardAlertSeverity = "critical" | "warning" | "info";

export type DashboardAlertSummary = {
  id: string;
  title: string;
  description: string;
  severity: DashboardAlertSeverity;
};

export type DashboardAlertMetrics = {
  totalLate: number;
  criticalCount: number;
  warningCount: number;
  actionableAlertCount: number;
  overdueContracts: number;
  pendingComplaints: number;
  complaintLate: number;
  hasIssues: boolean;
};

/** Chỉ số tổng hợp cho badge / banner dashboard */
export function computeDashboardAlertMetrics(data: DashboardData): DashboardAlertMetrics {
  const totalLate =
    data.contract.late + data.handover.late + data.training.late + data.complaint.late;

  let criticalCount = 0;
  let warningCount = 0;
  if (data.contract.late > 0) criticalCount++;
  if (data.handover.late > 0) criticalCount++;
  if (data.complaint.late > 0) criticalCount++;
  if (data.training.late > 0) warningCount++;
  if (data.complaint.processing > 0) warningCount++;

  const pakdMaterialItems = data.pakd.materials?.items ?? data.pakd.items ?? [];
  const pakdHighRemaining = pakdMaterialItems.filter(
    (p) => p.total > 0 && p.remaining / p.total > 0.5,
  );
  if (pakdHighRemaining.length > 0) warningCount++;
  if (data.product.producing > data.product.equipped) warningCount++;

  const actionableAlertCount = criticalCount + warningCount;

  return {
    totalLate,
    criticalCount,
    warningCount,
    actionableAlertCount,
    overdueContracts: data.contract.late,
    pendingComplaints: data.complaint.processing,
    complaintLate: data.complaint.late,
    hasIssues: totalLate > 0 || data.complaint.processing > 0 || actionableAlertCount > 0,
  };
}

/** Danh sách cảnh báo hiển thị (tab Cảnh báo, banner CEO) */
export function buildDashboardAlertSummaries(data: DashboardData): DashboardAlertSummary[] {
  const alerts: DashboardAlertSummary[] = [];
  const totalRevenue = data.customerRevenue.reduce((s, c) => s + c.revenue, 0);
  const avgRevenue =
    data.customerRevenue.length > 0 ? totalRevenue / data.customerRevenue.length : 0;
  const lowRevenueCustomers = data.customerRevenue.filter(
    (c) => avgRevenue > 0 && c.revenue < avgRevenue * 0.5,
  );
  const pakdMaterialItems = data.pakd.materials?.items ?? data.pakd.items ?? [];
  const pakdHighRemaining = pakdMaterialItems.filter(
    (p) => p.total > 0 && p.remaining / p.total > 0.5,
  );

  if (data.contract.late > 0) {
    alerts.push({
      id: "contract-late",
      title: `${data.contract.late} hợp đồng chậm tiến độ`,
      description: `Tổng ${data.contract.total} hợp đồng, ${data.contract.late} đang chậm so với kế hoạch.`,
      severity: "critical",
    });
  }
  if (data.handover.late > 0) {
    alerts.push({
      id: "handover-late",
      title: `${data.handover.late} bàn giao chậm tiến độ`,
      description: `${data.handover.late}/${data.handover.total} đợt bàn giao không đạt tiến độ yêu cầu.`,
      severity: "critical",
    });
  }
  if (data.training.late > 0) {
    alerts.push({
      id: "training-late",
      title: `${data.training.late} huấn luyện chậm tiến độ`,
      description: `${data.training.late}/${data.training.total} đợt huấn luyện đang chậm so với kế hoạch.`,
      severity: "warning",
    });
  }
  if (data.complaint.processing > 0) {
    alerts.push({
      id: "complaint-processing",
      title: `${data.complaint.processing} khiếu nại đang chờ xử lý`,
      description: `Có ${data.complaint.processing} khiếu nại chưa được giải quyết.`,
      severity: "warning",
    });
  }
  if (data.complaint.late > 0) {
    alerts.push({
      id: "complaint-late",
      title: `${data.complaint.late} khiếu nại xử lý trễ hạn`,
      description: `${data.complaint.late} khiếu nại không hoàn thành đúng thời hạn cam kết.`,
      severity: "critical",
    });
  }
  if (pakdHighRemaining.length > 0) {
    alerts.push({
      id: "pakd-high",
      title: `${pakdHighRemaining.length} phụ kiện KD còn tồn cao`,
      description: `Các PAKD: ${pakdHighRemaining.map((p) => p.name).join(", ")} còn tồn >50%.`,
      severity: "warning",
    });
  }
  if (lowRevenueCustomers.length > 0) {
    alerts.push({
      id: "low-revenue",
      title: `${lowRevenueCustomers.length} KH doanh thu thấp`,
      description: `KH doanh thu dưới 50% TB: ${lowRevenueCustomers.map((c) => c.name).join(", ")}.`,
      severity: "info",
    });
  }
  if (data.product.producing > data.product.equipped) {
    alerts.push({
      id: "product-gap",
      title: "Sản xuất vượt trang bị",
      description: `${data.product.producing} SP đang SX nhưng chỉ ${data.product.equipped} đã trang bị.`,
      severity: "warning",
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: "none",
      title: "Không có cảnh báo",
      description: "Tất cả chỉ số đều trong ngưỡng bình thường.",
      severity: "info",
    });
  }

  return alerts;
}

export const dashboardAlertSeverityStyles = {
  critical: {
    card: "border-l-destructive border-destructive/30 bg-destructive/10 dashboard-alert-pulse",
    icon: "text-destructive",
    badge: "bg-destructive text-destructive-foreground",
    label: "Nghiêm trọng",
  },
  warning: {
    card: "border-l-warning border-warning/30 bg-warning/10",
    icon: "text-warning",
    badge: "bg-warning/15 text-warning",
    label: "Cảnh báo",
  },
  info: {
    card: "border-l-info border-info/30 bg-info/5",
    icon: "text-info",
    badge: "bg-info/10 text-info",
    label: "Thông tin",
  },
} as const;
