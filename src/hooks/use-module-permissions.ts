import { useMemo } from "react";
import { useRole } from "@/hooks/use-role";

export type ModulePermissions = {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

export function useModulePermissions(moduleKey: string): ModulePermissions {
  const { canDo } = useRole();
  return useMemo(
    () => ({
      canRead: canDo(moduleKey, "read"),
      canCreate: canDo(moduleKey, "create"),
      canUpdate: canDo(moduleKey, "update"),
      canDelete: canDo(moduleKey, "delete"),
    }),
    [canDo, moduleKey],
  );
}

/** Ưu tiên child key; fallback parent cho read. */
export function useChildModulePermissions(parentKey: string, childKey: string): ModulePermissions {
  const { canDo } = useRole();
  return useMemo(
    () => ({
      canRead: canDo(childKey, "read") || canDo(parentKey, "read"),
      canCreate: canDo(childKey, "create"),
      canUpdate: canDo(childKey, "update"),
      canDelete: canDo(childKey, "delete"),
    }),
    [canDo, parentKey, childKey],
  );
}

export function useCanWriteModule(moduleKey: string): boolean {
  const { canCreate, canUpdate } = useModulePermissions(moduleKey);
  return canCreate || canUpdate;
}
