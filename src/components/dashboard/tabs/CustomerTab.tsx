import { useState, useMemo } from "react";
import { Users, TrendingUp, Package, FileText } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import CustomerProductChart from "@/components/dashboard/CustomerProductChart";
import CustomerRevenueChart from "@/components/dashboard/CustomerRevenueChart";
import PieChartWidget from "@/components/dashboard/PieChartWidget";
import CustomerCareWidget from "@/components/dashboard/CustomerCareWidget";
import DashboardGrid, { WidgetConfig } from "@/components/dashboard/DashboardGrid";
import { buildCustomerLayouts } from "@/components/dashboard/dashboardLayouts";
import AddWidgetDialog from "@/components/dashboard/AddWidgetDialog";
import DashboardTable, { Column } from "@/components/dashboard/DashboardTable";
import { DashboardData } from "@/data/dashboardData";

interface CustomerTabProps {
  data: DashboardData;
}

interface CustomerSummary {
  name: string;
  products: number;
  revenue: number;
  share: string;
}

const widgetTemplates = [
  { id: "stats", title: "Thống kê KH", description: "4 thẻ thống kê", icon: Users, category: "Tổng hợp", defaultSize: { w: 12, h: 3 } },
  { id: "chart-product", title: "SP theo KH", description: "Biểu đồ cột", icon: Package, category: "Biểu đồ", defaultSize: { w: 6, h: 6 } },
  { id: "chart-revenue", title: "DT theo KH", description: "Biểu đồ ngang", icon: TrendingUp, category: "Biểu đồ", defaultSize: { w: 6, h: 6 } },
  { id: "pie-product", title: "Tỷ lệ SP theo KH", description: "Biểu đồ tròn", icon: Users, category: "Biểu đồ", defaultSize: { w: 6, h: 5 } },
  { id: "pie-revenue", title: "Tỷ lệ DT theo KH", description: "Biểu đồ tròn", icon: TrendingUp, category: "Biểu đồ", defaultSize: { w: 6, h: 5 } },
  { id: "table", title: "Chi tiết KH", description: "Bảng dữ liệu", icon: FileText, category: "Tổng hợp", defaultSize: { w: 12, h: 6 } },
  { id: "customer-care", title: "Chăm sóc & kỷ niệm", description: "DT, KN, kỷ niệm", icon: Users, category: "Tổng hợp", defaultSize: { w: 12, h: 5 } },
];

const CustomerTab = ({ data }: CustomerTabProps) => {
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [activeWidgetIds, setActiveWidgetIds] = useState<string[]>([
    "stats",
    "chart-product",
    "chart-revenue",
    "customer-care",
  ]);

  const totalCustomerProducts = data.customerProducts.reduce((s, c) => s + c.products, 0);
  const totalRevenue = data.customerRevenue.reduce((s, c) => s + c.revenue, 0);
  const topCustomer = data.customerRevenue.length > 0
    ? [...data.customerRevenue].sort((a, b) => b.revenue - a.revenue)[0] : null;

  const customerSummary: CustomerSummary[] = data.customerProducts.map((cp) => {
    const rev = data.customerRevenue.find(cr => cr.name === cp.name);
    return {
      name: cp.name, products: cp.products, revenue: rev?.revenue || 0,
      share: totalRevenue > 0 ? `${Math.round(((rev?.revenue || 0) / totalRevenue) * 100)}%` : "0%",
    };
  });

  const columns: Column<CustomerSummary>[] = [
    { key: "name", label: "Khách hàng", sortable: true, render: (r) => <span className="font-medium text-card-foreground">{r.name}</span> },
    { key: "products", label: "Sản phẩm", sortable: true, sortValue: (r) => r.products, render: (r) => r.products.toLocaleString() },
    { key: "revenue", label: "Doanh thu (tr)", sortable: true, sortValue: (r) => r.revenue, render: (r) => r.revenue.toLocaleString() },
    { key: "share", label: "Tỷ trọng DT", render: (r) => <span className="font-semibold text-primary">{r.share}</span>, hideOnMobile: true },
  ];

  const widgetComponents: Record<string, React.ReactNode> = useMemo(() => ({
    "stats": (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-h-[7rem]">
        <StatCard title="Tổng khách hàng" value={data.customerCare.totalCustomers || data.customerProducts.length} icon={Users} color="primary" />
        <StatCard title="Tổng sản phẩm" value={totalCustomerProducts} icon={Package} color="info" />
        <StatCard title="Tổng doanh thu (tr)" value={totalRevenue.toLocaleString()} icon={TrendingUp} color="success" />
        <StatCard title="KH DT cao nhất" value={topCustomer?.name || "—"} icon={FileText} color="warning" />
      </div>
    ),
    "chart-product": <CustomerProductChart data={data.customerProducts} />,
    "chart-revenue": <CustomerRevenueChart data={data.customerRevenue} />,
    "pie-product": (
      <PieChartWidget
        title="Tỷ lệ SP theo KH"
        icon={Users}
        iconColor="bg-primary/10 text-primary"
        data={data.customerProducts.map((c) => ({ name: c.name, value: c.products }))}
      />
    ),
    "pie-revenue": (
      <PieChartWidget
        title="Tỷ lệ DT theo KH"
        icon={TrendingUp}
        iconColor="bg-success/10 text-success"
        data={data.customerRevenue.map((c) => ({ name: c.name, value: c.revenue }))}
      />
    ),
    "table": (
      <DashboardTable
        title="Chi tiết khách hàng"
        columns={columns}
        data={customerSummary}
        compact
      />
    ),
    "customer-care": <CustomerCareWidget customerCare={data.customerCare} />,
  }), [data, customerSummary, columns, topCustomer, totalCustomerProducts, totalRevenue]);

  const widgets: WidgetConfig[] = useMemo(() =>
    activeWidgetIds.filter(id => widgetComponents[id]).map(id => {
      const tpl = widgetTemplates.find(t => t.id === id);
      const defaultH = tpl?.defaultSize.h || 4;
      return {
        id,
        type: id,
        title: tpl?.title || id,
        component: widgetComponents[id],
        contentOverflow: id === "stats" ? "visible" : "hidden",
        defaultLayout: {
          w: tpl?.defaultSize.w || 6,
          h: defaultH,
          minW: 3,
          minH: id === "stats" ? 3 : Math.max(3, defaultH - 1),
        },
      };
    }), [activeWidgetIds, widgetComponents]);

  return (
    <>
      <DashboardGrid
        widgets={widgets}
        storageKey="customer-dashboard"
        buildDefaultLayouts={buildCustomerLayouts}
        onAddWidget={() => setShowAddWidget(true)}
      />
      <AddWidgetDialog open={showAddWidget} onClose={() => setShowAddWidget(false)} templates={widgetTemplates} existingWidgetIds={activeWidgetIds} onAdd={(id) => { if (!activeWidgetIds.includes(id)) setActiveWidgetIds(prev => [...prev, id]); }} />
    </>
  );
};

export default CustomerTab;
