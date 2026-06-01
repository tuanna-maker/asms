import { useState, useMemo } from "react";
import {
  Package, FileText, Truck, GraduationCap, Clock, Layers, AlertTriangle,
} from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import { computeDashboardAlertMetrics } from "@/lib/dashboard-alerts";
import ProgressWidget from "@/components/dashboard/ProgressWidget";
import ComplaintWidget from "@/components/dashboard/ComplaintWidget";
import PAKDWidget from "@/components/dashboard/PAKDWidget";
import ProductManufacturingWidget from "@/components/dashboard/ProductManufacturingWidget";
import CustomerCareWidget from "@/components/dashboard/CustomerCareWidget";
import CustomerProductChart from "@/components/dashboard/CustomerProductChart";
import CustomerRevenueChart from "@/components/dashboard/CustomerRevenueChart";
import TrendChart from "@/components/dashboard/TrendChart";
import PieChartWidget from "@/components/dashboard/PieChartWidget";
import DashboardGrid, { WidgetConfig } from "@/components/dashboard/DashboardGrid";
import { buildOverviewLayouts } from "@/components/dashboard/dashboardLayouts";
import AddWidgetDialog from "@/components/dashboard/AddWidgetDialog";
import DashboardTable, { StatusBadge, Column } from "@/components/dashboard/DashboardTable";
import { DashboardData } from "@/data/dashboardData";
import type { ContractRow } from "@/data/tableData";

interface OverviewTabProps {
  data: DashboardData;
  /** Dữ liệu hợp đồng đã chuẩn hoá từ API (rỗng nếu không có) */
  contractsTableData?: ContractRow[];
}

