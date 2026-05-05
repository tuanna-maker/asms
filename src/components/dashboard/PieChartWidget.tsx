import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { LucideIcon } from "lucide-react";
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

interface PieChartWidgetProps {
  title: string;
  icon: LucideIcon;
  iconColor: string;
  data: { name: string; value: number }[];
}

const PieChartWidget = ({ title, icon: Icon, iconColor, data }: PieChartWidgetProps) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  const isMobile = useIsMobile();

  return (
    <FullscreenWrapper>
      <div className="rounded-xl bg-card p-4 sm:p-5 shadow-sm border border-border/50 flex flex-col">
        <div className="flex items-center gap-3 mb-2">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconColor}`}>
            <Icon className="h-5 w-5" />
          </div>
          <h3 className="font-semibold text-card-foreground">{title}</h3>
        </div>
        {total === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">Không có dữ liệu</p>
        ) : (
          <div className={`${isMobile ? "h-[280px]" : "h-[380px]"}`}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="45%"
                  innerRadius={isMobile ? 40 : 70}
                  outerRadius={isMobile ? 65 : 110}
                  paddingAngle={3}
                  dataKey="value"
                  label={isMobile ? false : ({ name, percent, x, y, midAngle }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = 135;
                    const cx2 = x;
                    const cy2 = y;
                    return (
                      <text x={cx2} y={cy2} fill="hsl(var(--muted-foreground))" textAnchor={midAngle > 90 && midAngle < 270 ? "end" : "start"} dominantBaseline="central" fontSize={12}>
                        {`${name} ${(percent * 100).toFixed(0)}%`}
                      </text>
                    );
                  }}
                  labelLine={isMobile ? false : { stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, type: "default" }}
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 13 }}
                  formatter={(value: number, name: string) => [value, name]}
                />
                <Legend
                  wrapperStyle={{ fontSize: isMobile ? 11 : 12 }}
                  formatter={(value: string) => {
                    const item = data.find(d => d.name === value);
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
