import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReportsEmptyState } from "@/components/reports/ReportsEmptyState";
import type { FeedbackByCustomerItem, ReportsApi } from "@/hooks/use-reports-api";

type Props = {
  reports?: ReportsApi;
  feedback?: FeedbackByCustomerItem[];
  isLoading?: boolean;
};

export function CustomerReportTab({ reports, feedback = [], isLoading }: Props) {
  const contractByCustomer = reports?.customer_breakdown ?? [];

  const tableRows = useMemo(() => {
    const ticketMap = new Map(feedback.map((f) => [f.name, f.tickets]));
    return contractByCustomer.map((c) => ({
      name: c.name,
      contracts: c.contracts,
      value: c.value,
      tickets: ticketMap.get(c.name) ?? 0,
    }));
  }, [contractByCustomer, feedback]);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-8">Đang tải...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Kpi label="Tổng khách hàng" value={reports?.customers.total ?? 0} />
        <Kpi
          label="Tổng giá trị HĐ (triệu)"
          value={contractByCustomer.reduce((s, c) => s + c.value, 0)}
        />
        <Kpi label="Tổng phiếu BH/SC" value={feedback.reduce((s, f) => s + f.tickets, 0)} />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Số hợp đồng theo khách hàng">
          {contractByCustomer.length === 0 ? (
            <ReportsEmptyState text="Chưa có dữ liệu hợp đồng theo khách hàng." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={contractByCustomer}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="contracts" fill="hsl(215, 90%, 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
        <ChartCard title="Giá trị HĐ theo khách hàng (triệu đ)">
          {contractByCustomer.length === 0 ? (
            <ReportsEmptyState text="Chưa có dữ liệu giá trị hợp đồng." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={contractByCustomer}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(170, 60%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
      <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
        <h3 className="mb-3 font-semibold text-card-foreground">Bảng khách hàng</h3>
        {tableRows.length === 0 ? (
          <ReportsEmptyState text="Chưa có dữ liệu bảng khách hàng." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Khách hàng</TableHead>
                <TableHead className="text-right">Số HĐ</TableHead>
                <TableHead className="text-right">Giá trị (triệu)</TableHead>
                <TableHead className="text-right">Phiếu BH/SC</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableRows.map((row) => (
                <TableRow key={row.name}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell className="text-right">{row.contracts}</TableCell>
                  <TableCell className="text-right">{row.value}</TableCell>
                  <TableCell className="text-right">{row.tickets}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border/40 bg-secondary/20 px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold text-card-foreground">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
      <h3 className="mb-3 font-semibold text-card-foreground">{title}</h3>
      {children}
    </div>
  );
}
