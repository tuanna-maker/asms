import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiSuccess } from "@/lib/api-types";
import { qk } from "@/lib/query-keys";

export type CustomerFeedbackSeverity = "low" | "medium" | "high";
export type CustomerFeedbackStatus = "new" | "processing" | "resolved";

export type CustomerFeedbackRow = {
  id: string;
  customerId: string;
  contractId: string | null;
  warrantyId: string | null;
  title: string;
  content: string;
  severity: CustomerFeedbackSeverity;
  status: CustomerFeedbackStatus;
  feedbackAt: string;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  customer: { id: string; code: string; name: string };
  contract: { id: string; code: string; title: string } | null;
  warranty: { id: string; code: string; issue: string } | null;
  createdBy: { id: string; fullName: string } | null;
};

export type CustomerFeedbackPayload = {
  customerId: string;
  contractId?: string | null;
  warrantyId?: string | null;
  title: string;
  content: string;
  severity: CustomerFeedbackSeverity;
  status: CustomerFeedbackStatus;
  feedbackAt: string;
};

export type CustomerFeedbackListFilters = {
  customerId?: string;
  contractId?: string;
  warrantyId?: string;
  severity?: CustomerFeedbackSeverity;
  status?: CustomerFeedbackStatus;
  search?: string;
  feedbackFrom?: string;
  feedbackTo?: string;
};

function buildListQuery(filters?: CustomerFeedbackListFilters): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  if (filters.customerId) params.set("customerId", filters.customerId);
  if (filters.contractId) params.set("contractId", filters.contractId);
  if (filters.warrantyId) params.set("warrantyId", filters.warrantyId);
  if (filters.severity) params.set("severity", filters.severity);
  if (filters.status) params.set("status", filters.status);
  if (filters.search?.trim()) params.set("search", filters.search.trim());
  if (filters.feedbackFrom) params.set("feedbackFrom", filters.feedbackFrom);
  if (filters.feedbackTo) params.set("feedbackTo", filters.feedbackTo);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function listKey(filters?: CustomerFeedbackListFilters): string {
  return JSON.stringify(filters ?? {});
}

function hasContextFilter(filters?: CustomerFeedbackListFilters): boolean {
  return Boolean(filters?.customerId || filters?.contractId || filters?.warrantyId);
}

export function useCustomerFeedbacksList(filters?: CustomerFeedbackListFilters, enabled = true) {
  return useQuery({
    queryKey: qk.customerFeedbacks.list(listKey(filters)),
    enabled: enabled && hasContextFilter(filters),
    queryFn: async () => {
      const res = await api.get<ApiSuccess<CustomerFeedbackRow[]>>(
        `/api/v1/customer-feedbacks${buildListQuery(filters)}`,
      );
      return res.data.data ?? [];
    },
  });
}

/** Danh sách toàn hệ thống (màn /phan-anh) — không yêu cầu customerId/contractId/warrantyId. */
export function useAllCustomerFeedbacksList(
  filters?: CustomerFeedbackListFilters,
  enabled = true,
) {
  return useQuery({
    queryKey: [...qk.customerFeedbacks.all, "all-list", listKey(filters)],
    enabled,
    queryFn: async () => {
      const res = await api.get<ApiSuccess<CustomerFeedbackRow[]>>(
        `/api/v1/customer-feedbacks${buildListQuery(filters)}`,
      );
      return res.data.data ?? [];
    },
  });
}

export function useCreateCustomerFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CustomerFeedbackPayload) =>
      api.post("/api/v1/customer-feedbacks", payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.customerFeedbacks.all });
    },
  });
}

export function useUpdateCustomerFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<CustomerFeedbackPayload> }) =>
      api.put(`/api/v1/customer-feedbacks/${id}`, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.customerFeedbacks.all });
    },
  });
}

export function useDeleteCustomerFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/api/v1/customer-feedbacks/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.customerFeedbacks.all });
    },
  });
}
