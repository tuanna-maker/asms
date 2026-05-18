import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReportsEmptyState } from "@/components/reports/ReportsEmptyState";
import { WARRANTY_TYPE_LABELS } from "@/lib/report-filters";
import type { FeedbackByProductLineItem } from "@/hooks/use-reports-api";

type Props = {
  items: FeedbackByProductLineItem[];
  isLoading?: boolean;
};

export function FeedbackByProductLineView({ items, isLoading }: Props) {
  const chartData = items.map((i) => ({ name: i.category, tickets: i.tickets }));

  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-8">Đang tải...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
        <h3 className="mb-3 font-semibold">Phiếu BH/SC theo dòng sản phẩm</h3>
        {chartData.length === 0 ? (
          <ReportsEmptyState text="Chưa có phiếu theo dòng sản phẩm." />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="tickets" name="Phiếu" fill="hsl(215, 90%, 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
        <h3 className="mb-3 font-semibold">Bảng category × loại phiếu</h3>
        {items.length === 0 ? (
          <ReportsEmptyState text="Chưa có dữ liệu." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dòng SP</TableHead>
                <TableHead className="text-right">Tổng phiếu</TableHead>
                <TableHead>Phân loại</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((row) => (
                <TableRow key={row.category}>
                  <TableCell>{row.category}</TableCell>
                  <TableCell className="text-right">{row.tickets}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {Object.entries(row.byType)
                      .map(([t, n]) => `${WARRANTY_TYPE_LABELS[t] ?? t}: ${n}`)
                      .join(" · ")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
