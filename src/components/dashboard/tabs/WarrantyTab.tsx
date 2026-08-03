import { useState, useMemo } from "react";
import { Shield, Wrench, Clock, CheckCircle, AlertTriangle, TrendingUp } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import StatCardsGrid from "@/components/dashboard/StatCardsGrid";
import ComplaintWidget from "@/components/dashboard/ComplaintWidget";
import PieChartWidget from "@/components/dashboard/PieChartWidget";
import ProgressWidget from "@/components/dashboard/ProgressWidget";
import TrendChart from "@/components/dashboard/TrendChart";
import { buildWarrantyLayouts } from "@/components/dashboard/dashboardLayouts";
import DashboardGrid, { WidgetConfig } from "@/components/dashboard/DashboardGrid";
import AddWidgetDialog from "@/components/dashboard/AddWidgetDialog";
import DashboardTable, { StatusBadge, Column } from "@/components/dashboard/DashboardTable";
import { DashboardData } from "@/data/dashboardData";
import { ComplaintRow } from "@/data/tableData";

import { buildCustomerFilterOptions } from "@/lib/dashboard-table-utils";
import { useDashboardActiveWidgets } from "@/hooks/use-dashboard-active-widgets";

interface WarrantyTabProps {
  data: DashboardData;
  complaints?: ComplaintRow[];
}

function buildComplaintColumns(complaints: ComplaintRow[]): Column<ComplaintRow>[] {
  return [
  { key: "id", label: "Mã", sortable: true, render: (r) => <span className="font-medium text-primary">{r.id}</span> },
  { key: "customer", label: "Khách hàng", sortable: true, filterable: true, filterOptions: buildCustomerFilterOptions(complaints.map((r) => r.customer)) },
  { key: "product", label: "Sản phẩm", sortable: true, hideOnMobile: true },
  { key: "type", label: "Loại", filterable: true, filterOptions: [
    { value: "warranty", label: "Bảo hành" }, { value: "repair", label: "Sửa chữa" },
  ], render: (r) => (
    <StatusBadge status={r.type === "warranty" ? "info" : "warning"} label={r.type === "warranty" ? "Bảo hành" : "Sửa chữa"} />
  )},
  { key: "description", label: "Mô tả", hideOnMobile: true },
  { key: "status", label: "Trạng thái", filterable: true, filterOptions: [
    { value: "processing", label: "Đang xử lý" }, { value: "done", label: "Hoàn thành" },
  ], render: (r) => (
    <StatusBadge status={r.isLate ? "destructive" : r.status === "done" ? "success" : "warning"} label={r.isLate ? "Trễ hạn" : r.status === "done" ? "Hoàn thành" : "Đang xử lý"} />
  )},
  { key: "createdDate", label: "Ngày tạo", sortable: true, hideOnMobile: true },
];
}

const widgetTemplates = [
  { id: "stats", title: "Thống kê BH", description: "4 thẻ", icon: Shield, category: "Tổng hợp", defaultSize: { w: 12, h: 2 } },
  { id: "complaint", title: "Khiếu nại", description: "Widget tổng hợp", icon: AlertTriangle, category: "Tổng hợp", defaultSize: { w: 6, h: 4 } },
  { id: "pie-type", title: "Phân loại PA", description: "Biểu đồ tròn", icon: Shield, category: "Biểu đồ", defaultSize: { w: 6, h: 5 } },
  { id: "progress", title: "Tiến độ xử lý", description: "Thanh tiến độ", icon: Clock, category: "Tiến độ", defaultSize: { w: 6, h: 4 } },
  { id: "pie-status", title: "TT xử lý", description: "Biểu đồ tròn", icon: CheckCircle, category: "Biểu đồ", defaultSize: { w: 6, h: 5 } },
  { id: "trend", title: "Xu hướng", description: "Biểu đồ đường", icon: TrendingUp, category: "Biểu đồ", defaultSize: { w: 12, h: 5 } },
  { id: "table", title: "Bảng KN/BH", description: "Danh sách", icon: Shield, category: "Tổng hợp", defaultSize: { w: 12, h: 5 } },
];

