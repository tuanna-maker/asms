import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Package } from "lucide-react";
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

const CustomerProductChart = ({ data }: CustomerProductChartProps) => (
  <FullscreenWrapper>
    <div className="rounded-xl bg-card p-5 shadow-sm border border-border/50 flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Package className="h-5 w-5" />
        </div>
        <h3 className="font-semibold text-card-foreground">Sản phẩm theo khách hàng</h3>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 13 }}
              labelStyle={{ color: "hsl(var(--card-foreground))", fontWeight: 600 }}
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

export default CustomerProductChart;