const contractColumns: Column<ContractRow>[] = [
  { key: "id", label: "Mã HĐ", sortable: true, render: (r) => <span className="font-medium text-primary">{r.id}</span> },
  { key: "name", label: "Tên hợp đồng", sortable: true, hideOnMobile: true },
  { key: "customer", label: "Khách hàng", sortable: true, filterable: true, filterOptions: [
    { value: "Quân khu 1", label: "Quân khu 1" }, { value: "Quân khu 3", label: "Quân khu 3" },
    { value: "Quân khu 5", label: "Quân khu 5" }, { value: "Quân khu 7", label: "Quân khu 7" },
    { value: "Quân khu 9", label: "Quân khu 9" }, { value: "Bộ TL TTTM", label: "Bộ TL TTTM" },
  ]},
  { key: "value", label: "Giá trị (tỷ)", sortable: true, sortValue: (r) => r.value, render: (r) => r.value.toLocaleString(), hideOnMobile: true },
  { key: "status", label: "Trạng thái", filterable: true, filterOptions: [
    { value: "active", label: "Đang TH" }, { value: "completed", label: "Hoàn thành" }, { value: "late", label: "Chậm" },
  ], render: (r) => (
    <StatusBadge status={r.status === "completed" ? "success" : r.status === "late" ? "destructive" : "info"} label={r.status === "completed" ? "Hoàn thành" : r.status === "late" ? "Chậm" : "Đang TH"} />
  )},
  { key: "progress", label: "Tiến độ", sortable: true, sortValue: (r) => r.progress, render: (r) => (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${r.progress === 100 ? "bg-success" : r.status === "late" ? "bg-destructive" : "bg-primary"}`} style={{ width: `${r.progress}%` }} />
      </div>
      <span className="text-xs text-muted-foreground">{r.progress}%</span>
    </div>
  ), hideOnMobile: true },
];

const allWidgetTemplates = [
  { id: "stats", title: "Thống kê tổng quan", description: "4 thẻ thống kê chính", icon: Package, category: "Tổng hợp", defaultSize: { w: 12, h: 2 } },
  { id: "product-manufacturing", title: "Tiến độ sản xuất SP", description: "Chi tiết theo sơ đồ SX", icon: Layers, category: "Sản phẩm", defaultSize: { w: 12, h: 5 } },
  { id: "progress-product", title: "Tiến độ sản phẩm (tóm tắt)", description: "Thanh tiến độ sản phẩm", icon: Layers, category: "Sản phẩm", defaultSize: { w: 6, h: 4 } },
  { id: "progress-contract", title: "Tiến độ hợp đồng", description: "Thanh tiến độ hợp đồng", icon: FileText, category: "Hợp đồng", defaultSize: { w: 4, h: 4 } },
  { id: "progress-handover", title: "Tiến độ bàn giao", description: "Thanh tiến độ bàn giao", icon: Truck, category: "Hợp đồng", defaultSize: { w: 4, h: 4 } },
  { id: "progress-training", title: "Tiến độ huấn luyện", description: "Thanh tiến độ huấn luyện", icon: GraduationCap, category: "Hợp đồng", defaultSize: { w: 4, h: 4 } },
  { id: "pie-product", title: "Phân loại sản phẩm", description: "Biểu đồ tròn phân loại SP", icon: Layers, category: "Biểu đồ", defaultSize: { w: 6, h: 4 } },
  { id: "pie-contract", title: "Trạng thái hợp đồng", description: "Biểu đồ tròn HĐ", icon: FileText, category: "Biểu đồ", defaultSize: { w: 6, h: 4 } },
  { id: "chart-customer-product", title: "SP theo khách hàng", description: "Biểu đồ cột SP/KH", icon: Package, category: "Biểu đồ", defaultSize: { w: 6, h: 4 } },
  { id: "chart-customer-revenue", title: "DT theo khách hàng", description: "Biểu đồ ngang DT/KH", icon: FileText, category: "Biểu đồ", defaultSize: { w: 6, h: 4 } },
  { id: "trend", title: "Xu hướng theo tháng", description: "Biểu đồ đường xu hướng", icon: Clock, category: "Biểu đồ", defaultSize: { w: 6, h: 4 } },
  { id: "complaint", title: "Phản ánh & Khiếu nại", description: "Widget khiếu nại", icon: Clock, category: "Tổng hợp", defaultSize: { w: 6, h: 4 } },
  { id: "customer-care", title: "Chăm sóc KH", description: "DT, SP, kỷ niệm", icon: Package, category: "Khách hàng", defaultSize: { w: 12, h: 5 } },
  { id: "pakd", title: "Theo dõi PAKD", description: "Vật tư + Đề tài NC", icon: Package, category: "Vật tư", defaultSize: { w: 6, h: 6 } },
  { id: "table-contracts", title: "Bảng hợp đồng", description: "Danh sách hợp đồng", icon: FileText, category: "Tổng hợp", defaultSize: { w: 12, h: 5 } },
];

const OverviewTab = ({ data, contractsTableData }: OverviewTabProps) => {
  const alertMetrics = useMemo(() => computeDashboardAlertMetrics(data), [data]);
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [activeWidgetIds, setActiveWidgetIds] = useState<string[]>([
    "stats",
    "product-manufacturing",
    "progress-contract",
    "progress-handover",
    "progress-training",
    "complaint",
    "pakd",
    "chart-customer-revenue",
    "trend",
    "table-contracts",
  ]);

  const widgetComponents: Record<string, React.ReactNode> = useMemo(() => ({
    "stats": (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 h-full">
        <StatCard title="Tổng sản phẩm" value={data.stats.totalProducts} icon={Package} color="primary" />
        <StatCard
          title="HĐ chậm tiến độ"
          value={data.contract.late}
          icon={FileText}
          color="destructive"
          alertLevel="critical"
          subtitle={data.contract.late > 0 ? `/${data.contract.total} hợp đồng` : undefined}
        />
        <StatCard
          title="Khiếu nại chờ xử lý"
          value={data.stats.pendingComplaints}
          icon={AlertTriangle}
          color="destructive"
          alertLevel={data.stats.pendingComplaints > 0 ? "critical" : undefined}
        />
        <StatCard
          title="Phản ánh KH mở"
          value={data.feedback.open}
          icon={AlertTriangle}
          color="destructive"
          alertLevel={data.feedback.overdue > 0 ? "critical" : data.feedback.open > 0 ? "warning" : undefined}
          subtitle={data.feedback.overdue > 0 ? `${data.feedback.overdue} quá hạn` : undefined}
        />
        <StatCard
          title="Chậm tiến độ (tổng)"
          value={alertMetrics.totalLate}
          icon={Clock}
          color="destructive"
          alertLevel="critical"
          subtitle="HĐ · BG · HL · KN"
        />
      </div>
    ),
    "product-manufacturing": <ProductManufacturingWidget data={data.productProgress} />,
    "customer-care": <CustomerCareWidget customerCare={data.customerCare} />,
    "progress-product": (
      <ProgressWidget title="Tiến độ sản phẩm" icon={Layers} total={data.product.total}
        items={[
          { label: "Đang sản xuất", value: data.product.producing, color: "bg-primary" },
          { label: "Nghiệm thu cấp bộ", value: data.product.inspecting, color: "bg-info" },
          { label: "Đưa vào trang bị", value: data.product.equipped, color: "bg-success" },
        ]} />
    ),
    "progress-contract": (
      <ProgressWidget title="Tiến độ hợp đồng" icon={FileText} total={data.contract.total}
        items={[
          { label: "Đang thực hiện", value: data.contract.active, color: "bg-primary" },
          { label: "Hoàn thành", value: data.contract.completed, color: "bg-success" },
        ]} completedOnTime={data.contract.onTime} completedLate={data.contract.late} />
    ),
    "progress-handover": (
      <ProgressWidget title="Tiến độ bàn giao" icon={Truck} total={data.handover.total}
        items={[
          { label: "Đang thực hiện", value: data.handover.active, color: "bg-primary" },
          { label: "Hoàn thành", value: data.handover.completed, color: "bg-success" },
        ]} completedOnTime={data.handover.onTime} completedLate={data.handover.late} />
    ),
    "progress-training": (
      <ProgressWidget title="Tiến độ huấn luyện" icon={GraduationCap} total={data.training.total}
        items={[
          { label: "Đang thực hiện", value: data.training.active, color: "bg-primary" },
          { label: "Hoàn thành", value: data.training.completed, color: "bg-success" },
        ]} completedOnTime={data.training.onTime} completedLate={data.training.late} />
    ),
    "pie-product": (
      <PieChartWidget title="Phân loại sản phẩm" icon={Layers} iconColor="bg-primary/10 text-primary"
        data={[
          { name: "Đang sản xuất", value: data.product.producing },
          { name: "Nghiệm thu", value: data.product.inspecting },
          { name: "Đã trang bị", value: data.product.equipped },
        ]} />
    ),
    "pie-contract": (
      <PieChartWidget title="Trạng thái hợp đồng" icon={FileText} iconColor="bg-info/10 text-info"
        data={[
          { name: "Đang thực hiện", value: data.contract.active },
          { name: "Đúng hạn", value: data.contract.onTime },
          { name: "Chậm tiến độ", value: data.contract.late },
        ]} />
    ),
    "chart-customer-product": <CustomerProductChart data={data.customerProducts} />,
    "chart-customer-revenue": <CustomerRevenueChart data={data.customerRevenue} />,
    "trend": <TrendChart data={data.trend} />,
    "complaint": (
      <ComplaintWidget total={data.complaint.total} warranty={data.complaint.warranty} repair={data.complaint.repair}
        processing={data.complaint.processing} done={data.complaint.done} onTime={data.complaint.onTime} late={data.complaint.late} />
    ),
    "pakd": <PAKDWidget data={data.pakd} />,
    "table-contracts": (
      <DashboardTable
        title="Danh sách hợp đồng"
        columns={contractColumns}
        data={contractsTableData ?? []}
        compact
      />
    ),
  }), [alertMetrics.totalLate, contractsTableData, data]);

  const widgets: WidgetConfig[] = useMemo(() =>
    activeWidgetIds
      .filter(id => widgetComponents[id])
      .map(id => {
        const tpl = allWidgetTemplates.find(t => t.id === id);
        return {
          id,
          type: id,
          title: tpl?.title || id,
          component: widgetComponents[id],
          contentOverflow: id === "stats" ? "visible" : "hidden",
          defaultLayout: {
            w: tpl?.defaultSize.w || 6,
            h: tpl?.defaultSize.h || 4,
            minW: 3,
            minH: tpl?.defaultSize.h ? Math.max(2, tpl.defaultSize.h - 1) : 2,
          },
        };
      }),
    [activeWidgetIds, widgetComponents]
  );

  const handleAddWidget = (templateId: string) => {
    if (!activeWidgetIds.includes(templateId)) {
      setActiveWidgetIds(prev => [...prev, templateId]);
    }
  };

  return (
    <>
      <DashboardGrid
        widgets={widgets}
        storageKey="overview-dashboard"
        buildDefaultLayouts={buildOverviewLayouts}
        onAddWidget={() => setShowAddWidget(true)}
      />
      <AddWidgetDialog
        open={showAddWidget}
        onClose={() => setShowAddWidget(false)}
        templates={allWidgetTemplates}
        existingWidgetIds={activeWidgetIds}
        onAdd={handleAddWidget}
      />
    </>
  );
};

export default OverviewTab;
