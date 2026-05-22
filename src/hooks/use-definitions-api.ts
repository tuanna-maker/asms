import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiSuccess } from "@/lib/api-types";
import { qk } from "@/lib/query-keys";

export type DefinitionPersonRef = { id: string; fullName: string } | null;

export type DefinitionItem = {
  id: string;
  category: string;
  code: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
  isSystem: boolean;
  slaHours?: number | null;
  createdAt: string;
  updatedAt: string;
  createdBy: DefinitionPersonRef;
  updatedBy: DefinitionPersonRef;
};

export type CreateDefinitionPayload = {
  category: string;
  code: string;
  label: string;
  sortOrder?: number;
  isActive?: boolean;
  slaHours?: number | null;
};

export type UpdateDefinitionPayload = Partial<
  Pick<CreateDefinitionPayload, "code" | "label" | "sortOrder" | "isActive"> & { slaHours?: number | null }
>;

export type DefinitionUsage = {
  id: string;
  category: string;
  code: string;
  label: string;
  isSystem: boolean;
  count: number;
  breakdown: Array<{ entity: string; count: number }>;
};

export function useDefinitionsList(
  category: string,
  opts?: { includeInactive?: boolean; enabled?: boolean }
) {
  const includeInactive = Boolean(opts?.includeInactive);
  const scope = includeInactive ? "all" : "active";
  return useQuery({
    queryKey: qk.definitions.list(category, scope),
    enabled: (opts?.enabled !== false) && category.trim().length > 0,
    queryFn: async () => {
      const params = new URLSearchParams({ category: category.trim() });
      if (includeInactive) params.set("includeInactive", "1");
      const res = await api.get<ApiSuccess<DefinitionItem[]>>(`/api/v1/definitions?${params.toString()}`);
      return res.data.data ?? [];
    },
  });
}

export function useDefinitionUsage(id: string | null, opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: qk.definitions.usage(id ?? ""),
    enabled: Boolean(id) && (opts?.enabled !== false),
    queryFn: async () => {
      const res = await api.get<ApiSuccess<DefinitionUsage>>(
        `/api/v1/definitions/${encodeURIComponent(id as string)}/usage`,
      );
      return res.data.data;
    },
  });
}

export function useCreateDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateDefinitionPayload) =>
      api.post<ApiSuccess<DefinitionItem>>("/api/v1/definitions", payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.definitions.all });
    },
  });
}

export function useUpdateDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateDefinitionPayload }) =>
      api.put<ApiSuccess<DefinitionItem>>(`/api/v1/definitions/${encodeURIComponent(id)}`, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.definitions.all });
    },
  });
}

export function useDeleteDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      api.delete<ApiSuccess<{ id: string }>>(`/api/v1/definitions/${encodeURIComponent(id)}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.definitions.all });
    },
  });
}

export type ReorderDefinitionsPayload = {
  category: string;
  items: Array<{ id: string; sortOrder: number }>;
};

export function useReorderDefinitions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ReorderDefinitionsPayload) =>
      api.put<ApiSuccess<{ count: number }>>("/api/v1/definitions/reorder", payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.definitions.all });
    },
  });
}
