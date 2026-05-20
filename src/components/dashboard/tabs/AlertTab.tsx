import { useState } from "react";
import { AlertTriangle, Clock, TrendingDown, FileText, Truck, GraduationCap, DollarSign } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import DashboardTable, { StatusBadge, Column } from "@/components/dashboard/DashboardTable";
import DashboardPagination from "@/components/dashboard/DashboardPagination";
import { DashboardData } from "@/data/dashboardData";

const ALERTS_PER_PAGE = 20;

interface AlertTabProps {
  data: DashboardData;
}

interface AlertItem {
  icon: React.ElementType;
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
}

interface AlertRow {
  category: string;
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
}

const alertCols: Column<AlertRow>[] = [
  { key: "severity", label: "Mức độ", filterable: true, filterOptions: [
    { value: "critical", label: "Nghiêm trọng" }, { value: "warning", label: "Cảnh báo" }, { value: "info", label: "Thông tin" },
  ], render: (r) => (
    <StatusBadge
      status={r.severity === "critical" ? "destructive" : r.severity === "warning" ? "warning" : "info"}
      label={r.severity === "critical" ? "Nghiêm trọng" : r.severity === "warning" ? "Cảnh báo" : "Thông tin"}
    />
  )},
  { key: "category", label: "Phân loại", sortable: true, filterable: true, filterOptions: [
    { value: "Hợp đồng", label: "Hợp đồng" }, { value: "Bàn giao", label: "Bàn giao" }, { value: "Huấn luyện", label: "Huấn luyện" },
    { value: "Vật tư", label: "Vật tư" }, { value: "Doanh thu", label: "Doanh thu" }, { value: "Chung", label: "Chung" },
  ]},
  { key: "title", label: "Nội dung", sortable: true },
  { key: "description", label: "Chi tiết", hideOnMobile: true },
];

