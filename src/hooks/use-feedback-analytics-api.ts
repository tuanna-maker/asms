import { useQuery, useQueries } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiSuccess } from "@/lib/api-types";
import {
  buildFeedbackAnalyticsQuery,
  feedbackAnalyticsFilterKey,
  type FeedbackAnalyticsFilters,
} from "@/lib/feedback-analytics-filters";
import type { FeedbackLinkageItem } from "@/hooks/use-customer-feedbacks-api";
import { qk } from "@/lib/query-keys";

export type FeedbackStatsByCustomerItem = {
  customerId: string;
  code: string;
  name: string;
  ticketCount: number;
  linkageLineCount: number;
  openCount: number;
  resolvedCount: number;
};

export type FeedbackStatsMaterialRef = {
  materialId: string;
  code: string;
  name: string;
  count: number;
};

export type FeedbackStatsByProductItem = {
  productId: string;
  code: string;
  name: string;
  linkageLineCount: number;
  ticketCount: number;
  materials: FeedbackStatsMaterialRef[];
};

export type FeedbackStatsByMaterialItem = {
  materialId: string;
  code: string;
  name: string;
  linkageLineCount: number;
  ticketCount: number;
  productCount: number;
  customerCount: number;
};

export type FeedbackCustomerStatsDetailTicket = {
  id: string;
  title: string;
  content: string;
  status: string;
  feedbackAt: string;
  linkageItems: FeedbackLinkageItem[];
};

export type FeedbackCustomerStatsDetail = {
  customer: { id: string; code: string; name: string };
  summary: {
    ticketCount: number;
    openCount: number;
    resolvedCount: number;
    linkageLineCount: number;
  };
  tickets: FeedbackCustomerStatsDetailTicket[];
};

const STALE_MS = 60_000;

async function fetchByCustomer(filters: FeedbackAnalyticsFilters) {
  const res = await api.get<ApiSuccess<{ items: FeedbackStatsByCustomerItem[] }>>(
    `/api/v1/customer-feedbacks/analytics/by-customer${buildFeedbackAnalyticsQuery(filters)}`,
  );
  return res.data.data?.items ?? [];
}

type ByProductApiItem = FeedbackStatsByProductItem & {
  topMaterials?: FeedbackStatsMaterialRef[];
};

function normalizeByProductItem(row: ByProductApiItem): FeedbackStatsByProductItem {
  const materials = row.materials ?? row.topMaterials ?? [];
  return {
    productId: row.productId,
    code: row.code,
    name: row.name,
    linkageLineCount: row.linkageLineCount,
    ticketCount: row.ticketCount,
    materials,
  };
}

async function fetchByProduct(filters: FeedbackAnalyticsFilters) {
  const res = await api.get<ApiSuccess<{ items: ByProductApiItem[] }>>(
    `/api/v1/customer-feedbacks/analytics/by-product${buildFeedbackAnalyticsQuery(filters)}`,
  );
  return (res.data.data?.items ?? []).map(normalizeByProductItem);
}

async function fetchByMaterial(filters: FeedbackAnalyticsFilters) {
  const res = await api.get<ApiSuccess<{ items: FeedbackStatsByMaterialItem[] }>>(
    `/api/v1/customer-feedbacks/analytics/by-material${buildFeedbackAnalyticsQuery(filters)}`,
  );
  return res.data.data?.items ?? [];
}

async function fetchCustomerDetail(customerId: string, filters: FeedbackAnalyticsFilters) {
  const res = await api.get<ApiSuccess<FeedbackCustomerStatsDetail>>(
    `/api/v1/customer-feedbacks/analytics/customer/${customerId}/detail${buildFeedbackAnalyticsQuery(filters)}`,
  );
  return res.data.data;
}

export function useFeedbackStatsCustomerList(filters: FeedbackAnalyticsFilters, enabled = true) {
  const key = feedbackAnalyticsFilterKey(filters);
  return useQuery({
    queryKey: qk.customerFeedbacks.analyticsByCustomer(key),
    queryFn: () => fetchByCustomer(filters),
    enabled,
    staleTime: STALE_MS,
    refetchOnWindowFocus: false,
  });
}

export function useFeedbackStatsCatalog(filters: FeedbackAnalyticsFilters, enabled = true) {
  const key = feedbackAnalyticsFilterKey(filters);
  const [productQ, materialQ] = useQueries({
    queries: [
      {
        queryKey: qk.customerFeedbacks.analyticsByProduct(key),
        queryFn: () => fetchByProduct(filters),
        enabled,
        staleTime: STALE_MS,
        refetchOnWindowFocus: false,
      },
      {
        queryKey: qk.customerFeedbacks.analyticsByMaterial(key),
        queryFn: () => fetchByMaterial(filters),
        enabled,
        staleTime: STALE_MS,
        refetchOnWindowFocus: false,
      },
    ],
  });

  return {
    products: productQ.data ?? [],
    materials: materialQ.data ?? [],
    isLoading:
      productQ.isLoading ||
      productQ.isFetching ||
      materialQ.isLoading ||
      materialQ.isFetching,
    isError: productQ.isError || materialQ.isError,
    error: productQ.error ?? materialQ.error,
    refetch: () => {
      void productQ.refetch();
      void materialQ.refetch();
    },
  };
}

export function useFeedbackCustomerStatsDetail(
  customerId: string | null,
  filters: FeedbackAnalyticsFilters,
  enabled: boolean,
) {
  const key = feedbackAnalyticsFilterKey(filters);
  return useQuery({
    queryKey: qk.customerFeedbacks.analyticsCustomerDetail(customerId ?? "", key),
    queryFn: () => fetchCustomerDetail(customerId!, filters),
    enabled: enabled && Boolean(customerId),
    staleTime: STALE_MS,
    refetchOnWindowFocus: false,
  });
}
