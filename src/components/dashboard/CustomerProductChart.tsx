import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Package } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import FullscreenWrapper from "./FullscreenWrapper";
import { chartPlotAreaClass, dashboardWidgetHeaderClass, dashboardWidgetShellClass, truncateChartLabel } from "./chartUtils";

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
  const chartData = data.filter((d) => d.products > 0);

  return (
    <FullscreenWrapper>
      <div className={dashboardWidgetShellClass}>
        <div className={dashboardWidgetHeaderClass}>
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Package className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <h3 className="font-semibold text-sm sm:text-base text-card-foreground truncate">Sản phẩm theo khách hàng</h3>
        </div>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">Không có dữ liệu sản phẩm theo khách hàng</p>
        ) : (
        <div className={chartPlotAreaClass}>
          <div className="w-full h-full min-h-[6rem]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: isMobile ? 64 : 52 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: isMobile ? 9 : 10, fill: "hsl(var(--muted-foreground))" }}
                interval={0}
                angle={isMobile ? -35 : -28}
                textAnchor="end"
                height={isMobile ? 80 : 68}
                tickFormatter={(v: string) => truncateChartLabel(v, isMobile ? 16 : 22)}
              />
              <YAxis tick={{ fontSize: isMobile ? 10 : 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 13,
                }}
                labelStyle={{ color: "hsl(var(--card-foreground))", fontWeight: 600 }}
                labelFormatter={(_, payload) => (payload?.[0]?.payload?.name as string) ?? ""}
              />
              <Bar dataKey="products" name="Sản phẩm" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          </div>
        </div>
        )}
      </div>
    </FullscreenWrapper>
  );
};

export default CustomerProductChart;
