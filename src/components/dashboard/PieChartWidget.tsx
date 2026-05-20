import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { LucideIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import FullscreenWrapper from "./FullscreenWrapper";
import { chartPlotAreaClass, filterNonZeroChartData } from "./chartUtils";

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
      <div className="rounded-xl bg-card p-4 sm:p-5 shadow-sm border border-border/50 flex flex-col h-full min-h-0">
        <div className="flex items-center gap-3 mb-3 shrink-0">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconColor}`}>
            <Icon className="h-5 w-5" />
          </div>
          <h3 className="font-semibold text-card-foreground">{title}</h3>
        </div>
        {total === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">Không có dữ liệu</p>
        ) : (
          <div className={chartPlotAreaClass}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={compactData}
                  cx="50%"
                  cy={isMobile ? "42%" : "40%"}
                  innerRadius={isMobile ? 44 : 74}
                  outerRadius={isMobile ? 72 : 118}
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
        )}
      </div>
    </FullscreenWrapper>
  );
};

export default PieChartWidget;
