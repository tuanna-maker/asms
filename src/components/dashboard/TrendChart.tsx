import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp } from "lucide-react";
import FullscreenWrapper from "./FullscreenWrapper";

interface TrendChartProps {
  data: { month: string; sanXuat: number; hopDong: number; banGiao: number; huanLuyen: number }[];
}

const TrendChart = ({ data }: TrendChartProps) => (
  <FullscreenWrapper>
    <div className="rounded-xl bg-card p-5 shadow-sm border border-border/50 flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-info/10 text-info">
          <TrendingUp className="h-5 w-5" />
        </div>
        <h3 className="font-semibold text-card-foreground">Xu hướng tiến độ theo tháng</h3>
      </div>
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 13 }}
              labelStyle={{ color: "hsl(var(--card-foreground))", fontWeight: 600 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="sanXuat" name="Sản xuất" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="hopDong" name="Hợp đồng" stroke="hsl(var(--info))" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="banGiao" name="Bàn giao" stroke="hsl(var(--success))" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="huanLuyen" name="Huấn luyện" stroke="hsl(var(--warning))" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  </FullscreenWrapper>
);

export default TrendChart;
