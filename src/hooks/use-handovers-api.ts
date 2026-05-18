import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiSuccess } from "@/lib/api-types";
import type { HandoverStepPayloadRecord } from "@/lib/handover-step-payload";
import type { WorkflowInstanceListSnapshot } from "./use-workflows-api";
import { qk } from "@/lib/query-keys";

export type HandoverListItem = {
  id: string;
  code: string;
  contractId: string;
  customerId: string;
  products: number;
  currentStep: number;
  status: "pending" | "active" | "completed" | "late";
  typeCode: string | null;
  workflowInstanceId?: string | null;
  workflow?: WorkflowInstanceListSnapshot | null;
  startDate: string;
  dueDate: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  contract: { id: string; code: string; title: string | null };
  customer: { id: string; code: string; name: string };
  createdBy: { id: string; fullName: string | null } | null;
};

export type HandoverDetail = HandoverListItem & {
  handoverPlan?: string | null;
  costReportNote?: string | null;
  goodsCheckNote?: string | null;
  trainingPlanNote?: string | null;
  trainingCostReport?: string | null;
  tempHandoverNote?: string | null;
  trainingReportNote?: string | null;
  trainingDecision?: string | null;
  finalHandoverNote?: string | null;
  stepPayloads?: HandoverStepPayloadRecord;
  orphanStepPayloads?: Array<{ workflowStepId: string; payload: Record<string, unknown> }>;
};

export type CreateHandoverPayload = {
  contractId: string;
  products?: number;
  currentStep?: number;
  status?: "pending" | "active" | "completed" | "late";
  typeCode?: string;
  dueDate?: string;
  startDate?: string;
  workflowId?: string;
  handoverPlan?: string | null;
  costReportNote?: string | null;
  goodsCheckNote?: string | null;
  trainingPlanNote?: string | null;
  trainingCostReport?: string | null;
  tempHandoverNote?: string | null;
  trainingReportNote?: string | null;
  trainingDecision?: string | null;
  finalHandoverNote?: string | null;
  stepPayloads?: HandoverStepPayloadRecord;
};

export type UpdateHandoverPayload = Partial<CreateHandoverPayload> & {
  completedAt?: string | null;
  pruneOrphanStepPayloads?: boolean;
};

export type HandoverListFilters = {
  status?: HandoverListItem["status"];
  contractId?: string;
  customerId?: string;
  search?: string;
  workflowCode?: string;
};

export function useHandoversList(filters?: HandoverListFilters) {
  return useQuery({
    queryKey: [...qk.handovers.all, filters ?? {}],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.set("status", filters.status);
      if (filters?.contractId) params.set("contractId", filters.contractId);
      if (filters?.customerId) params.set("customerId", filters.customerId);
      if (filters?.search) params.set("search", filters.search);
      if (filters?.workflowCode) params.set("workflowCode", filters.workflowCode);
      const qs = params.toString();
      const res = await api.get<ApiSuccess<HandoverListItem[]>>(
        `/api/v1/handovers${qs ? `?${qs}` : ""}`,
      );
      return res.data.data ?? [];
    },
  });
}

export function useHandoverDetail(id: string | null | undefined, opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: qk.handovers.detail(id ?? ""),
    enabled: Boolean(id) && opts?.enabled !== false,
    queryFn: async () => {
      const res = await api.get<ApiSuccess<HandoverDetail>>(`/api/v1/handovers/${encodeURIComponent(id as string)}`);
      return res.data.data;
    },
  });
}

export function useCreateHandover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateHandoverPayload) => {
      const res = await api.post<ApiSuccess<HandoverDetail>>("/api/v1/handovers", payload);
      return res.data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.handovers.all });
    },
  });
}

export function useUpdateHandover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateHandoverPayload }) => {
      const res = await api.put<ApiSuccess<HandoverDetail>>(`/api/v1/handovers/${encodeURIComponent(id)}`, payload);
      return res.data.data;
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: qk.handovers.all });
      void qc.invalidateQueries({ queryKey: qk.handovers.detail(vars.id) });
    },
  });
}

export function useDeleteHandover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/api/v1/handovers/${encodeURIComponent(id)}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.handovers.all });
    },
  });
}
