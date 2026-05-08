import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiSuccess } from "@/lib/api-types";
import { qk } from "@/lib/query-keys";

export type ContractPayload = {
  customerId: string;
  title: string;
  value: number;
  products?: number;
  startDate: string;
  endDate: string;
  warrantyEnd?: string;
  status?: "draft" | "active" | "completed" | "late" | "liquidated";
  progress?: number;
  terms?: string | null;
};

export function useContractsList() {
  return useQuery({
    queryKey: qk.contracts.all,
    queryFn: async () => {
      const res = await api.get<ApiSuccess<unknown[]>>("/api/v1/contracts");
      return res.data.data ?? [];
    },
  });
}

export function useContractDetail(id: string | null | undefined) {
  return useQuery({
    queryKey: id ? [...qk.contracts.all, "detail", id] : ["contracts", "detail", "noop"],
    enabled: !!id,
    queryFn: async () => {
      const res = await api.get<ApiSuccess<Record<string, unknown>>>(`/api/v1/contracts/${id}`);
      return res.data.data ?? null;
    },
  });
}

export function useCreateContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ContractPayload) => api.post("/api/v1/contracts", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.contracts.all }),
  });
}

export function useUpdateContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<ContractPayload> }) =>
      api.put(`/api/v1/contracts/${id}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.contracts.all }),
  });
}

export function useDeleteContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/api/v1/contracts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.contracts.all }),
  });
}

export type SetContractProductItem = {
  productId: string;
  quantity: number;
  specValues?: Record<string, string>;
};

export function useSetContractProducts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, products }: { id: string; products: SetContractProductItem[] }) =>
      api.put(`/api/v1/contracts/${id}/products`, { products }),
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: qk.contracts.all });
      void qc.invalidateQueries({ queryKey: [...qk.contracts.all, "detail", id] });
      void qc.invalidateQueries({ queryKey: qk.products.all });
    },
  });
}

export function useUpdateContractProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      contractId,
      productId,
      payload,
    }: {
      contractId: string;
      productId: string;
      payload: { specValues?: Record<string, string>; quantity?: number };
    }) => api.put(`/api/v1/contracts/${contractId}/products/${productId}`, payload),
    onSuccess: (_, { contractId }) => {
      void qc.invalidateQueries({ queryKey: qk.contracts.all });
      void qc.invalidateQueries({ queryKey: [...qk.contracts.all, "detail", contractId] });
    },
  });
}
