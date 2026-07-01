import { useState, useMemo } from "react";
import { AlertTriangle, Clock, FileText, Truck, GraduationCap, DollarSign, TrendingDown } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import DashboardTable, { StatusBadge, Column } from "@/components/dashboard/DashboardTable";
import DashboardPagination from "@/components/dashboard/DashboardPagination";
import { DashboardData } from "@/data/dashboardData";
import {
  buildDashboardAlertSummaries,
  computeDashboardAlertMetrics,
  dashboardAlertSeverityStyles,
  type DashboardAlertSeverity,
} from "@/lib/dashboard-alerts";
import { cn } from "@/lib/utils";

const ALERTS_PER_PAGE = 20;

const alertIconById: Record<string, React.ElementType> = {
  "contract-late": FileText,
  "handover-late": Truck,
  "training-late": GraduationCap,
  "complaint-processing": AlertTriangle,
  "complaint-late": Clock,
  "pakd-high": DollarSign,
  "low-revenue": TrendingDown,
  "product-gap": Clock,
  none: AlertTriangle,
};

interface AlertTabProps {
  data: DashboardData;
}

interface AlertRow {
  category: string;
  title: string;
  description: string;
  severity: DashboardAlertSeverity;
}

const alertCols: Column<AlertRow>[] = [
  {
    key: "severity",
    label: "Mức độ",
    filterable: true,
    filterOptions: [
      { value: "critical", label: "Nghiêm trọng" },
      { value: "warning", label: "Cảnh báo" },
      { value: "info", label: "Thông tin" },
    ],
    render: (r) => (
      <StatusBadge
        status={r.severity === "critical" ? "destructive" : r.severity === "warning" ? "warning" : "info"}
        label={
          r.severity === "critical" ? "Nghiêm trọng" : r.severity === "warning" ? "Cảnh báo" : "Thông tin"
        }
      />
    ),
  },
  {
    key: "category",
    label: "Phân loại",
    sortable: true,
    filterable: true,
    filterOptions: [
      { value: "Hợp đồng", label: "Hợp đồng" },
      { value: "Bàn giao", label: "Bàn giao" },
      { value: "Huấn luyện", label: "Huấn luyện" },
      { value: "Vật tư", label: "Vật tư" },
      { value: "Doanh thu", label: "Doanh thu" },
      { value: "Chung", label: "Chung" },
    ],
  },
  { key: "title", label: "Nội dung", sortable: true },
  { key: "description", label: "Chi tiết", hideOnMobile: true },
];

const categoryByAlertId: Record<string, string> = {
  "contract-late": "Hợp đồng",
  "handover-late": "Bàn giao",
  "training-late": "Huấn luyện",
  "complaint-processing": "Chung",
  "complaint-late": "Chung",
  "pakd-high": "Vật tư",
  "low-revenue": "Doanh thu",
  "product-gap": "Chung",
  none: "Chung",
};

const AlertTab = ({ data }: AlertTabProps) => {
  const [alertPage, setAlertPage] = useState(1);
  const metrics = useMemo(() => computeDashboardAlertMetrics(data), [data]);
  const alerts = useMemo(() => buildDashboardAlertSummaries(data), [data]);
  const actionableAlerts = alerts.filter((a) => a.id !== "none");

  const criticalCount = actionableAlerts.filter((a) => a.severity === "critical").length;
  const warningCount = actionableAlerts.filter((a) => a.severity === "warning").length;

  const alertTotalPages = Math.max(1, Math.ceil(actionableAlerts.length / ALERTS_PER_PAGE));
  const pageAlerts = actionableAlerts.slice((alertPage - 1) * ALERTS_PER_PAGE, alertPage * ALERTS_PER_PAGE);

  const alertRows: AlertRow[] = actionableAlerts.map((a) => ({
    category: categoryByAlertId[a.id] ?? "Chung",
    title: a.title,
    description: a.description,
    severity: a.severity,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Nghiêm trọng"
          value={criticalCount}
          icon={AlertTriangle}
          color="destructive"
          alertLevel="critical"
        />
        <StatCard
          title="Cảnh báo"
          value={warningCount}
          icon={AlertTriangle}
          color="warning"
          alertLevel="warning"
        />
        <StatCard
          title="Chậm tiến độ"
          value={metrics.totalLate}
          icon={Clock}
          color="destructive"
          alertLevel="critical"
        />
        <StatCard
          title="Khiếu nại chờ xử lý"
          value={metrics.pendingComplaints}
          icon={AlertTriangle}
          color="destructive"
          alertLevel="critical"
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-card-foreground">Danh sách cảnh báo</h3>
        {actionableAlerts.length === 0 ? (
          <div className="rounded-lg border border-border/50 bg-card p-6 text-center text-sm text-muted-foreground">
            Tất cả chỉ số đều trong ngưỡng bình thường.
          </div>
        ) : (
          pageAlerts.map((alert) => {
            const styles = dashboardAlertSeverityStyles[alert.severity];
            const Icon = alertIconById[alert.id] ?? AlertTriangle;
            return (
              <div
                key={alert.id}
                className={cn(
                  "rounded-lg border-l-4 border bg-card p-4",
                  styles.card,
                  alert.severity === "critical" && "shadow-sm dashboard-alert-pulse",
                )}
              >
                <div className="flex items-start gap-3">
                  <Icon className={cn("h-5 w-5 mt-0.5 shrink-0", styles.icon)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          "font-medium text-sm",
                          alert.severity === "critical" ? "text-destructive" : "text-card-foreground",
                        )}
                      >
                        {alert.title}
                      </span>
                      <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", styles.badge)}>
                        {styles.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{alert.description}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        {actionableAlerts.length > 0 && (
          <DashboardPagination
            page={alertPage}
            totalPages={alertTotalPages}
            totalItems={actionableAlerts.length}
            pageSize={ALERTS_PER_PAGE}
            onPageChange={setAlertPage}
          />
        )}
      </div>

      <DashboardTable title="Bảng tổng hợp cảnh báo" columns={alertCols} data={alertRows} compact={false} />
    </div>
  );
};

export default AlertTab;
