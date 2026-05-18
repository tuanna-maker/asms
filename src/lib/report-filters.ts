export type ReportFilters = {
  year?: string;
  from?: string;
  to?: string;
  customerId?: string;
};

export type DashboardFilterInput = {
  year: string;
  quarter: string;
  customerId: string;
};

/** Chuyển năm + quý thành bộ lọc API (from/to) */
export function quarterToDateRange(year: string, quarter: string): { from?: string; to?: string } {
  if (quarter === "all" || !year) return {};
  const y = Number(year);
  if (!Number.isFinite(y)) return {};
  const ranges: Record<string, [string, string]> = {
    q1: [`${y}-01-01`, `${y}-03-31`],
    q2: [`${y}-04-01`, `${y}-06-30`],
    q3: [`${y}-07-01`, `${y}-09-30`],
    q4: [`${y}-10-01`, `${y}-12-31`],
  };
  const r = ranges[quarter];
  if (!r) return {};
  return { from: r[0], to: r[1] };
}

export function buildDashboardReportFilters(input: DashboardFilterInput): ReportFilters {
  const { from, to } = quarterToDateRange(input.year, input.quarter);
  const filters: ReportFilters = { year: input.year };
  if (from) filters.from = from;
  if (to) filters.to = to;
  if (input.customerId && input.customerId !== "all") {
    filters.customerId = input.customerId;
  }
  return filters;
}

export function buildReportQuery(filters: ReportFilters): string {
  const p = new URLSearchParams();
  if (filters.year) p.set("year", filters.year);
  if (filters.from) p.set("from", filters.from);
  if (filters.to) p.set("to", filters.to);
  if (filters.customerId) p.set("customerId", filters.customerId);
  const qs = p.toString();
  return qs ? `?${qs}` : "";
}

export function parseReportFiltersFromSearch(params: URLSearchParams): ReportFilters {
  const year = params.get("year") ?? undefined;
  const from = params.get("from") ?? undefined;
  const to = params.get("to") ?? undefined;
  const customerId = params.get("customerId") ?? undefined;
  if (from || to) return { from, to, customerId };
  return { year: year ?? String(new Date().getFullYear()), customerId };
}

export const WARRANTY_TYPE_LABELS: Record<string, string> = {
  warranty: "Bảo hành",
  repair: "Sửa chữa",
  maintenance: "Bảo trì",
};

export const CONTRACT_STATUS_LABELS: Record<string, string> = {
  draft: "Nháp",
  active: "Đang thực hiện",
  completed: "Hoàn thành",
  late: "Chậm tiến độ",
  liquidated: "Đã thanh lý",
};
