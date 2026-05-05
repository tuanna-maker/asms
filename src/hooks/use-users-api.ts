import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiSuccess } from "@/lib/api-types";
import { qk } from "@/lib/query-keys";

export type UserListItem = {
  id: string;
  fullName: string;
  email: string;
  status: "active" | "inactive" | "suspended";
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  role: { code: string; name: string };
};

export type CreateUserPayload = {
  fullName: string;
  email: string;
  password: string;
  roleCode: "admin" | "manager" | "technician" | "viewer" | "sales";
  status?: "active" | "inactive" | "suspended";
};

export function useUsersList(enabled = true) {
  return useQuery({
    queryKey: qk.users.all,
    enabled,
    queryFn: async () => {
      const res = await api.get<ApiSuccess<UserListItem[]>>("/api/v1/users");
      return res.data.data ?? [];
    },
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateUserPayload) => api.post("/api/v1/users", payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.users.all });
    },
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<Omit<CreateUserPayload, "password">> & { password?: string };
    }) => api.put(`/api/v1/users/${encodeURIComponent(id)}`, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.users.all });
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/api/v1/users/${encodeURIComponent(id)}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.users.all });
    },
  });
}
