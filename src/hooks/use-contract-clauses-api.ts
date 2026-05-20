import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiSuccess } from "@/lib/api-types";
import { qk } from "@/lib/query-keys";

export type ContractClausePersonRef = { id: string; fullName: string } | null;

export type ContractClauseItem = {
  id: string;
  code: string;
  title: string;
  content: string;
  sortOrder: number;
  isActive: boolean;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: ContractClausePersonRef;
  updatedBy: ContractClausePersonRef;
};

export type ContractClauseGroupMember = {
  clauseId: string;
  sortOrder: number;
  clause: Pick<ContractClauseItem, "id" | "code" | "title" | "content" | "isActive" | "sortOrder">;
};

export type ContractClauseGroupItem = {
  id: string;
  code: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: ContractClausePersonRef;
  updatedBy: ContractClausePersonRef;
  members: ContractClauseGroupMember[];
};

export function useContractClausesList(opts?: { includeInactive?: boolean; enabled?: boolean }) {
  const includeInactive = Boolean(opts?.includeInactive);
  const scope = includeInactive ? "all" : "active";
  return useQuery({
    queryKey: qk.contractClauses.list(scope),
    enabled: opts?.enabled !== false,
    queryFn: async () => {
      const params = includeInactive ? "?includeInactive=1" : "";
      const res = await api.get<ApiSuccess<ContractClauseItem[]>>(
        `/api/v1/contract-clauses${params}`,
      );
      return res.data.data ?? [];
    },
  });
}

export function useContractClauseGroupsList(opts?: { includeInactive?: boolean; enabled?: boolean }) {
  const includeInactive = Boolean(opts?.includeInactive);
  const scope = includeInactive ? "all" : "active";
  return useQuery({
    queryKey: qk.contractClauses.groups(scope),
    enabled: opts?.enabled !== false,
    queryFn: async () => {
      const params = includeInactive ? "?includeInactive=1" : "";
      const res = await api.get<ApiSuccess<ContractClauseGroupItem[]>>(
        `/api/v1/contract-clause-groups${params}`,
      );
      return res.data.data ?? [];
    },
  });
}

export function useContractClauseUsage(id: string | null, opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: qk.contractClauses.usage(id ?? ""),
    enabled: Boolean(id) && opts?.enabled !== false,
    queryFn: async () => {
      const res = await api.get<ApiSuccess<{ count: number; entities: string[] }>>(
        `/api/v1/contract-clauses/${encodeURIComponent(id as string)}/usage`,
      );
      return res.data.data;
    },
  });
}

export function useCreateContractClause() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      code: string;
      title: string;
      content: string;
      sortOrder?: number;
      isActive?: boolean;
    }) => api.post<ApiSuccess<ContractClauseItem>>("/api/v1/contract-clauses", payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.contractClauses.all }),
  });
}

export function useUpdateContractClause() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<{
        code: string;
        title: string;
        content: string;
        sortOrder: number;
        isActive: boolean;
      }>;
    }) =>
      api.put<ApiSuccess<ContractClauseItem>>(
        `/api/v1/contract-clauses/${encodeURIComponent(id)}`,
        payload,
      ),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.contractClauses.all }),
  });
}

export function useDeleteContractClause() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      api.delete<ApiSuccess<{ id: string }>>(`/api/v1/contract-clauses/${encodeURIComponent(id)}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.contractClauses.all }),
  });
}

export function useCreateContractClauseGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      code: string;
      label: string;
      sortOrder?: number;
      isActive?: boolean;
    }) => api.post<ApiSuccess<ContractClauseGroupItem>>("/api/v1/contract-clause-groups", payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.contractClauses.all }),
  });
}

export function useUpdateContractClauseGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<{ code: string; label: string; sortOrder: number; isActive: boolean }>;
    }) =>
      api.put<ApiSuccess<ContractClauseGroupItem>>(
        `/api/v1/contract-clause-groups/${encodeURIComponent(id)}`,
        payload,
      ),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.contractClauses.all }),
  });
}

export function useDeleteContractClauseGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      api.delete<ApiSuccess<{ id: string }>>(
        `/api/v1/contract-clause-groups/${encodeURIComponent(id)}`,
      ),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.contractClauses.all }),
  });
}

export function useSetContractClauseGroupMembers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, clauseIds }: { groupId: string; clauseIds: string[] }) =>
      api.put<ApiSuccess<ContractClauseGroupItem>>(
        `/api/v1/contract-clause-groups/${encodeURIComponent(groupId)}/members`,
        { clauseIds },
      ),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.contractClauses.all }),
  });
}
