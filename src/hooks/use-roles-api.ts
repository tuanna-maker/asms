import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { ApiSuccess } from "@/lib/api-types";
import { qk } from "@/lib/query-keys";

export type RoleItem = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userCount: number;
};

export type CreateRolePayload = {
  code: string;
  name: string;
  description?: string | null;
  isActive?: boolean;
};

export type UpdateRolePayload = Partial<CreateRolePayload>;

export function useRolesList(enabled = true) {
  return useQuery({
    queryKey: qk.roles.all,
    enabled,
    queryFn: async () => {
      const res = await api.get<ApiSuccess<RoleItem[]>>("/api/v1/roles", {
        params: { includeInactive: "1" },
      });
      return res.data.data ?? [];
    },
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateRolePayload) => api.post("/api/v1/roles", payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.roles.all });
    },
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateRolePayload }) =>
      api.put(`/api/v1/roles/${encodeURIComponent(id)}`, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.roles.all });
    },
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/api/v1/roles/${encodeURIComponent(id)}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.roles.all });
    },
  });
}
