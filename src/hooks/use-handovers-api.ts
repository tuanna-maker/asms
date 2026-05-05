import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiSuccess } from "@/lib/api-types";
import { qk } from "@/lib/query-keys";

export type HandoverListItem = {
  id: string;
  code: string;
  contractId: string;
  customerId: string;
  products: number;
  currentStep: number;
  status: "pending" | "active" | "completed" | "late";
  startDate: string;
  dueDate: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  contract: { id: string; code: string; title: string | null };
  customer: { id: string; code: string; name: string };
  createdBy: { id: string; fullName: string | null } | null;
};

export type CreateHandoverPayload = {
  contractId: string;
  products: number;
  currentStep?: number;
  status?: "pending" | "active" | "completed" | "late";
  dueDate?: string;
  startDate?: string;
};

export function useHandoversList() {
  return useQuery({
    queryKey: qk.handovers.all,
    queryFn: async () => {
      const res = await api.get<ApiSuccess<HandoverListItem[]>>("/api/v1/handovers");
      return res.data.data ?? [];
    },
  });
}

export function useCreateHandover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateHandoverPayload) => api.post("/api/v1/handovers", payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.handovers.all });
    },
  });
}

export function useUpdateHandover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<CreateHandoverPayload> & { completedAt?: string | null };
    }) => api.put(`/api/v1/handovers/${id}`, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.handovers.all });
    },
  });
}

export function useDeleteHandover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/api/v1/handovers/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.handovers.all });
    },
  });
}
