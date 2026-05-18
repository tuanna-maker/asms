import { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";

export type Role = "admin" | "manager" | "technician" | "viewer" | "sales";

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Quản trị",
  manager: "Quản lý",
  technician: "Kỹ thuật viên",
  viewer: "Xem",
  sales: "Nhân viên bán hàng",
};

// Quyền truy cập theo path
export const ROUTE_PERMISSIONS: Record<string, Role[]> = {
  "/": ["admin", "manager", "technician", "viewer", "sales"],
  "/hop-dong": ["admin", "manager", "viewer", "sales"],
  "/ban-giao": ["admin", "manager", "technician"],
  "/bao-hanh": ["admin", "manager", "technician"],
  "/san-pham": ["admin", "manager", "technician", "viewer", "sales"],
  "/vat-tu": ["admin", "manager", "technician"],
  "/khach-hang": ["admin", "manager", "viewer", "sales"],
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

  const canAccess = (path: string) => {
    // Tìm rule khớp chính xác trước
    if (ROUTE_PERMISSIONS[path]) return ROUTE_PERMISSIONS[path].includes(role);
    // Fallback: khớp theo prefix segment cho dynamic routes (/foo/:id)
    const segments = path.split("/").filter(Boolean);
    for (const pattern of Object.keys(ROUTE_PERMISSIONS)) {
      const pSegs = pattern.split("/").filter(Boolean);
      if (pSegs.length !== segments.length) continue;
      const match = pSegs.every((seg, i) => seg.startsWith(":") || seg === segments[i]);
      if (match) return ROUTE_PERMISSIONS[pattern].includes(role);
    }
    return true;
  };

  return (
    <RoleContext.Provider value={{ role, setRole, canAccess }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
};
