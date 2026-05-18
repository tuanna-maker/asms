/** Vùng vẽ Recharts trong grid flex — tránh height 0 khi dùng ResponsiveContainer */
export const chartPlotAreaClass = "flex-1 h-0 min-h-[220px] w-full";

/** Chiều rộng trục Y cho biểu đồ ngang — đủ hiển thị tên KH dài */
export function chartCategoryAxisWidth(labels: string[], min = 100, max = 220): number {
  if (labels.length === 0) return min;
  const maxLen = Math.max(...labels.map((s) => s.length));
  return Math.min(max, Math.max(min, Math.ceil(maxLen * 6.5)));
}