const AlertTab = ({ data }: AlertTabProps) => {
  const [alertPage, setAlertPage] = useState(1);
  const totalLate = data.contract.late + data.handover.late + data.training.late + data.complaint.late;
  const totalProcessing = data.complaint.processing;
  const overdueContracts = data.contract.late;
  const totalRevenue = data.customerRevenue.reduce((s, c) => s + c.revenue, 0);
  const lowRevenueCustomers = data.customerRevenue.filter((c) => c.revenue < totalRevenue / data.customerRevenue.length * 0.5);
  const pakdMaterialItems = data.pakd.materials?.items ?? data.pakd.items ?? [];
  const pakdHighRemaining = pakdMaterialItems.filter((p) => p.total > 0 && p.remaining / p.total > 0.5);

  const alerts: AlertItem[] = [];

  if (overdueContracts > 0) alerts.push({ icon: FileText, title: `${overdueContracts} hợp đồng chậm tiến độ`, description: `Tổng ${data.contract.total} hợp đồng, ${overdueContracts} đang chậm so với kế hoạch.`, severity: "critical" });
  if (data.handover.late > 0) alerts.push({ icon: Truck, title: `${data.handover.late} bàn giao chậm tiến độ`, description: `${data.handover.late}/${data.handover.total} đợt bàn giao không đạt tiến độ yêu cầu.`, severity: "critical" });
  if (data.training.late > 0) alerts.push({ icon: GraduationCap, title: `${data.training.late} huấn luyện chậm tiến độ`, description: `${data.training.late}/${data.training.total} đợt huấn luyện đang chậm so với kế hoạch.`, severity: "warning" });
  if (totalProcessing > 0) alerts.push({ icon: AlertTriangle, title: `${totalProcessing} khiếu nại đang chờ xử lý`, description: `Có ${totalProcessing} khiếu nại chưa được giải quyết.`, severity: "warning" });
  if (data.complaint.late > 0) alerts.push({ icon: Clock, title: `${data.complaint.late} khiếu nại xử lý trễ hạn`, description: `${data.complaint.late} khiếu nại không hoàn thành đúng thời hạn cam kết.`, severity: "critical" });
  if (pakdHighRemaining.length > 0) alerts.push({ icon: DollarSign, title: `${pakdHighRemaining.length} phụ kiện KD còn tồn cao`, description: `Các PAKD: ${pakdHighRemaining.map((p) => p.name).join(", ")} còn tồn >50%.`, severity: "warning" });
  if (lowRevenueCustomers.length > 0) alerts.push({ icon: TrendingDown, title: `${lowRevenueCustomers.length} KH doanh thu thấp`, description: `KH doanh thu dưới 50% TB: ${lowRevenueCustomers.map((c) => c.name).join(", ")}.`, severity: "info" });
  if (data.product.producing > data.product.equipped) alerts.push({ icon: Clock, title: "Sản xuất vượt trang bị", description: `${data.product.producing} SP đang SX nhưng chỉ ${data.product.equipped} đã trang bị.`, severity: "warning" });

  if (alerts.length === 0) alerts.push({ icon: AlertTriangle, title: "Không có cảnh báo", description: "Tất cả chỉ số đều trong ngưỡng bình thường.", severity: "info" });

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const warningCount = alerts.filter((a) => a.severity === "warning").length;

  const severityStyles = {
    critical: "border-l-destructive bg-destructive/5",
    warning: "border-l-warning bg-warning/5",
    info: "border-l-info bg-info/5",
  };
  const iconStyles = { critical: "text-destructive", warning: "text-warning", info: "text-info" };
  const badgeStyles = { critical: "bg-destructive/10 text-destructive", warning: "bg-warning/10 text-warning", info: "bg-info/10 text-info" };
  const severityLabels = { critical: "Nghiêm trọng", warning: "Cảnh báo", info: "Thông tin" };

  // Convert alerts to table rows
  const alertTotalPages = Math.max(1, Math.ceil(alerts.length / ALERTS_PER_PAGE));
  const pageAlerts = alerts.slice((alertPage - 1) * ALERTS_PER_PAGE, alertPage * ALERTS_PER_PAGE);

  const alertRows: AlertRow[] = alerts.map((a) => ({
    category: a.icon === FileText ? "Hợp đồng" : a.icon === Truck ? "Bàn giao" : a.icon === GraduationCap ? "Huấn luyện" : a.icon === DollarSign ? "Vật tư" : a.icon === TrendingDown ? "Doanh thu" : "Chung",
    title: a.title,
    description: a.description,
    severity: a.severity,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Tổng cảnh báo" value={alerts.length} icon={AlertTriangle} color="warning" />
        <StatCard title="Nghiêm trọng" value={criticalCount} icon={AlertTriangle} color="primary" />
        <StatCard title="Chậm tiến độ" value={totalLate} icon={Clock} color="warning" />
        <StatCard title="Khiếu nại chờ xử lý" value={totalProcessing} icon={AlertTriangle} color="info" />
      </div>

      {/* Visual alert cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-card-foreground">Danh sách cảnh báo</h3>
        {pageAlerts.map((alert, i) => (
          <div key={i} className={`rounded-lg border-l-4 border bg-card p-4 ${severityStyles[alert.severity]}`}>
            <div className="flex items-start gap-3">
              <alert.icon className={`h-5 w-5 mt-0.5 shrink-0 ${iconStyles[alert.severity]}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm text-card-foreground">{alert.title}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${badgeStyles[alert.severity]}`}>
                    {severityLabels[alert.severity]}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{alert.description}</p>
              </div>
            </div>
          </div>
        ))}
        <DashboardPagination
          page={alertPage}
          totalPages={alertTotalPages}
          totalItems={alerts.length}
          pageSize={ALERTS_PER_PAGE}
          onPageChange={setAlertPage}
        />
      </div>

      <DashboardTable
        title="Bảng tổng hợp cảnh báo"
        columns={alertCols}
        data={alertRows}
        compact={false}
      />
    </div>
  );
};

export default AlertTab;
