import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiSuccess } from "@/lib/api-types";
import { qk } from "@/lib/query-keys";

export type WarrantyPayload = {
  contractId?: string;
  customerId: string;
  productId?: string;
  assigneeId?: string;
  issue: string;
  type: "warranty" | "repair" | "maintenance";
  priority?: "low" | "medium" | "high" | "urgent";
  source?: string;
  status?: "open" | "processing" | "completed" | "cancelled";
  workflowStep?: number;
  slaHours?: number;
  resolvedAt?: string;
};

export type WarrantyListRow = {
  id: string;
  code: string;
  issue: string;
  source: string | null;
  type: "warranty" | "repair" | "maintenance";
  priority: "low" | "medium" | "high" | "urgent";
  workflowStep: number;
  status: "open" | "processing" | "completed" | "cancelled";
  slaHours: number | null;
  createdAt: string;
  customer: { id: string; code: string; name: string } | null;
  product: { id: string; code: string; name: string } | null;
  assignee: { id: string; fullName: string } | null;
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
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.warranties.all }),
  });
}

export function useDeleteWarranty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/api/v1/warranties/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.warranties.all }),
  });
}
