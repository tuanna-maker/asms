import { useState, useMemo } from "react";
import { Package, Layers, CheckCircle, Clock } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import StatCardsGrid from "@/components/dashboard/StatCardsGrid";
import ProgressWidget from "@/components/dashboard/ProgressWidget";
import ProductManufacturingWidget from "@/components/dashboard/ProductManufacturingWidget";
import CustomerProductChart from "@/components/dashboard/CustomerProductChart";
import PieChartWidget from "@/components/dashboard/PieChartWidget";
import TrendChart from "@/components/dashboard/TrendChart";
import { buildProductLayouts } from "@/components/dashboard/dashboardLayouts";
import DashboardGrid, { WidgetConfig } from "@/components/dashboard/DashboardGrid";
import AddWidgetDialog from "@/components/dashboard/AddWidgetDialog";
import DashboardTable, { StatusBadge, Column } from "@/components/dashboard/DashboardTable";
import { DashboardData } from "@/data/dashboardData";
import { ProductRow } from "@/data/tableData";

import { buildCustomerFilterOptions } from "@/lib/dashboard-table-utils";
import { useDashboardActiveWidgets } from "@/hooks/use-dashboard-active-widgets";

interface ProductTabProps {
  data: DashboardData;
  products?: ProductRow[];
}

function buildProductColumns(products: ProductRow[]): Column<ProductRow>[] {
  const categories = [...new Set(products.map((r) => r.category).filter((c) => c && c !== "—"))].sort();
  const customers = products.map((r) => r.customer);
  return [
  { key: "id", label: "Mã SP", sortable: true, render: (r) => <span className="font-medium text-primary">{r.id}</span> },
  { key: "name", label: "Tên sản phẩm", sortable: true },
  { key: "category", label: "Phân loại", sortable: true, filterable: categories.length > 0, filterOptions: categories.map((c) => ({ value: c, label: c })), hideOnMobile: true },
  { key: "customer", label: "Khách hàng", sortable: true, filterable: customers.some((c) => c && c !== "—"), filterOptions: buildCustomerFilterOptions(customers), hideOnMobile: true },
  { key: "quantity", label: "SL", sortable: true, sortValue: (r) => r.quantity },
  { key: "status", label: "Trạng thái", filterable: true, filterOptions: [
    { value: "producing", label: "Đang SX" }, { value: "inspecting", label: "Nghiệm thu" }, { value: "equipped", label: "Đã trang bị" },
  ], render: (r) => (
    <StatusBadge status={r.status === "equipped" ? "success" : r.status === "inspecting" ? "warning" : "info"} label={r.status === "equipped" ? "Đã trang bị" : r.status === "inspecting" ? "Nghiệm thu" : "Đang SX"} />
  )},
  { key: "deliveryDate", label: "Ngày giao", hideOnMobile: true },
];
}

const widgetTemplates = [
  { id: "stats", title: "Thống kê SP", description: "4 thẻ", icon: Package, category: "Tổng hợp", defaultSize: { w: 12, h: 2 } },
  { id: "manufacturing", title: "Tiến độ SX chi tiết", description: "Theo sơ đồ", icon: Layers, category: "Tiến độ", defaultSize: { w: 12, h: 4 } },
  { id: "progress", title: "Tiến độ SP", description: "Thanh tiến độ", icon: Layers, category: "Tiến độ", defaultSize: { w: 6, h: 4 } },
  { id: "pie", title: "Phân loại SP", description: "Biểu đồ tròn", icon: Layers, category: "Biểu đồ", defaultSize: { w: 6, h: 5 } },
  { id: "chart-customer", title: "SP theo KH", description: "Biểu đồ cột", icon: Package, category: "Biểu đồ", defaultSize: { w: 12, h: 5 } },
  { id: "trend", title: "Xu hướng", description: "Biểu đồ đường", icon: Clock, category: "Biểu đồ", defaultSize: { w: 12, h: 5 } },
  { id: "table", title: "Bảng SP", description: "Danh sách", icon: Package, category: "Tổng hợp", defaultSize: { w: 12, h: 5 } },
];

const ProductTab = ({ data, products = [] }: ProductTabProps) => {
  const [showAddWidget, setShowAddWidget] = useState(false);
  const defaultActive = useMemo(
    () => ["stats", "manufacturing", "progress", "pie", "chart-customer", "trend", "table"],
    [],
  );
  const { activeWidgetIds, addWidget } = useDashboardActiveWidgets("product-dashboard", defaultActive);
  const productCols = useMemo(() => buildProductColumns(products), [products]);

  const widgetComponents: Record<string, React.ReactNode> = useMemo(() => ({
    "stats": (
      <StatCardsGrid>
        <StatCard title="Tổng sản phẩm" value={data.product.total} icon={Package} color="primary" />
        <StatCard title="Đang sản xuất" value={data.product.producing} icon={Clock} color="info" />
        <StatCard title="Nghiệm thu" value={data.product.inspecting} icon={Layers} color="warning" />
        <StatCard title="Đã trang bị" value={data.product.equipped} icon={CheckCircle} color="success" />
      </StatCardsGrid>
    ),
    "manufacturing": <ProductManufacturingWidget data={data.productProgress} />,
    "progress": (
      <ProgressWidget title="Tiến độ sản phẩm" icon={Layers} total={data.product.total}
        items={[
          { label: "Đang sản xuất", value: data.product.producing, color: "bg-primary" },
          { label: "Nghiệm thu cấp bộ", value: data.product.inspecting, color: "bg-info" },
          { label: "Đưa vào trang bị", value: data.product.equipped, color: "bg-success" },
        ]} />
    ),
    "pie": (
      <PieChartWidget title="Phân loại sản phẩm" icon={Layers} iconColor="bg-primary/10 text-primary"
        data={[
          { name: "Đang sản xuất", value: data.product.producing },
          { name: "Nghiệm thu", value: data.product.inspecting },
          { name: "Đã trang bị", value: data.product.equipped },
        ]} />
    ),
    "chart-customer": <CustomerProductChart data={data.customerProducts} />,
    "trend": <TrendChart data={data.trend} />,
    "table": (
      <DashboardTable title="Danh sách sản phẩm" columns={productCols} data={products} compact />
    ),
  }), [data, productCols, products]);

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
        storageKey="product-dashboard"
        buildDefaultLayouts={buildProductLayouts}
        onAddWidget={() => setShowAddWidget(true)}
      />
      <AddWidgetDialog open={showAddWidget} onClose={() => setShowAddWidget(false)} templates={widgetTemplates} existingWidgetIds={activeWidgetIds} onAdd={addWidget} />
    </>
  );
};

export default ProductTab;
