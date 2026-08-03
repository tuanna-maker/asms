import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { DollarSign } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import FullscreenWrapper from "./FullscreenWrapper";
import { chartCategoryAxisWidth, chartPlotAreaClass, dashboardWidgetHeaderClass, dashboardWidgetShellClass } from "./chartUtils";

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
  const yAxisWidth = chartCategoryAxisWidth(
    data.map((d) => d.name),
    isMobile ? 72 : 100,
    isMobile ? 140 : 220,
  );

  return (
    <FullscreenWrapper>
      <div className={dashboardWidgetShellClass}>
        <div className={dashboardWidgetHeaderClass}>
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-success/10 text-success">
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <h3 className="font-semibold text-sm sm:text-base text-card-foreground truncate">Doanh thu theo khách hàng</h3>
        </div>
        <div className={chartPlotAreaClass}>
          <div className="w-full h-full min-h-[6rem]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: isMobile ? 10 : 20, left: 4, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                type="number"
                tick={{ fontSize: isMobile ? 10 : 11, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v) => `${v}tr`}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: isMobile ? 10 : 11, fill: "hsl(var(--muted-foreground))" }}
                width={yAxisWidth}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 13,
                }}
                labelStyle={{ color: "hsl(var(--card-foreground))", fontWeight: 600 }}
                labelFormatter={(_, payload) => (payload?.[0]?.payload?.name as string) ?? ""}
                formatter={(value: number) => [`${value.toLocaleString()} triệu đồng`, "Doanh thu"]}
              />
              <Bar dataKey="revenue" name="Doanh thu (tr)" radius={[0, 4, 4, 0]}>
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          </div>
        </div>
      </div>
    </FullscreenWrapper>
  );
};

export default CustomerRevenueChart;
