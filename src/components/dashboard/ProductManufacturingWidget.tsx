import { Factory, ClipboardCheck, Award, Package } from "lucide-react";
import FullscreenWrapper from "./FullscreenWrapper";
import type { ProductProgress } from "@/data/dashboardData";

interface ProductManufacturingWidgetProps {
  data: ProductProgress;
}

function StatRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between text-sm py-1.5 border-b border-border/30 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold tabular-nums ${color}`}>{value}</span>
    </div>
  );
}

const ProductManufacturingWidget = ({ data }: ProductManufacturingWidgetProps) => {
  const total =
    data.quantity.producing +
    data.quantity.produced +
    data.inspection.submitted +
    data.inspection.inspecting +
    data.inspection.passed +
    data.decisionApproved +
    data.equipped +
    data.equipDecided;

  return (
    <FullscreenWrapper>
      <div className="rounded-xl bg-card p-4 sm:p-5 shadow-sm border border-border/50 h-full min-h-0 flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Factory className="h-5 w-5" />
          </div>
          <h3 className="font-semibold text-card-foreground">Tiến độ sản xuất SP</h3>
          <span className="ml-auto text-xl sm:text-2xl font-bold text-card-foreground">{total}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 min-h-0 overflow-hidden">
          <div className="rounded-lg bg-secondary/40 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Package className="h-3.5 w-3.5" /> Số lượng
            </p>
            <StatRow label="Đang sản xuất" value={data.quantity.producing} color="text-primary" />
            <StatRow label="Sản xuất xong" value={data.quantity.produced} color="text-card-foreground" />
          </div>

          <div className="rounded-lg bg-secondary/40 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <ClipboardCheck className="h-3.5 w-3.5" /> Nghiệm thu cấp bộ
            </p>
            <StatRow label="Số đã trình" value={data.inspection.submitted} color="text-card-foreground" />
            <StatRow label="Đang nghiệm thu" value={data.inspection.inspecting} color="text-info" />
            <StatRow label="Nghiệm thu xong" value={data.inspection.passed} color="text-success" />
          </div>

          <div className="rounded-lg bg-secondary/40 p-3 sm:col-span-2">
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Award className="h-3.5 w-3.5" /> Trang bị &amp; quyết định
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="text-center p-2 rounded-md bg-card">
                <p className="text-xs text-muted-foreground">QĐ phê duyệt KQ</p>
                <p className="text-lg font-bold text-card-foreground">{data.decisionApproved}</p>
              </div>
              <div className="text-center p-2 rounded-md bg-card">
                <p className="text-xs text-muted-foreground">Có QĐ trang bị</p>
                <p className="text-lg font-bold text-card-foreground">{data.equipDecided}</p>
              </div>
              <div className="text-center p-2 rounded-md bg-card">
                <p className="text-xs text-muted-foreground">Đã đưa vào trang bị</p>
                <p className="text-lg font-bold text-success">{data.equipped}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FullscreenWrapper>
  );
};

export default ProductManufacturingWidget;
