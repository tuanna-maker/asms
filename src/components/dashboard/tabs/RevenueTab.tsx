import { useState, useMemo } from "react";
import { TrendingUp, DollarSign, BarChart3, ArrowUpRight } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import CustomerRevenueChart from "@/components/dashboard/CustomerRevenueChart";
import TrendChart from "@/components/dashboard/TrendChart";
import PieChartWidget from "@/components/dashboard/PieChartWidget";
import DashboardGrid, { WidgetConfig } from "@/components/dashboard/DashboardGrid";
import AddWidgetDialog from "@/components/dashboard/AddWidgetDialog";
import DashboardTable, { Column } from "@/components/dashboard/DashboardTable";
import { DashboardData } from "@/data/dashboardData";
import { ContractRow } from "@/data/tableData";

interface RevenueTabProps {
  data: DashboardData;
  contracts?: ContractRow[];
}

function buildRevenueColumns(contracts: ContractRow[]): Column<ContractRow>[] {
  const customerNames = [...new Set(contracts.map((r) => r.customer).filter((n) => n && n !== "—"))].sort();
  return [
    { key: "id", label: "Mã HĐ", sortable: true, render: (r) => <span className="font-medium text-primary">{r.id}</span> },
    { key: "name", label: "Hợp đồng", sortable: true, hideOnMobile: true },
    {
      key: "customer",
      label: "Khách hàng",
      sortable: true,
      filterable: customerNames.length > 0,
      filterOptions: customerNames.map((name) => ({ value: name, label: name })),
    },
    { key: "value", label: "Giá trị (tỷ)", sortable: true, sortValue: (r) => r.value, render: (r) => <span className="font-semibold text-card-foreground">{r.value.toLocaleString()}</span> },
    { key: "endDate", label: "Thời hạn", hideOnMobile: true },
    {
      key: "status",
      label: "Trạng thái",
      filterable: true,
      filterOptions: [
        { value: "active", label: "Đang TH" },
        { value: "completed", label: "Hoàn thành" },
        { value: "late", label: "Chậm" },
      ],
      render: (r) => {
        const s = r.status === "completed" ? "success" : r.status === "late" ? "destructive" : "info";
        const l = r.status === "completed" ? "Hoàn thành" : r.status === "late" ? "Chậm" : "Đang TH";
        return <span className={`text-xs font-medium ${s === "success" ? "text-success" : s === "destructive" ? "text-destructive" : "text-info"}`}>{l}</span>;
      },
    },
  ];
}

const widgetTemplates = [
  { id: "stats", title: "Thống kê DT", description: "4 thẻ thống kê", icon: DollarSign, category: "Tổng hợp", defaultSize: { w: 12, h: 1 } },
  { id: "chart-revenue", title: "DT theo KH", description: "Biểu đồ ngang", icon: BarChart3, category: "Biểu đồ", defaultSize: { w: 12, h: 4 } },
  { id: "pie-revenue", title: "Phân bổ DT", description: "Biểu đồ tròn", icon: TrendingUp, category: "Biểu đồ", defaultSize: { w: 6, h: 4 } },
  { id: "trend", title: "Xu hướng", description: "Biểu đồ đường", icon: TrendingUp, category: "Biểu đồ", defaultSize: { w: 6, h: 4 } },
  { id: "table", title: "Bảng DT HĐ", description: "Chi tiết", icon: DollarSign, category: "Tổng hợp", defaultSize: { w: 12, h: 4 } },
];

const RevenueTab = ({ data, contracts = [] }: RevenueTabProps) => {
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [activeWidgetIds, setActiveWidgetIds] = useState<string[]>(widgetTemplates.map(w => w.id));

  const totalRevenue = data.customerRevenue.reduce((s, c) => s + c.revenue, 0);
  const avgRevenue = data.customerRevenue.length > 0 ? Math.round(totalRevenue / data.customerRevenue.length) : 0;
  const maxRevenue = data.customerRevenue.length > 0 ? Math.max(...data.customerRevenue.map(c => c.revenue)) : 0;

  const revenueColumns = useMemo(() => buildRevenueColumns(contracts), [contracts]);

  const widgetComponents: Record<string, React.ReactNode> = useMemo(() => ({
    "stats": (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 h-full">
        <StatCard title="Tổng doanh thu (tỷ)" value={totalRevenue.toLocaleString()} icon={DollarSign} color="success" />
        <StatCard title="DT TB/KH (tỷ)" value={avgRevenue.toLocaleString()} icon={BarChart3} color="primary" />
        <StatCard title="DT cao nhất (tỷ)" value={maxRevenue.toLocaleString()} icon={ArrowUpRight} color="warning" />
        <StatCard title="Số KH có DT" value={data.customerRevenue.filter(c => c.revenue > 0).length} icon={TrendingUp} color="info" />
      </div>
    ),
    "chart-revenue": <CustomerRevenueChart data={data.customerRevenue} />,
    "pie-revenue": <PieChartWidget title="Phân bổ DT theo KH" icon={TrendingUp} iconColor="bg-success/10 text-success" data={data.customerRevenue.map(c => ({ name: c.name, value: c.revenue }))} />,
    "trend": <TrendChart data={data.trend} />,
    "table": (
      <DashboardTable title="Chi tiết DT theo HĐ" columns={revenueColumns} data={contracts} compact />
    ),
  }), [contracts, data, revenueColumns]);

  const widgets: WidgetConfig[] = useMemo(() =>
    activeWidgetIds.filter(id => widgetComponents[id]).map(id => {
      const tpl = widgetTemplates.find(t => t.id === id);
      return {
        id,
        type: id,
        title: tpl?.title || id,
        component: widgetComponents[id],
        contentOverflow: id === "stats" ? "visible" : "hidden",
        defaultLayout: { w: tpl?.defaultSize.w || 6, h: tpl?.defaultSize.h || 4, minW: 3, minH: id === "stats" ? 1 : 2 },
      };
    }), [activeWidgetIds, widgetComponents]);

  return (
    <>
      <DashboardGrid widgets={widgets} storageKey="revenue-dashboard" onAddWidget={() => setShowAddWidget(true)} />
      <AddWidgetDialog open={showAddWidget} onClose={() => setShowAddWidget(false)} templates={widgetTemplates} existingWidgetIds={activeWidgetIds} onAdd={(id) => { if (!activeWidgetIds.includes(id)) setActiveWidgetIds(prev => [...prev, id]); }} />
    </>
  );
};

export default RevenueTab;
