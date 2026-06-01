import type {
  FeedbackStatsByMaterialItem,
  FeedbackStatsByProductItem,
} from "@/hooks/use-feedback-analytics-api";
import { FeedbackStatsMaterialsTable } from "./FeedbackStatsMaterialsTable";
import { FeedbackStatsProductsTable } from "./FeedbackStatsProductsTable";

type Props = {
  materials: FeedbackStatsByMaterialItem[];
  products: FeedbackStatsByProductItem[];
  isLoading?: boolean;
};

export function FeedbackStatsCatalogPanel({ materials, products, isLoading }: Props) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-8">Đang tải...</p>;
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground rounded-md border border-border/50 bg-secondary/20 px-3 py-2">
        Thống kê theo dòng liên kết SP/VT trên ticket phản ánh trong kỳ. Mỗi sản phẩm hiển thị đầy đủ vật tư con và
        số lần gắn.
      </p>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border/50 bg-card p-4 shadow-sm min-w-0">
          <h3 className="mb-3 font-semibold">Vật tư</h3>
          <FeedbackStatsMaterialsTable items={materials} />
        </section>
        <section className="rounded-xl border border-border/50 bg-card p-4 shadow-sm min-w-0">
          <h3 className="mb-3 font-semibold">Sản phẩm</h3>
          <FeedbackStatsProductsTable items={products} />
        </section>
      </div>
    </div>
  );
}
