import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReportsEmptyState } from "@/components/reports/ReportsEmptyState";
import { PaginatedTableFooter, usePaginatedSlice } from "@/components/common/PaginatedTableFooter";
import type { FeedbackStatsByProductItem } from "@/hooks/use-feedback-analytics-api";

type Props = {
  items: FeedbackStatsByProductItem[];
};

function formatMaterialsInline(product: FeedbackStatsByProductItem): string {
  const materials = product.materials ?? [];
  if (materials.length === 0) return "—";
  return materials.map((m) => `${m.code} (${m.count})`).join(" · ");
}

export function FeedbackStatsProductsTable({ items }: Props) {
  const tablePag = usePaginatedSlice(items);

  if (items.length === 0) {
    return <ReportsEmptyState text="Chưa có sản phẩm được gắn trên ticket trong kỳ." />;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mã SP</TableHead>
            <TableHead>Sản phẩm</TableHead>
            <TableHead>Vật tư (số lần)</TableHead>
            <TableHead className="text-right w-24">Tổng</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tablePag.pagedItems.map((product) => (
            <TableRow key={product.productId}>
              <TableCell className="font-mono text-xs align-top">{product.code}</TableCell>
              <TableCell className="font-medium align-top">{product.name}</TableCell>
              <TableCell className="text-sm text-muted-foreground align-top">
                {formatMaterialsInline(product)}
              </TableCell>
              <TableCell className="text-right font-semibold align-top">
                {product.linkageLineCount}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <PaginatedTableFooter className="mt-3" {...tablePag.footerProps} />
    </>
  );
}
