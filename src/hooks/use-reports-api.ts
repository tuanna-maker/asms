import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiSuccess } from "@/lib/api-types";
import { qk } from "@/lib/query-keys";

export type ReportsApi = {
  contracts: { total: number; byStatus: Record<string, number> };
  handovers: { total: number };
  training_courses: { total: number };
  warranties: { total: number; byType?: Record<string, number> };
  products: { deliveredTotal: number };
  customers: { total: number };
  customer_breakdown?: Array<{ name: string; contracts: number; value: number }>;
  unit_performance?: Array<{ unit: string; tasks: number; completed: number; onTime: number; satisfaction: number }>;
  summary_delta?: {
    contractsPct: number;
    deliveredPct: number;
    warrantiesPct: number;
  };
  trends?: {
    monthly: Array<{ month: string; contracts: number; complaints: number; handovers: number }>;
  };
};

export function useReportsByYear(year: string) {
  return useQuery({
    queryKey: qk.reports.byYear(year),
    queryFn: async () => {
      const res = await api.get<ApiSuccess<ReportsApi>>(`/api/v1/reports?year=${encodeURIComponent(year)}`);
      return res.data.data;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
