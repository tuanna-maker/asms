import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiSuccess } from "@/lib/api-types";
import { buildReportQuery, type ReportFilters } from "@/lib/report-filters";
import { qk } from "@/lib/query-keys";

export type MaterialDefectItem = {
  id: string;
  code: string;
  name: string;
  type: string;
  unit: string;
  defects: number;
  estimateQty: number;
  affectedProducts: number;
};

export type MaterialDefectsResult = {
  items: MaterialDefectItem[];
  totalWarranties: number;
};

export function useMaterialDefects(filters?: ReportFilters & { limit?: number }) {
  const year = filters?.year;
  const from = filters?.from;
  const to = filters?.to;
  const limit = filters?.limit;
  return useQuery({
    queryKey: qk.reports.materialDefects(year, from, to, limit),
    queryFn: async () => {
      const base = buildReportQuery({ year, from, to });
      const params = new URLSearchParams(base.replace(/^\?/, ""));
      if (limit) params.set("limit", String(limit));
      const qs = params.toString();
      const res = await api.get<ApiSuccess<MaterialDefectsResult>>(
        qs ? `/api/v1/reports/material-defects?${qs}` : `/api/v1/reports/material-defects`,
      );
      return res.data.data ?? { items: [], totalWarranties: 0 };
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
