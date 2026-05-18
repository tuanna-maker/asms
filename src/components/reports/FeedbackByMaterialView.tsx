import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReportsEmptyState } from "@/components/reports/ReportsEmptyState";
import type { MaterialDefectItem } from "@/hooks/use-material-defects";

type Props = {
  items: MaterialDefectItem[];
  totalWarranties: number;
  isLoading?: boolean;
};

export function FeedbackByMaterialView({ items, totalWarranties, isLoading }: Props) {
  const chartData = items.slice(0, 12).map((i) => ({ name: i.code, defects: i.defects }));

  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-8">Đang tải...</p>;
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground rounded-md border border-amber-200/60 bg-amber-50/50 px-3 py-2 dark:border-amber-900/40 dark:bg-amber-950/20">
        Chỉ số vật tư lỗi ước tính từ BOM sản phẩm (heuristic), có thể khác với vật tư ghi trực tiếp trên phiếu BH.
      </p>
      <div className="rounded-lg border border-border/40 bg-secondary/20 px-4 py-3 inline-block">
        <p className="text-xs text-muted-foreground">Tổng phiếu có sản phẩm (trong kỳ)</p>
        <p className="text-xl font-bold">{totalWarranties}</p>
      </div>
      <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
        <h3 className="mb-3 font-semibold">Top vật tư/LK theo số lỗi ước tính</h3>
        {chartData.length === 0 ? (
          <ReportsEmptyState text="Chưa có dữ liệu vật tư từ BOM." />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="defects" name="Lỗi ước tính" fill="hsl(38, 92%, 55%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
        <h3 className="mb-3 font-semibold">Bảng vật tư</h3>
        {items.length === 0 ? (
          <ReportsEmptyState text="Chưa có dữ liệu vật tư." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã</TableHead>
                <TableHead>Tên</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead className="text-right">Lỗi ước tính</TableHead>
                <TableHead className="text-right">SP ảnh hưởng</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-xs">{row.code}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.type}</TableCell>
                  <TableCell className="text-right">{row.defects}</TableCell>
                  <TableCell className="text-right">{row.affectedProducts}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
