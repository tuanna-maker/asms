/** Vùng vẽ Recharts trong grid flex — tránh height 0 khi dùng ResponsiveContainer */
/** Không đặt min-height cố định — biểu đồ co theo chiều cao ô grid, tránh scrollbar trong widget */
export const chartPlotAreaClass = "flex-1 min-h-0 w-full";

export type ChartDatum = { name: string; value: number };

/** Bỏ mục value = 0 khỏi biểu đồ / legend (tránh 0% thừa). */
export function filterNonZeroChartData(data: ChartDatum[]): ChartDatum[] {
  return data.filter((d) => d.value > 0);
}

/** % còn lại (khớp nhãn «Còn lại: x / y» trên thanh tiến độ). */
export function remainingPercent(remaining: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((remaining / total) * 100)));
}

export function truncateChartLabel(label: string, maxLen = 28): string {
  if (label.length <= maxLen) return label;
  return `${label.slice(0, maxLen - 1)}…`;
}

/** Chiều rộng trục Y cho biểu đồ ngang — đủ hiển thị tên KH dài */
export function chartCategoryAxisWidth(labels: string[], min = 100, max = 220): number {
  if (labels.length === 0) return min;
  const maxLen = Math.max(...labels.map((s) => s.length));
  return Math.min(max, Math.max(min, Math.ceil(maxLen * 6.5)));
}
