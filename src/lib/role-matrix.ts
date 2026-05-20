import { ROUTE_PERMISSIONS, ROLE_LABELS, type Role } from "@/hooks/use-role";
import { PERMISSION_MODULE_DEFS } from "@/lib/route-module-map";

/** Các nhóm chức năng khớp menu chính; `paths` là khóa trong `ROUTE_PERMISSIONS`. */
export const ROLE_MATRIX_MODULES = PERMISSION_MODULE_DEFS;

/** Đơn nhất, thứ tự hiển thị trong màn «Phân quyền». */
export const SETTINGS_ROLE_ORDER: Role[] = ["admin", "manager", "technician", "sales", "viewer"];

export function moduleAllowedForRole(role: Role, paths: readonly (keyof typeof ROUTE_PERMISSIONS)[]): boolean {
  return paths.some((path) => {
    const allowed = ROUTE_PERMISSIONS[path];
    return Boolean(allowed && (allowed as readonly Role[]).includes(role));
  });
}

export function getAllowedModuleLabels(role: Role): string[] {
  return ROLE_MATRIX_MODULES.filter((m) => moduleAllowedForRole(role, m.paths)).map((m) => m.label);
}

export function getRolePublicTitle(role: Role): string {
  return ROLE_LABELS[role];
}
