import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiSuccess } from "@/lib/api-types";
import { qk } from "@/lib/query-keys";
import type { CrudPermission, PermissionModuleNode } from "@/lib/permission-types";

export type RolePermissionsMatrix = {
  modules: PermissionModuleNode[];
  roles: Array<{
    code: string;
    name: string;
    permissions: Record<string, CrudPermission>;
  }>;
};

export type RolePermissionUpdateItem = {
  roleCode: string;
  moduleKey: string;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

export function crudToUpdateItem(
  roleCode: string,
  moduleKey: string,
  crud: CrudPermission,
): RolePermissionUpdateItem {
  return {
    roleCode,
    moduleKey,
    canRead: crud.read,
    canCreate: crud.create,
    canUpdate: crud.update,
    canDelete: crud.delete,
  };
}

export function useRolePermissions(enabled = true) {
  return useQuery({
    queryKey: qk.rolePermissions.all,
    enabled,
    queryFn: async () => {
      const res = await api.get<ApiSuccess<RolePermissionsMatrix>>("/api/v1/role-permissions");
      return res.data.data ?? { modules: [], roles: [] };
    },
    staleTime: 60_000,
  });
}

export function useUpdateRolePermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: RolePermissionUpdateItem[]) =>
      api.put("/api/v1/role-permissions", { items }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.rolePermissions.all });
    },
  });
}
