import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { LucideIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import FullscreenWrapper from "./FullscreenWrapper";
import { chartPlotAreaClass, dashboardWidgetHeaderClass, dashboardWidgetShellClass, filterNonZeroChartData } from "./chartUtils";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--info))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--accent))",
  "hsl(var(--destructive))",
];

interface PieChartWidgetProps {
  title: string;
  icon: LucideIcon;
  iconColor: string;
  data: { name: string; value: number }[];
}

const PieChartWidget = ({ title, icon: Icon, iconColor, data }: PieChartWidgetProps) => {
  const chartData = filterNonZeroChartData(data);
  const total = chartData.reduce((s, d) => s + d.value, 0);
  const isMobile = useIsMobile();
  const compactData = chartData.slice(0, 8);

  return (
    <FullscreenWrapper>
      <div className={dashboardWidgetShellClass}>
        <div className={dashboardWidgetHeaderClass}>
          <div className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg ${iconColor}`}>
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <h3 className="font-semibold text-sm sm:text-base text-card-foreground truncate">{title}</h3>
        </div>
        {total === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">Không có dữ liệu</p>
        ) : (
          <div className={chartPlotAreaClass}>
            <div className="w-full h-full min-h-[6rem]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={compactData}
                  cx="50%"
                  cy="45%"
                  innerRadius="42%"
                  outerRadius="68%"
                  paddingAngle={2}
                  dataKey="value"
                  label={false}
                  labelLine={false}
                >
                  {compactData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                  formatter={(value: number, name: string) => [value, name]}
                />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ fontSize: isMobile ? 11 : 12, lineHeight: 1.6 }}
                  formatter={(value: string) => {
                    const item = compactData.find((d) => d.name === value);
                    if (item && total > 0) {
                      return `${value} ${Math.round((item.value / total) * 100)}%`;
                    }
                    return value;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </FullscreenWrapper>
  );
};

export default PieChartWidget;
