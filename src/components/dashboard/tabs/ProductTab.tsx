import { useState, useMemo } from "react";
import { Package, Layers, CheckCircle, Clock } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import ProgressWidget from "@/components/dashboard/ProgressWidget";
import CustomerProductChart from "@/components/dashboard/CustomerProductChart";
import PieChartWidget from "@/components/dashboard/PieChartWidget";
import TrendChart from "@/components/dashboard/TrendChart";
import DashboardGrid, { WidgetConfig } from "@/components/dashboard/DashboardGrid";
import AddWidgetDialog from "@/components/dashboard/AddWidgetDialog";
import DashboardTable, { StatusBadge, Column } from "@/components/dashboard/DashboardTable";
import { DashboardData } from "@/data/dashboardData";
import { productsData, ProductRow } from "@/data/tableData";

interface ProductTabProps {
  data: DashboardData;
}

const productCols: Column<ProductRow>[] = [
  { key: "id", label: "Mã SP", sortable: true, render: (r) => <span className="font-medium text-primary">{r.id}</span> },
  { key: "name", label: "Tên sản phẩm", sortable: true },
  { key: "category", label: "Phân loại", sortable: true, filterable: true, filterOptions: [
    { value: "Vô tuyến", label: "Vô tuyến" }, { value: "Mã hóa", label: "Mã hóa" }, { value: "Trinh sát", label: "Trinh sát" },
    { value: "Chuyển tiếp", label: "Chuyển tiếp" }, { value: "Vệ tinh", label: "Vệ tinh" }, { value: "Chỉ huy", label: "Chỉ huy" },
    { value: "Số", label: "Số" }, { value: "Ra đa", label: "Ra đa" }, { value: "Truyền dẫn", label: "Truyền dẫn" },
  ], hideOnMobile: true },
  { key: "customer", label: "Khách hàng", sortable: true, filterable: true, filterOptions: [
    { value: "Quân khu 1", label: "Quân khu 1" }, { value: "Quân khu 3", label: "Quân khu 3" },
    { value: "Quân khu 5", label: "Quân khu 5" }, { value: "Quân khu 7", label: "Quân khu 7" },
    { value: "Quân khu 9", label: "Quân khu 9" }, { value: "Bộ TL TTTM", label: "Bộ TL TTTM" },
  ], hideOnMobile: true },
  { key: "quantity", label: "SL", sortable: true, sortValue: (r) => r.quantity },
  { key: "status", label: "Trạng thái", filterable: true, filterOptions: [
    { value: "producing", label: "Đang SX" }, { value: "inspecting", label: "Nghiệm thu" }, { value: "equipped", label: "Đã trang bị" },
  ], render: (r) => (
    <StatusBadge status={r.status === "equipped" ? "success" : r.status === "inspecting" ? "warning" : "info"} label={r.status === "equipped" ? "Đã trang bị" : r.status === "inspecting" ? "Nghiệm thu" : "Đang SX"} />
  )},
  { key: "deliveryDate", label: "Ngày giao", hideOnMobile: true },
];

const widgetTemplates = [
  { id: "stats", title: "Thống kê SP", description: "4 thẻ", icon: Package, category: "Tổng hợp", defaultSize: { w: 12, h: 2 } },
  { id: "progress", title: "Tiến độ SP", description: "Thanh tiến độ", icon: Layers, category: "Tiến độ", defaultSize: { w: 6, h: 4 } },
  { id: "pie", title: "Phân loại SP", description: "Biểu đồ tròn", icon: Layers, category: "Biểu đồ", defaultSize: { w: 6, h: 5 } },
  { id: "chart-customer", title: "SP theo KH", description: "Biểu đồ cột", icon: Package, category: "Biểu đồ", defaultSize: { w: 12, h: 5 } },
  { id: "trend", title: "Xu hướng", description: "Biểu đồ đường", icon: Clock, category: "Biểu đồ", defaultSize: { w: 12, h: 5 } },
  { id: "table", title: "Bảng SP", description: "Danh sách", icon: Package, category: "Tổng hợp", defaultSize: { w: 12, h: 5 } },
];

const ProductTab = ({ data }: ProductTabProps) => {
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [activeWidgetIds, setActiveWidgetIds] = useState<string[]>(widgetTemplates.map(w => w.id));

  const widgetComponents: Record<string, React.ReactNode> = useMemo(() => ({
    "stats": (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 h-full">
        <StatCard title="Tổng sản phẩm" value={data.product.total} icon={Package} color="primary" />
        <StatCard title="Đang sản xuất" value={data.product.producing} icon={Clock} color="info" />
        <StatCard title="Nghiệm thu" value={data.product.inspecting} icon={Layers} color="warning" />
        <StatCard title="Đã trang bị" value={data.product.equipped} icon={CheckCircle} color="success" />
      </div>
    ),
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
    "table": <DashboardTable title="Danh sách sản phẩm" columns={productCols} data={productsData} />,
  }), [data]);

  const widgets: WidgetConfig[] = useMemo(() =>
    activeWidgetIds.filter(id => widgetComponents[id]).map(id => {
      const tpl = widgetTemplates.find(t => t.id === id);
      return { id, type: id, title: tpl?.title || id, component: widgetComponents[id], defaultLayout: { w: tpl?.defaultSize.w || 6, h: tpl?.defaultSize.h || 4, minW: 3, minH: 2 } };
    }), [activeWidgetIds, widgetComponents]);

  return (
    <>
      <DashboardGrid widgets={widgets} storageKey="product-dashboard" onAddWidget={() => setShowAddWidget(true)} />
      <AddWidgetDialog open={showAddWidget} onClose={() => setShowAddWidget(false)} templates={widgetTemplates} existingWidgetIds={activeWidgetIds} onAdd={(id) => { if (!activeWidgetIds.includes(id)) setActiveWidgetIds(prev => [...prev, id]); }} />
    </>
  );
};

export default ProductTab;
