import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiSuccess } from "@/lib/api-types";
import { qk } from "@/lib/query-keys";

export type ProductListItem = {
  id: string;
  code: string;
  name: string;
  category: string;
  status: "developing" | "producing" | "equipped" | "stopped";
  version: string | null;
  description: string | null;
  manufacturer: string | null;
  unit: string | null;
  yearReleased: number | null;
  totalProduced: number;
  customerId: string | null;
  contractId: string | null;
};

export type CreateProductPayload = {
  code: string;
  name: string;
  category: string;
  status?: "developing" | "producing" | "equipped" | "stopped";
  version?: string;
  description?: string;
  customerId?: string;
  contractId?: string;
  manufacturer?: string;
  unit?: string;
  yearReleased?: number;
  totalProduced?: number;
};

export type UpdateProductPayload = Partial<CreateProductPayload>;

export function useProductsList(enabled = true) {
  return useQuery({
    queryKey: qk.products.all,
    enabled,
    queryFn: async () => {
      const res = await api.get<ApiSuccess<ProductListItem[]>>("/api/v1/products");
      return res.data.data ?? [];
    },
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateProductPayload) => api.post("/api/v1/products", payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.products.all });
    },
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateProductPayload }) =>
      api.put(`/api/v1/products/${encodeURIComponent(id)}`, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.products.all });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/api/v1/products/${encodeURIComponent(id)}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.products.all });
    },
  });
}
