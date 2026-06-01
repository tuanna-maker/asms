import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiSuccess } from "@/lib/api-types";
import { buildReportQuery, type ReportFilters } from "@/lib/report-filters";
import { qk } from "@/lib/query-keys";

export type ReportsApi = {
  contracts: { total: number; byStatus: Record<string, number> };
  handovers: { total: number };
  training_courses: { total: number };
  warranties: { total: number; byType?: Record<string, number> };
  products: { deliveredTotal: number };
  customers: { total: number };
  customer_breakdown?: Array<{ name: string; contracts: number; value: number }>;
  unit_performance?: Array<{
    unit: string;
    tasks: number;
    completed: number;
    onTime: number;
    satisfaction: number;
  }>;
  summary_delta?: {
    contractsPct: number;
    deliveredPct: number;
    warrantiesPct: number;
  };
  trends?: {
    monthly: Array<{
      month: string;
      contracts: number;
      complaints: number;
      handovers: number;
      production?: number;
      training?: number;
    }>;
  };
  meta?: { year: string | null; from: string | null; to: string | null };
  contracts_list?: Array<{
    id: string;
    code: string;
    title: string;
    status: string;
    value: number;
    progress: number;
    startDate: string;
    customerName: string;
  }>;
};

export type ProductLineReportItem = {
  category: string;
  produced: number;
  delivered: number;
  warrantyCount: number;
};

export type FeedbackByCustomerItem = {
  customerId: string;
  name: string;
  tickets: number;
  byType: Record<string, number>;
};

export type FeedbackByProductLineItem = {
  category: string;
  tickets: number;
  byType: Record<string, number>;
};

function filterKey(filters: ReportFilters) {
  return [filters.year, filters.from, filters.to, filters.customerId] as const;
}

export function useReports(filters: ReportFilters) {
  const [year, from, to] = filterKey(filters);
  return useQuery({
    queryKey: qk.reports.main(year, from, to),
    queryFn: async () => {
      const res = await api.get<ApiSuccess<ReportsApi>>(`/api/v1/reports${buildReportQuery(filters)}`);
      return res.data.data;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useReportsByYear(year: string) {
  return useReports({ year });
}

export type DashboardSummaryApi = {
  productProgress: {
    quantity: { producing: number; produced: number };
    inspection: { submitted: number; inspecting: number; passed: number };
    decisionApproved: number;
    equipped: number;
    equipDecided: number;
  };
  contractProgress: { total: number; active: number; completedOnTime: number; completedLate: number };
  complaintProgress: {
    total: number;
    warranty: number;
    repair: number;
    processing: number;
    completedOnTime: number;
    completedLate: number;
  };
  feedbackProgress: {
    total: number;
    new: number;
    assigned: number;
    inProgress: number;
    pendingClose: number;
    resolved: number;
    overdue: number;
  };
  handoverProgress: { total: number; active: number; completedOnTime: number; completedLate: number };
  trainingProgress: {
    totalBatches: number;
    active: number;
    completedOnTime: number;
    completedLate: number;
  };
  customerCare: {
    totalCustomers: number;
    customerBreakdown: Array<{
      id: string;
      name: string;
      revenue: number;
      expense: number;
      productsDelivered: number;
      complaints: { processing: number; onTime: number; late: number };
    }>;
    upcomingAnniversaries: Array<{
      customerId: string;
      customerName: string;
      type: string;
      label: string;
      occursAt: string;
      daysUntil: number;
    }>;
  };
  pakd: {
    materials: {
      total: number;
      valid: number;
      expired: number;
      items: Array<{
        name: string;
        warehouse: string;
        total: number;
        remaining: number;
        expiresAt: string | null;
      }>;
    };
    research: {
      total: number;
      valid: number;
      expired: number;
      items: Array<{
        id: string;
        code: string;
        name: string;
        budget: number;
        remaining: number;
        expiresAt: string;
      }>;
    };
    total: number;
    valid: number;
    expired: number;
    items: Array<{
      name: string;
      warehouse: string;
      total: number;
      remaining: number;
      expiresAt: string | null;
    }>;
  };
  meta?: { year: string | null; from: string | null; to: string | null; customerId?: string | null };
};

export function useDashboardSummary(filters: ReportFilters) {
  const [year, from, to, customerId] = filterKey(filters);
  return useQuery({
    queryKey: qk.reports.dashboardSummary(year, from, to, customerId),
    queryFn: async () => {
      const res = await api.get<ApiSuccess<DashboardSummaryApi>>(
        `/api/v1/reports/dashboard-summary${buildReportQuery(filters)}`,
      );
      return res.data.data;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useDashboardSummaryByYear(year: string) {
  return useDashboardSummary({ year });
}

export function useDashboardSummaryWithFilters(filters: ReportFilters) {
  return useDashboardSummary(filters);
}

export function useReportsByProductLine(filters: ReportFilters) {
  const [year, from, to] = filterKey(filters);
  return useQuery({
    queryKey: qk.reports.productLine(year, from, to),
    queryFn: async () => {
      const res = await api.get<ApiSuccess<{ items: ProductLineReportItem[] }>>(
        `/api/v1/reports/by-product-line${buildReportQuery(filters)}`,
      );
      return res.data.data?.items ?? [];
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useReportsFeedbackByCustomer(filters: ReportFilters) {
  const [year, from, to] = filterKey(filters);
  return useQuery({
    queryKey: qk.reports.feedbackCustomer(year, from, to),
    queryFn: async () => {
      const res = await api.get<ApiSuccess<{ items: FeedbackByCustomerItem[] }>>(
        `/api/v1/reports/feedback/by-customer${buildReportQuery(filters)}`,
      );
      return res.data.data?.items ?? [];
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useReportsFeedbackByProductLine(filters: ReportFilters) {
  const [year, from, to] = filterKey(filters);
  return useQuery({
    queryKey: qk.reports.feedbackProductLine(year, from, to),
    queryFn: async () => {
      const res = await api.get<ApiSuccess<{ items: FeedbackByProductLineItem[] }>>(
        `/api/v1/reports/feedback/by-product-line${buildReportQuery(filters)}`,
      );
      return res.data.data?.items ?? [];
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
