import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Package } from "lucide-react";
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

interface CustomerProductChartProps {
  data: { name: string; products: number }[];
}

const CustomerProductChart = ({ data }: CustomerProductChartProps) => {
  const isMobile = useIsMobile();
  const truncateLabel = (name: string) => {
    const limit = isMobile ? 12 : 16;
    return name.length > limit ? `${name.slice(0, limit)}...` : name;
  };
  return (
    <FullscreenWrapper>
      <div className="rounded-xl bg-card p-4 sm:p-5 shadow-sm border border-border/50 flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Package className="h-5 w-5" />
        </div>
        <h3 className="font-semibold text-card-foreground">Sản phẩm theo khách hàng</h3>
      </div>
      <div className={isMobile ? "h-[320px]" : "h-[400px]"}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: isMobile ? 28 : 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              tickFormatter={truncateLabel}
              tick={{ fontSize: isMobile ? 10 : 11, fill: "hsl(var(--muted-foreground))" }}
              interval={0}
              angle={isMobile ? -26 : -18}
              textAnchor="end"
              height={isMobile ? 58 : 46}
            />
            <YAxis tick={{ fontSize: isMobile ? 10 : 11, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 13 }}
              labelStyle={{ color: "hsl(var(--card-foreground))", fontWeight: 600 }}
              labelFormatter={(_, payload) => (payload?.[0]?.payload?.name as string) ?? ""}
            />
            <Bar dataKey="products" name="Sản phẩm" radius={[4, 4, 0, 0]}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
    </FullscreenWrapper>
  );
};

export default CustomerProductChart;
