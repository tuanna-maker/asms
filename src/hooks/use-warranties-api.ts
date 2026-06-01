import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiSuccess } from "@/lib/api-types";
import type { WorkflowInstanceListSnapshot } from "./use-workflows-api";
import { qk } from "@/lib/query-keys";

export type WarrantyPayload = {
  contractId?: string | null;
  customerId: string;
  productId?: string | null;
  materialIds?: string[];
  assigneeId?: string;
  issue: string;
  type: "warranty" | "repair" | "maintenance";
  priorityCode?: string;
  source?: string;
  statusCode?: string;
  workflowStep?: number;
  /** Quy trình áp dụng khi tạo phiếu */
  workflowId?: string;
  slaHours?: number;
  resolvedAt?: string;
  receiptCategory?: "incident" | "technical_support" | null;
  occurredAt?: string | null;
  productSerialSnapshot?: string | null;
  rootCause?: "manufacturer" | "customer" | "unknown" | null;
  handlingPlan?: string | null;
  plannedHours?: number | null;
  costEstimate?: number | string | null;
  customerDisagreedClose?: boolean;
  executionMode?: "self" | "outsource" | null;
  outsourcePartner?: string | null;
  outsourceBudget?: number | string | null;
  outsourceTimeline?: string | null;
  repairDetails?: string | null;
  postRepairAssessment?: string | null;
  handoverNotes?: string | null;
  stepPayloads?: Record<string, Record<string, unknown>>;
  pruneOrphanStepPayloads?: boolean;
};

export type WarrantyDocumentRow = {
  id: string;
  code: string;
  name: string;
  categoryCode: string;
  fileType: string;
  fileUrl: string | null;
  uploadedAt: string;
};

export type WarrantyListRow = {
  id: string;
  code: string;
  issue: string;
  source: string | null;
  type: "warranty" | "repair" | "maintenance";
  priority: "low" | "medium" | "high" | "urgent";
  priorityCode: string;
  workflowStep: number;
  workflowInstanceId?: string | null;
  workflow?: WorkflowInstanceListSnapshot | null;
  status: "open" | "processing" | "completed" | "cancelled";
  statusCode: string;
  slaHours: number | null;
  createdAt: string;
  receiptCategory: "incident" | "technical_support" | null;
  occurredAt: string | null;
  productSerialSnapshot: string | null;
  rootCause: "manufacturer" | "customer" | "unknown" | null;
  handlingPlan: string | null;
  plannedHours: number | null;
  costEstimate: unknown;
  customerDisagreedClose: boolean;
  executionMode: "self" | "outsource" | null;
  outsourcePartner: string | null;
  outsourceBudget: unknown;
  outsourceTimeline: string | null;
  repairDetails: string | null;
  postRepairAssessment: string | null;
  handoverNotes: string | null;
  materialIds?: string[];
  customer: { id: string; code: string; name: string } | null;
  product: { id: string; code: string; name: string } | null;
  assignee: { id: string; fullName: string; role: { code: string } | null } | null;
};

export type WarrantyDetail = Omit<WarrantyListRow, "customer" | "product" | "assignee"> & {
  contractId: string | null;
  customerId: string;
  productId: string | null;
  materialIds: string[];
  assigneeId: string | null;
  updatedAt: string;
  workflowInstanceId: string | null;
  customer: { id: string; code: string; name: string; phone: string | null; email: string | null };
  product: { id: string; code: string; name: string } | null;
  contract: unknown;
  assignee: { id: string; fullName: string; role: { code: string } | null } | null;
  documents: WarrantyDocumentRow[];
  stepPayloads?: Record<string, Record<string, unknown>>;
  orphanStepPayloads?: Array<{ workflowStepId: string; payload: Record<string, unknown> }>;
};

export function useWarrantiesList() {
  return useQuery({
    queryKey: qk.warranties.all,
    queryFn: async () => {
      const res = await api.get<ApiSuccess<WarrantyListRow[]>>("/api/v1/warranties");
      return res.data.data ?? [];
    },
  });
}

export function useWarrantyDetail(id: string | null, enabled: boolean) {
  return useQuery({
    queryKey: qk.warranties.detail(id ?? ""),
    queryFn: async () => {
      const res = await api.get<ApiSuccess<WarrantyDetail>>(`/api/v1/warranties/${id}`);
      return res.data.data;
    },
    enabled: Boolean(enabled && id),
  });
}

export function useCreateWarranty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: WarrantyPayload) => api.post("/api/v1/warranties", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.warranties.all }),
  });
}

export function useUpdateWarranty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<WarrantyPayload> }) =>
      api.put(`/api/v1/warranties/${id}`, payload),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: qk.warranties.all });
      void qc.invalidateQueries({ queryKey: qk.warranties.detail(variables.id) });
    },
  });
}

export function useDeleteWarranty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/api/v1/warranties/${id}`),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: qk.warranties.all });
      void qc.invalidateQueries({ queryKey: qk.warranties.detail(id) });
    },
  });
}
