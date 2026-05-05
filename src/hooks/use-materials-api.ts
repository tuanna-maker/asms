import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiSuccess } from "@/lib/api-types";
import { qk } from "@/lib/query-keys";

export type MaterialPayload = {
  code: string;
  name: string;
  type: "identified" | "consumable";
  serial?: string | null;
  quantity: number;
  available?: number;
  unit: string;
  warehouse: string;
  description?: string;
};

export type MaterialListRow = {
  id: string;
  code: string;
  name: string;
  type: "identified" | "consumable";
  serial: string | null;
  quantity: number;
  available: number;
  unit: string;
  warehouse: string;
  description: string | null;
};

export type MaterialTransferListRow = {
  id: string;
  code: string;
  materialId: string;
  quantity: number;
  fromWarehouse: string;
  destination: string;
  type: "contract" | "warranty" | "repair";
  status: "pending" | "processing" | "completed";
  transferDate: string;
  material: {
    id: string;
    code: string;
    name: string;
    unit: string;
  };
};

export type CreateMaterialTransferPayload = {
  materialId: string;
  quantity: number;
  destination: string;
  type: "contract" | "warranty" | "repair";
  status?: "pending" | "processing" | "completed";
  transferDate?: string;
};

export function useMaterialsList() {
  return useQuery({
    queryKey: qk.materials.all,
    queryFn: async () => {
      const res = await api.get<ApiSuccess<MaterialListRow[]>>("/api/v1/materials");
      return res.data.data ?? [];
    },
  });
}

export function useMaterialTransfersList() {
  return useQuery({
    queryKey: qk.materials.transfers,
    queryFn: async () => {
      const res = await api.get<ApiSuccess<MaterialTransferListRow[]>>("/api/v1/materials/transfers");
      return res.data.data ?? [];
    },
  });
}

export function useCreateMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: MaterialPayload) => api.post("/api/v1/materials", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.materials.all }),
  });
}

export function useUpdateMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<MaterialPayload> }) =>
      api.put(`/api/v1/materials/${id}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.materials.all }),
  });
}

export function useDeleteMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/api/v1/materials/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.materials.all }),
  });
}

export function useCreateMaterialTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateMaterialTransferPayload) => api.post("/api/v1/materials/transfers", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.materials.all });
      qc.invalidateQueries({ queryKey: qk.materials.transfers });
    },
  });
}

export type MaterialTransferPatchPayload = {
  destination?: string;
  status?: "pending" | "processing" | "completed";
  type?: "contract" | "warranty" | "repair";
};

export function useUpdateMaterialTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: MaterialTransferPatchPayload }) =>
      api.put(`/api/v1/materials/transfers/${encodeURIComponent(id)}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.materials.all });
      qc.invalidateQueries({ queryKey: qk.materials.transfers });
    },
  });
}

export function useDeleteMaterialTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/api/v1/materials/transfers/${encodeURIComponent(id)}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.materials.all });
      qc.invalidateQueries({ queryKey: qk.materials.transfers });
    },
  });
}
