import { useMemo } from "react";
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReportsEmptyState } from "@/components/reports/ReportsEmptyState";
import { CONTRACT_STATUS_LABELS } from "@/lib/report-filters";
import type { ReportsApi } from "@/hooks/use-reports-api";

type Props = {
  reports?: ReportsApi;
  isLoading?: boolean;
};

const PIE_COLORS = [
  "hsl(215, 90%, 50%)",
  "hsl(150, 60%, 45%)",
  "hsl(38, 92%, 55%)",
  "hsl(220, 15%, 70%)",
  "hsl(280, 50%, 55%)",
];

export function ContractReportTab({ reports, isLoading }: Props) {
  const contractStatusPie = useMemo(() => {
    const byStatus = reports?.contracts.byStatus ?? {};
    return Object.entries(byStatus)
      .filter(([, v]) => v > 0)
      .map(([status, value], i) => ({
        name: CONTRACT_STATUS_LABELS[status] ?? status,
        value,
        fill: PIE_COLORS[i % PIE_COLORS.length],
      }));
  }, [reports]);

  const monthlyTrend = reports?.trends?.monthly ?? [];
  const contractsList = reports?.contracts_list ?? [];
  const contractsTotal = reports?.contracts.total ?? 0;
  const completed = reports?.contracts.byStatus?.completed ?? 0;
  const completionPct = contractsTotal > 0 ? Math.round((completed / contractsTotal) * 100) : 0;

  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-8">Đang tải...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border/40 bg-secondary/20 px-4 py-3">
          <p className="text-xs text-muted-foreground">Tổng hợp đồng</p>
          <p className="text-xl font-bold">{contractsTotal}</p>
        </div>
        <div className="rounded-lg border border-border/40 bg-secondary/20 px-4 py-3">
          <p className="text-xs text-muted-foreground">% hoàn thành</p>
          <p className="text-xl font-bold text-success">{completionPct}%</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
          <h3 className="mb-3 font-semibold">Trạng thái hợp đồng</h3>
          {contractStatusPie.length === 0 ? (
            <ReportsEmptyState text="Chưa có dữ liệu trạng thái hợp đồng." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={contractStatusPie} cx="50%" cy="50%" outerRadius={95} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {contractStatusPie.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
          <h3 className="mb-3 font-semibold">Xu hướng theo tháng</h3>
          {monthlyTrend.length === 0 ? (
            <ReportsEmptyState text="Chưa có dữ liệu xu hướng theo tháng." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="contracts" name="Hợp đồng" stroke="hsl(215, 90%, 50%)" strokeWidth={2} />
                <Line type="monotone" dataKey="complaints" name="Phiếu BH/SC" stroke="hsl(38, 92%, 55%)" strokeWidth={2} />
                <Line type="monotone" dataKey="handovers" name="Bàn giao" stroke="hsl(150, 60%, 45%)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
        <h3 className="mb-3 font-semibold">Danh sách hợp đồng</h3>
        {contractsList.length === 0 ? (
          <ReportsEmptyState text="Chưa có hợp đồng trong kỳ đã chọn." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã</TableHead>
                <TableHead>Tên</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Giá trị</TableHead>
                <TableHead className="text-right">Tiến độ %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contractsList.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs">{c.code}</TableCell>
                  <TableCell>{c.title}</TableCell>
                  <TableCell>{c.customerName}</TableCell>
                  <TableCell>{CONTRACT_STATUS_LABELS[c.status] ?? c.status}</TableCell>
                  <TableCell className="text-right">{c.value.toLocaleString("vi-VN")}</TableCell>
                  <TableCell className="text-right">{c.progress}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
