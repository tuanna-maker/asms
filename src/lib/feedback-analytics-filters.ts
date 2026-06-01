import type { CustomerFeedbackStatus } from "@/hooks/use-customer-feedbacks-api";

export type FeedbackStatsPeriod = "day" | "1m" | "3m" | "6m" | "1y" | "all";
export type FeedbackStatsSubTab = "customer" | "catalog";

export type FeedbackAnalyticsFilters = {
  from?: string;
  to?: string;
  customerId?: string;
  contractId?: string;
  status?: CustomerFeedbackStatus;
  limit?: number;
};

const VALID_PERIODS = new Set<FeedbackStatsPeriod>(["day", "1m", "3m", "6m", "1y", "all"]);
const VALID_TABS = new Set<FeedbackStatsSubTab>(["customer", "catalog"]);

const PERIOD_DAY_OFFSET: Record<Exclude<FeedbackStatsPeriod, "day" | "all">, number> = {
  "1m": 30,
  "3m": 90,
  "6m": 180,
  "1y": 365,
};

export const FEEDBACK_STATS_PERIOD_LABELS: Record<FeedbackStatsPeriod, string> = {
  day: "Hôm nay",
  "1m": "1 tháng",
  "3m": "3 tháng",
  "6m": "6 tháng",
  "1y": "1 năm",
  all: "Tất cả",
};

export const DEFAULT_FEEDBACK_STATS_PERIOD: FeedbackStatsPeriod = "1y";

/** Chuyển preset kỳ → from/to ISO (UTC) gửi API analytics. */
export function periodToDateRange(period: FeedbackStatsPeriod): { from?: string; to?: string } {
  if (period === "all") return {};

  const now = new Date();
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999),
  );

  if (period === "day") {
    const start = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0),
    );
    return { from: start.toISOString(), to: end.toISOString() };
  }

  const days = PERIOD_DAY_OFFSET[period];
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - days + 1);
  start.setUTCHours(0, 0, 0, 0);
  return { from: start.toISOString(), to: end.toISOString() };
}

export function periodToAnalyticsFilters(period: FeedbackStatsPeriod): FeedbackAnalyticsFilters {
  return periodToDateRange(period);
}

export function parseFeedbackStatsPeriod(raw: string | null): FeedbackStatsPeriod {
  if (raw && VALID_PERIODS.has(raw as FeedbackStatsPeriod)) return raw as FeedbackStatsPeriod;
  return DEFAULT_FEEDBACK_STATS_PERIOD;
}

export function parseFeedbackStatsSubTab(raw: string | null): FeedbackStatsSubTab {
  if (raw === "product" || raw === "material") return "catalog";
  if (raw && VALID_TABS.has(raw as FeedbackStatsSubTab)) return raw as FeedbackStatsSubTab;
  return "customer";
}

export function buildFeedbackAnalyticsQuery(filters: FeedbackAnalyticsFilters): string {
  const p = new URLSearchParams();
  if (filters.from) p.set("from", filters.from);
  if (filters.to) p.set("to", filters.to);
  if (filters.customerId) p.set("customerId", filters.customerId);
  if (filters.contractId) p.set("contractId", filters.contractId);
  if (filters.status) p.set("status", filters.status);
  if (filters.limit != null) p.set("limit", String(filters.limit));
  const qs = p.toString();
  return qs ? `?${qs}` : "";
}

export function feedbackAnalyticsFilterKey(filters: FeedbackAnalyticsFilters): string {
  return [
    filters.from ?? "",
    filters.to ?? "",
    filters.customerId ?? "",
    filters.contractId ?? "",
    filters.status ?? "",
    filters.limit ?? "",
  ].join("|");
}

export type FeedbackStatsUrlState = {
  period: FeedbackStatsPeriod;
  tab: FeedbackStatsSubTab;
  filters: FeedbackAnalyticsFilters;
};

export function parseFeedbackStatsFromSearch(params: URLSearchParams): FeedbackStatsUrlState {
  const period = parseFeedbackStatsPeriod(params.get("period"));
  const tab = parseFeedbackStatsSubTab(params.get("tab"));
  return {
    period,
    tab,
    filters: periodToAnalyticsFilters(period),
  };
}

export function buildFeedbackStatsSearchParams(period: FeedbackStatsPeriod, tab: FeedbackStatsSubTab): URLSearchParams {
  const next = new URLSearchParams();
  next.set("period", period);
  next.set("tab", tab);
  return next;
}
