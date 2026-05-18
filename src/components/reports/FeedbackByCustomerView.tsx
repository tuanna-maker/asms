import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReportsEmptyState } from "@/components/reports/ReportsEmptyState";
import { WARRANTY_TYPE_LABELS } from "@/lib/report-filters";
import type { FeedbackByCustomerItem } from "@/hooks/use-reports-api";

type Props = {
  items: FeedbackByCustomerItem[];
  isLoading?: boolean;
};

export function FeedbackByCustomerView({ items, isLoading }: Props) {
  const top10 = items.slice(0, 10).map((i) => ({ name: i.name, tickets: i.tickets }));
  const totalTickets = items.reduce((s, i) => s + i.tickets, 0);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-8">Đang tải...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border/40 bg-secondary/20 px-4 py-3 inline-block">
        <p className="text-xs text-muted-foreground">Tổng phiếu BH/SC (phản ánh)</p>
        <p className="text-xl font-bold">{totalTickets}</p>
      </div>
      <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
        <h3 className="mb-3 font-semibold">Top khách hàng theo số phiếu</h3>
        {top10.length === 0 ? (
          <ReportsEmptyState text="Chưa có phiếu bảo hành/sửa chữa trong kỳ." />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={top10}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="tickets" name="Phiếu" fill="hsl(38, 92%, 55%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
        <h3 className="mb-3 font-semibold">Chi tiết theo khách hàng × loại phiếu</h3>
        {items.length === 0 ? (
          <ReportsEmptyState text="Chưa có dữ liệu." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Khách hàng</TableHead>
                <TableHead className="text-right">Tổng phiếu</TableHead>
                <TableHead>Phân loại</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((row) => (
                <TableRow key={row.customerId}>
                  <TableCell>{row.name}</TableCell>
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
