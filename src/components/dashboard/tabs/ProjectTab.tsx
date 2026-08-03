import { useState, useMemo } from "react";
import { FileText, Truck, GraduationCap, Clock, CheckCircle } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import StatCardsGrid from "@/components/dashboard/StatCardsGrid";
import ProgressWidget from "@/components/dashboard/ProgressWidget";
import ComplaintWidget from "@/components/dashboard/ComplaintWidget";
import PAKDWidget from "@/components/dashboard/PAKDWidget";
import PieChartWidget from "@/components/dashboard/PieChartWidget";
import TrendChart from "@/components/dashboard/TrendChart";
import { buildProjectLayouts } from "@/components/dashboard/dashboardLayouts";
import DashboardGrid, { WidgetConfig } from "@/components/dashboard/DashboardGrid";
import AddWidgetDialog from "@/components/dashboard/AddWidgetDialog";
import DashboardTable, { StatusBadge, Column } from "@/components/dashboard/DashboardTable";
import { DashboardData } from "@/data/dashboardData";
import { buildCustomerFilterOptions } from "@/lib/dashboard-table-utils";
import { useDashboardActiveWidgets } from "@/hooks/use-dashboard-active-widgets";

interface ProjectTabProps {
  data: DashboardData;
  contracts?: ContractRow[];
  handovers?: HandoverRow[];
  trainings?: TrainingRow[];
}

import type { ContractRow, HandoverRow, TrainingRow } from "@/data/tableData";

const statusFilterOptions = [
  { value: "active", label: "Đang TH" }, { value: "completed", label: "Hoàn thành" }, { value: "late", label: "Chậm" },
];

