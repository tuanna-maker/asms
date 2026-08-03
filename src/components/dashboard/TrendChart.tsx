import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp } from "lucide-react";
import FullscreenWrapper from "./FullscreenWrapper";
import { useIsMobile } from "@/hooks/use-mobile";
import { chartPlotAreaClass, dashboardWidgetHeaderClass, dashboardWidgetShellClass } from "./chartUtils";

interface TrendChartProps {
  data: { month: string; sanXuat: number; hopDong: number; banGiao: number; huanLuyen: number }[];
}

const TrendChart = ({ data }: TrendChartProps) => {
  const isMobile = useIsMobile();
  return (
    <FullscreenWrapper>
      <div className={dashboardWidgetShellClass}>
        <div className={dashboardWidgetHeaderClass}>
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-info/10 text-info">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <h3 className="font-semibold text-sm sm:text-base text-card-foreground truncate">Xu hướng tiến độ theo tháng</h3>
        </div>
        <div className={chartPlotAreaClass}>
          <div className="w-full h-full min-h-[6rem]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: isMobile ? 10 : 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: isMobile ? 10 : 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 13 }}
                labelStyle={{ color: "hsl(var(--card-foreground))", fontWeight: 600 }}
              />
              <Legend wrapperStyle={{ fontSize: isMobile ? 11 : 12 }} />
              <Line type="monotone" dataKey="sanXuat" name="Sản xuất" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="hopDong" name="Hợp đồng" stroke="hsl(var(--info))" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="banGiao" name="Bàn giao" stroke="hsl(var(--success))" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="huanLuyen" name="Huấn luyện" stroke="hsl(var(--warning))" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
          </div>
        </div>
      </div>
    </FullscreenWrapper>
  );
};

export default TrendChart;
