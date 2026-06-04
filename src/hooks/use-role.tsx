import { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRolePermissions } from "@/hooks/use-role-permissions-api";
import {
  moduleAllowedForRoleFromMap,
  moduleActionAllowedFromMap,
  resolveModuleKeyFromPath,
} from "@/lib/route-module-map";
import { isAppRouteHidden } from "@/lib/nav-visibility";
import type { CrudPermission } from "@/lib/permission-types";

export type Role = "admin" | "manager" | "technician" | "viewer" | "sales";

export type CrudAction = keyof CrudPermission;

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Quản trị",
  manager: "Quản lý",
  technician: "Kỹ thuật viên",
  viewer: "Xem",
  sales: "Nhân viên bán hàng",
};

// Quyền truy cập theo path (fallback khi chưa có API)
export const ROUTE_PERMISSIONS: Record<string, Role[]> = {
  "/": ["admin", "manager", "technician", "viewer", "sales"],
  "/hop-dong": ["admin", "manager", "viewer", "sales"],
  "/ban-giao": ["admin", "manager", "technician"],
  "/bao-hanh": ["admin", "manager", "technician"],
  "/san-pham": ["admin", "manager", "technician", "viewer", "sales"],
  "/vat-tu": ["admin", "manager", "technician"],
  "/khach-hang": ["admin", "manager", "viewer", "sales"],
  "/phan-anh": ["admin", "manager", "technician", "viewer", "sales"],
  "/bao-cao": ["admin", "manager", "viewer", "sales"],
  "/de-tai": ["admin", "manager", "technician"],
  "/cong-viec": ["admin", "manager", "technician"],
  "/dao-tao": ["admin", "manager", "technician"],
  "/dao-tao/:id": ["admin", "manager", "technician"],
  "/tai-lieu": ["admin", "manager", "technician", "viewer", "sales"],
  "/quy-trinh": ["admin", "manager", "technician"],
  "/quy-trinh/:moduleKey": ["admin", "manager", "technician"],
  "/quy-trinh/:moduleKey/:workflowId": ["admin", "manager", "technician"],
  "/cai-dat": ["admin", "manager"],
  "/cai-dat/thuoc-tinh": ["admin", "manager"],
  "/cai-dat/thuoc-tinh/:moduleKey": ["admin", "manager"],
};

interface RoleContextValue {
  role: Role;
  setRole: (r: Role) => void;
  canAccess: (path: string) => boolean;
  canDo: (moduleKey: string, action: CrudAction) => boolean;
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

const STORAGE_KEY = "erp-current-role";

function readStoredRole(): Role {
  const saved = localStorage.getItem(STORAGE_KEY) as Role | null;
  if (saved && saved in ROLE_LABELS) return saved;
  return "admin";
}

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const { data: permMatrix } = useRolePermissions(isAuthenticated);

  const permissionsByRole = useMemo(() => {
    if (!permMatrix?.roles?.length) return null;
    const map: Record<string, Record<string, CrudPermission>> = {};
    for (const r of permMatrix.roles) {
      map[r.code] = r.permissions;
    }
    return map;
  }, [permMatrix]);

  /** Chỉ dùng khi chưa đăng nhập (demo / màn login bọc RoleProvider). */
  const [guestRole, setGuestRole] = useState<Role>(readStoredRole);

  const role = useMemo<Role>(() => {
    if (isAuthenticated && user) return user.role;
    return guestRole;
  }, [isAuthenticated, user, guestRole]);

  useEffect(() => {
    if (!isAuthenticated) localStorage.setItem(STORAGE_KEY, guestRole);
  }, [guestRole, isAuthenticated]);

  const setRole = useCallback(
    (r: Role) => {
      if (isAuthenticated && user) return;
      setGuestRole(r);
    },
    [isAuthenticated, user],
  );

  const canAccess = useCallback(
    (path: string) => {
      if (isAppRouteHidden(path)) return false;
      if (role === "admin") return true;
      const moduleKey = resolveModuleKeyFromPath(path);
      if (moduleKey && permissionsByRole) {
        return moduleAllowedForRoleFromMap(role, moduleKey, permissionsByRole);
      }
      if (ROUTE_PERMISSIONS[path]) return ROUTE_PERMISSIONS[path].includes(role);
      const segments = path.split("/").filter(Boolean);
      for (const pattern of Object.keys(ROUTE_PERMISSIONS)) {
        const pSegs = pattern.split("/").filter(Boolean);
        if (pSegs.length !== segments.length) continue;
        const match = pSegs.every((seg, i) => seg.startsWith(":") || seg === segments[i]);
        if (match) return ROUTE_PERMISSIONS[pattern].includes(role);
      }
      return true;
    },
    [role, permissionsByRole],
  );

  const canDo = useCallback(
    (moduleKey: string, action: CrudAction) => {
      if (role === "admin") return true;
      if (permissionsByRole) {
        return moduleActionAllowedFromMap(role, moduleKey, action, permissionsByRole);
      }
      if (action === "read") {
        return moduleAllowedForRoleFromMap(role, moduleKey, null);
      }
      return role === "admin";
    },
    [role, permissionsByRole],
  );

  return (
    <RoleContext.Provider value={{ role, setRole, canAccess, canDo }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
};