function buildProjectColumns(customerNames: string[]) {
  const customerFilterOptions = buildCustomerFilterOptions(customerNames);
  const contractCols: Column<ContractRow>[] = [
  { key: "id", label: "Mã HĐ", sortable: true, render: (r) => <span className="font-medium text-primary">{r.id}</span> },
  { key: "name", label: "Tên hợp đồng", sortable: true, hideOnMobile: true },
  { key: "customer", label: "Khách hàng", sortable: true, filterable: true, filterOptions: customerFilterOptions },
  { key: "status", label: "Trạng thái", filterable: true, filterOptions: statusFilterOptions, render: (r) => (
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
  { key: "endDate", label: "Hạn", hideOnMobile: true },
];

const handoverCols: Column<HandoverRow>[] = [
  { key: "id", label: "Mã BG", sortable: true, render: (r) => <span className="font-medium text-primary">{r.id}</span> },
  { key: "contract", label: "Hợp đồng", sortable: true },
  { key: "customer", label: "Khách hàng", sortable: true, filterable: true, filterOptions: customerFilterOptions, hideOnMobile: true },
  { key: "products", label: "Số SP", sortable: true, sortValue: (r) => r.products },
  { key: "status", label: "Trạng thái", filterable: true, filterOptions: [
    { value: "active", label: "Đang TH" }, { value: "completed", label: "Hoàn thành" },
  ], render: (r) => (
    <StatusBadge status={r.isLate ? "destructive" : r.status === "completed" ? "success" : "info"} label={r.isLate ? "Chậm" : r.status === "completed" ? "Hoàn thành" : "Đang TH"} />
  )},
  { key: "date", label: "Ngày BG", sortable: true, hideOnMobile: true },
];

const trainingCols: Column<TrainingRow>[] = [
  { key: "id", label: "Mã HL", sortable: true, render: (r) => <span className="font-medium text-primary">{r.id}</span> },
  { key: "topic", label: "Nội dung", sortable: true },
  { key: "customer", label: "Khách hàng", sortable: true, filterable: true, filterOptions: customerFilterOptions, hideOnMobile: true },
  { key: "status", label: "Trạng thái", filterable: true, filterOptions: [
    { value: "active", label: "Đang TH" }, { value: "completed", label: "Hoàn thành" },
  ], render: (r) => (
    <StatusBadge status={r.isLate ? "destructive" : r.status === "completed" ? "success" : "info"} label={r.isLate ? "Chậm" : r.status === "completed" ? "Hoàn thành" : "Đang TH"} />
  )},
  { key: "date", label: "Ngày", sortable: true, hideOnMobile: true },
  ];
  return { contractCols, handoverCols, trainingCols };
}

const widgetTemplates = [
  { id: "stats", title: "Thống kê DA", description: "4 thẻ", icon: FileText, category: "Tổng hợp", defaultSize: { w: 12, h: 2 } },
  { id: "progress-contract", title: "Tiến độ HĐ", description: "Thanh tiến độ", icon: FileText, category: "Tiến độ", defaultSize: { w: 6, h: 4 } },
  { id: "progress-handover", title: "Tiến độ BG", description: "Thanh tiến độ", icon: Truck, category: "Tiến độ", defaultSize: { w: 6, h: 4 } },
  { id: "progress-training", title: "Tiến độ HL", description: "Thanh tiến độ", icon: GraduationCap, category: "Tiến độ", defaultSize: { w: 6, h: 4 } },
  { id: "pie-contract", title: "TT Hợp đồng", description: "Biểu đồ tròn", icon: FileText, category: "Biểu đồ", defaultSize: { w: 6, h: 5 } },
  { id: "complaint", title: "Khiếu nại", description: "Widget", icon: Clock, category: "Tổng hợp", defaultSize: { w: 6, h: 4 } },
  { id: "pakd", title: "PAKD", description: "Tiến độ", icon: FileText, category: "Vật tư", defaultSize: { w: 6, h: 4 } },
  { id: "trend", title: "Xu hướng", description: "Biểu đồ đường", icon: Clock, category: "Biểu đồ", defaultSize: { w: 12, h: 5 } },
  { id: "table-contract", title: "Bảng HĐ", description: "Danh sách", icon: FileText, category: "Tổng hợp", defaultSize: { w: 12, h: 5 } },
  { id: "table-handover", title: "Bảng BG", description: "Danh sách", icon: Truck, category: "Tổng hợp", defaultSize: { w: 12, h: 5 } },
  { id: "table-training", title: "Bảng HL", description: "Danh sách", icon: GraduationCap, category: "Tổng hợp", defaultSize: { w: 12, h: 5 } },
];

const ProjectTab = ({ data, contracts = [], handovers = [], trainings = [] }: ProjectTabProps) => {
  const [showAddWidget, setShowAddWidget] = useState(false);
  const defaultActive = useMemo(
    () => [
      "stats",
      "progress-contract",
      "progress-handover",
      "progress-training",
      "pie-contract",
      "complaint",
      "pakd",
      "trend",
      "table-contract",
      "table-handover",
      "table-training",
    ],
    [],
  );
  const { activeWidgetIds, addWidget } = useDashboardActiveWidgets("project-dashboard", defaultActive);

  const { contractCols, handoverCols, trainingCols } = useMemo(() => {
    const names = [
      ...contracts.map((r) => r.customer),
      ...handovers.map((r) => r.customer),
      ...trainings.map((r) => r.customer),
    ];
    return buildProjectColumns(names);
  }, [contracts, handovers, trainings]);

  const widgetComponents: Record<string, React.ReactNode> = useMemo(() => ({
    "stats": (
      <StatCardsGrid>
        <StatCard title="Tổng hợp đồng" value={data.contract.total} icon={FileText} color="primary" />
        <StatCard title="Đang thực hiện" value={data.contract.active} icon={Clock} color="info" />
        <StatCard title="Hoàn thành đúng hạn" value={data.contract.onTime} icon={CheckCircle} color="success" />
        <StatCard title="Chậm tiến độ" value={data.contract.late} icon={Clock} color="destructive" alertLevel="critical" />
      </StatCardsGrid>
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
    "pie-contract": (
      <PieChartWidget title="Trạng thái hợp đồng" icon={FileText} iconColor="bg-info/10 text-info"
        data={[
          { name: "Đang thực hiện", value: data.contract.active },
          { name: "Đúng hạn", value: data.contract.onTime },
          { name: "Chậm tiến độ", value: data.contract.late },
        ]} />
    ),
    "complaint": (
      <ComplaintWidget total={data.complaint.total} warranty={data.complaint.warranty} repair={data.complaint.repair}
        processing={data.complaint.processing} done={data.complaint.done} onTime={data.complaint.onTime} late={data.complaint.late} />
    ),
    "pakd": <PAKDWidget data={data.pakd} />,
    "trend": <TrendChart data={data.trend} />,
    "table-contract": (
      <DashboardTable title="Danh sách hợp đồng" columns={contractCols} data={contracts} compact />
    ),
    "table-handover": (
      <DashboardTable title="Danh sách bàn giao" columns={handoverCols} data={handovers} compact />
    ),
    "table-training": (
      <DashboardTable title="Danh sách huấn luyện" columns={trainingCols} data={trainings} compact />
    ),
  }), [contractCols, data, handoverCols, trainingCols, contracts, handovers, trainings]);

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
        storageKey="project-dashboard"
        buildDefaultLayouts={buildProjectLayouts}
        onAddWidget={() => setShowAddWidget(true)}
      />
      <AddWidgetDialog open={showAddWidget} onClose={() => setShowAddWidget(false)} templates={widgetTemplates} existingWidgetIds={activeWidgetIds} onAdd={addWidget} />
    </>
  );
};

export default ProjectTab;
