import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { DollarSign } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import FullscreenWrapper from "./FullscreenWrapper";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--info))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--accent))",
  "hsl(var(--destructive))",
];

interface CustomerRevenueChartProps {
  data: { name: string; revenue: number }[];
}

const CustomerRevenueChart = ({ data }: CustomerRevenueChartProps) => {
  const isMobile = useIsMobile();
  const truncateLabel = (name: string) => {
    const limit = isMobile ? 14 : 20;
    return name.length > limit ? `${name.slice(0, limit)}...` : name;
  };
  return (
    <FullscreenWrapper>
      <div className="rounded-xl bg-card p-4 sm:p-5 shadow-sm border border-border/50 flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 text-success">
          <DollarSign className="h-5 w-5" />
        </div>
        <h3 className="font-semibold text-card-foreground">Doanh thu theo khách hàng</h3>
      </div>
      <div className={isMobile ? "h-[320px]" : "h-[400px]"}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: isMobile ? 10 : 20, left: isMobile ? -8 : 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" tick={{ fontSize: isMobile ? 10 : 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${v}tr`} />
            <YAxis
              type="category"
              dataKey="name"
              tickFormatter={truncateLabel}
              tick={{ fontSize: isMobile ? 10 : 11, fill: "hsl(var(--muted-foreground))" }}
              width={isMobile ? 88 : 130}
            />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 13 }}
              labelStyle={{ color: "hsl(var(--card-foreground))", fontWeight: 600 }}
              labelFormatter={(_, payload) => (payload?.[0]?.payload?.name as string) ?? ""}
              formatter={(value: number) => [`${value.toLocaleString()} triệu đồng`, "Doanh thu"]}
            />
            <Bar dataKey="revenue" name="Doanh thu (tr)" radius={[0, 4, 4, 0]}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
    </FullscreenWrapper>
  );
};

export default CustomerRevenueChart;
