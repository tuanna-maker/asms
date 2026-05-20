import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReportsEmptyState } from "@/components/reports/ReportsEmptyState";
import type { ProductLineReportItem } from "@/hooks/use-reports-api";
import { PaginatedTableFooter, usePaginatedSlice } from "@/components/common/PaginatedTableFooter";

type Props = {
  items: ProductLineReportItem[];
  isLoading?: boolean;
};

export function ProductLineReportTab({ items, isLoading }: Props) {
  const tablePag = usePaginatedSlice(items);
  const chartData = items.map((i) => ({
    name: i.category,
    produced: i.produced,
    delivered: i.delivered,
    warranty: i.warrantyCount,
  }));

  const topWarranty = items[0]?.category ?? "—";
  const totalProducts = items.reduce((s, i) => s + i.produced, 0);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-8">Đang tải...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border/40 bg-secondary/20 px-4 py-3">
          <p className="text-xs text-muted-foreground">Tổng sản lượng (theo SP)</p>
          <p className="text-xl font-bold">{totalProducts}</p>
        </div>
        <div className="rounded-lg border border-border/40 bg-secondary/20 px-4 py-3">
          <p className="text-xs text-muted-foreground">Dòng SP nhiều phiếu BH nhất</p>
          <p className="text-xl font-bold">{topWarranty}</p>
        </div>
      </div>
      <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
        <h3 className="mb-3 font-semibold">Thống kê theo dòng sản phẩm (Product.category)</h3>
        {chartData.length === 0 ? (
          <ReportsEmptyState text="Chưa có dữ liệu theo dòng sản phẩm." />
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="produced" name="Sản xuất" fill="hsl(215, 90%, 50%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="delivered" name="Đã giao" fill="hsl(150, 60%, 45%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="warranty" name="Phiếu BH/SC" fill="hsl(38, 92%, 55%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
        <h3 className="mb-3 font-semibold">Bảng theo category</h3>
        {items.length === 0 ? (
          <ReportsEmptyState text="Chưa có dữ liệu bảng." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dòng SP</TableHead>
                <TableHead className="text-right">Sản xuất</TableHead>
                <TableHead className="text-right">Đã giao</TableHead>
                <TableHead className="text-right">Phiếu BH/SC</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tablePag.pagedItems.map((row) => (
                <TableRow key={row.category}>
                  <TableCell>{row.category}</TableCell>
                  <TableCell className="text-right">{row.produced}</TableCell>
                  <TableCell className="text-right">{row.delivered}</TableCell>
                  <TableCell className="text-right">{row.warrantyCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {items.length > 0 && <PaginatedTableFooter className="mt-3" {...tablePag.footerProps} />}
      </div>
    </div>
  );
}