const WarrantyTab = ({ data, complaints = [] }: WarrantyTabProps) => {
  const [showAddWidget, setShowAddWidget] = useState(false);
  const defaultActive = useMemo(
    () => ["stats", "complaint", "pie-type", "progress", "pie-status", "trend", "table"],
    [],
  );
  const { activeWidgetIds, addWidget } = useDashboardActiveWidgets("warranty-dashboard", defaultActive);
  const complaintCols = useMemo(() => buildComplaintColumns(complaints), [complaints]);
  const { complaint } = data;
  const resolvedRate = complaint.total > 0 ? Math.round((complaint.done / complaint.total) * 100) : 0;

  const widgetComponents: Record<string, React.ReactNode> = useMemo(() => ({
    "stats": (
      <StatCardsGrid>
        <StatCard title="Chờ xử lý" value={complaint.processing} icon={Clock} color="destructive" alertLevel="critical" />
        <StatCard title="Trễ hạn SLA" value={complaint.late} icon={AlertTriangle} color="destructive" alertLevel="critical" />
        <StatCard title="Bảo hành" value={complaint.warranty} icon={Shield} color="primary" />
        <StatCard title="Sửa chữa" value={complaint.repair} icon={Wrench} color="accent" />
      </StatCardsGrid>
    ),
    "complaint": (
      <ComplaintWidget total={complaint.total} warranty={complaint.warranty} repair={complaint.repair}
        processing={complaint.processing} done={complaint.done} onTime={complaint.onTime} late={complaint.late} />
    ),
    "pie-type": (
      <PieChartWidget title="Phân loại phản ánh" icon={Shield} iconColor="bg-destructive/10 text-destructive"
        data={[{ name: "Bảo hành", value: complaint.warranty }, { name: "Sửa chữa", value: complaint.repair }]} />
    ),
    "progress": (
      <ProgressWidget title="Tiến độ xử lý phản ánh" icon={Clock} total={complaint.total}
        items={[
          { label: "Đang xử lý", value: complaint.processing, color: "bg-warning" },
          { label: "Hoàn thành", value: complaint.done, color: "bg-success" },
        ]} completedOnTime={complaint.onTime} completedLate={complaint.late} />
    ),
    "pie-status": (
      <PieChartWidget title="Trạng thái xử lý" icon={CheckCircle} iconColor="bg-success/10 text-success"
        data={[
          { name: "Đúng hạn", value: complaint.onTime },
          { name: "Chậm tiến độ", value: complaint.late },
          { name: "Đang xử lý", value: complaint.processing },
        ]} />
    ),
    "trend": <TrendChart data={data.trend} />,
    "table": (
      <DashboardTable
        title="Danh sách khiếu nại / bảo hành"
        columns={complaintCols}
        data={complaints}
        compact
      />
    ),
  }), [complaint, complaintCols, complaints, data]);

  const widgets: WidgetConfig[] = useMemo(() =>
    activeWidgetIds.filter(id => widgetComponents[id]).map(id => {
      const tpl = widgetTemplates.find(t => t.id === id);
      return {
        id,
        type: id,
        title: tpl?.title || id,
        component: widgetComponents[id],
        contentOverflow: id === "stats" ? undefined : "hidden",
        defaultLayout: { w: tpl?.defaultSize.w || 6, h: tpl?.defaultSize.h || 4, minW: 1, minH: 1 },
      };
    }), [activeWidgetIds, widgetComponents]);

  return (
    <>
      <DashboardGrid
        widgets={widgets}
        storageKey="warranty-dashboard"
        buildDefaultLayouts={buildWarrantyLayouts}
        onAddWidget={() => setShowAddWidget(true)}
      />
      <AddWidgetDialog open={showAddWidget} onClose={() => setShowAddWidget(false)} templates={widgetTemplates} existingWidgetIds={activeWidgetIds} onAdd={addWidget} />
    </>
  );
};

export default WarrantyTab;
