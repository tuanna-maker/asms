import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiSuccess } from "@/lib/api-types";
import type { WorkflowInstanceListSnapshot } from "@/hooks/use-workflows-api";
import { qk } from "@/lib/query-keys";

export type ProductSpec = {
  key: string;
  label: string;
  unit?: string;
};

export type ProductListItem = {
  id: string;
  code: string;
  name: string;
  category: string;
  status:
    | "developing"
    | "producing"
    | "produced"
    | "inspection_submitted"
    | "inspecting"
    | "inspection_passed"
    | "decision_approved"
    | "equip_decided"
    | "equipped"
    | "stopped";
  version: string | null;
  description: string | null;
  manufacturer: string | null;
  unit: string | null;
  yearReleased: number | null;
  totalProduced: number;
  customerId: string | null;
  specs?: ProductSpec[];
  bom?: Array<{
    /** UUID vật tư trong DB — dùng khi gửi materialIds (phiếu BH/SC, bàn giao) */
    materialDbId?: string;
    materialId: string;
    materialName: string;
    quantity: number;
    unit: string;
    serialNumbers?: string[];
    createdAt?: string;
    updatedAt?: string;
  }>;
  workflow?: WorkflowInstanceListSnapshot | null;
};

export type CreateProductPayload = {
  code: string;
  name: string;
  category: string;
  status?: ProductListItem["status"];
  version?: string;
  description?: string;
  customerId?: string;
  manufacturer?: string;
  unit?: string;
  yearReleased?: number;
  totalProduced?: number;
  specs?: ProductSpec[];
};

export type UpdateProductPayload = Partial<CreateProductPayload> & {
  stepPayloads?: Record<string, Record<string, unknown>>;
};

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

export function useProductDetail(id: string | null | undefined, enabled: boolean) {
  return useQuery({
    queryKey: qk.products.detail(id ?? ""),
    enabled: Boolean(enabled && id),
    staleTime: 30_000,
    queryFn: async () => {
      const res = await api.get<ApiSuccess<ProductListItem>>(`/api/v1/products/${encodeURIComponent(id as string)}`);
      return res.data.data ?? null;
    },
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateProductPayload) => api.post("/api/v1/products", payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.products.all });
      void qc.invalidateQueries({ queryKey: qk.contracts.all });
      void qc.invalidateQueries({ queryKey: qk.handovers.all });
      void qc.invalidateQueries({ queryKey: ["trainingCourses"] });
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
      void qc.invalidateQueries({ queryKey: qk.contracts.all });
      void qc.invalidateQueries({ queryKey: qk.handovers.all });
      void qc.invalidateQueries({ queryKey: ["trainingCourses"] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/api/v1/products/${encodeURIComponent(id)}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.products.all });
      void qc.invalidateQueries({ queryKey: qk.contracts.all });
      void qc.invalidateQueries({ queryKey: qk.handovers.all });
      void qc.invalidateQueries({ queryKey: ["trainingCourses"] });
    },
  });
}

export type UpsertProductBomPayload = {
  materialId: string;
  quantity: number;
  serialNumbers?: string[];
};

export function useUpsertProductBom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpsertProductBomPayload }) =>
      api.post(`/api/v1/products/${encodeURIComponent(id)}/bom`, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.products.all });
    },
  });
}

export function useUpdateProductBom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      materialId,
      payload,
    }: {
      id: string;
      materialId: string;
      payload: { quantity?: number; serialNumbers?: string[] };
    }) =>
      api.put(`/api/v1/products/${encodeURIComponent(id)}/bom/${encodeURIComponent(materialId)}`, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.products.all });
    },
  });
}

export function useDeleteProductBom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, materialId }: { id: string; materialId: string }) =>
      api.delete(`/api/v1/products/${encodeURIComponent(id)}/bom/${encodeURIComponent(materialId)}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.products.all });
    },
  });
}
