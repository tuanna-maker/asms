import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiSuccess } from "@/lib/api-types";

export type FeedbackExecutionUnit = {
  id: string;
  code: string;
  name: string;
  roleCodes: string[];
  notifyUserIds: string[];
  isActive: boolean;
  sortOrder: number;
  routingRules?: FeedbackRoutingRule[];
};

export type FeedbackRoutingRule = {
  id: string;
  unitId: string;
  productId: string | null;
  productCategory: string | null;
  priority: number;
  unit?: { id: string; code: string; name: string };
};

const qk = {
  all: ["feedback-execution-units"] as const,
  rules: ["feedback-routing-rules"] as const,
};

export function useFeedbackExecutionUnits() {
  return useQuery({
    queryKey: qk.all,
    queryFn: async () => {
      const res = await api.get<ApiSuccess<FeedbackExecutionUnit[]>>(
        "/api/v1/feedback-execution-units",
      );
      return res.data.data ?? [];
    },
  });
}

export function useCreateFeedbackUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<FeedbackExecutionUnit, "id" | "routingRules">) =>
      api.post("/api/v1/feedback-execution-units", payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.all }),
  });
}

export function useUpdateFeedbackUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<Omit<FeedbackExecutionUnit, "id" | "routingRules">>;
    }) => api.put(`/api/v1/feedback-execution-units/${id}`, payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.all }),
  });
}

export function useDeleteFeedbackUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/api/v1/feedback-execution-units/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.all }),
  });
}

export function useCreateRoutingRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      unitId: string;
      productId?: string | null;
      productCategory?: string | null;
      priority?: number;
    }) => api.post("/api/v1/feedback-execution-units/routing-rules", payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.all });
      void qc.invalidateQueries({ queryKey: qk.rules });
    },
  });
}

export function useDeleteRoutingRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ruleId: string) =>
      api.delete(`/api/v1/feedback-execution-units/routing-rules/${ruleId}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.all });
      void qc.invalidateQueries({ queryKey: qk.rules });
    },
  });
}

export function useRoutingPreview(productIds: string[], enabled: boolean) {
  return useQuery({
    queryKey: ["feedback-routing-preview", productIds.join(",")],
    enabled: enabled && productIds.length > 0,
    queryFn: async () => {
      const params = new URLSearchParams();
      productIds.forEach((id) => params.append("productIds", id));
      const res = await api.get<ApiSuccess<{ units: { id: string; code: string; name: string }[] }>>(
        `/api/v1/customer-feedbacks/routing-preview?${params}`,
      );
      return res.data.data?.units ?? [];
    },
  });
}
