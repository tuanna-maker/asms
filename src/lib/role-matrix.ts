import { ROUTE_PERMISSIONS, ROLE_LABELS, type Role } from "@/hooks/use-role";

/** Các nhóm chức năng khớp menu chính; `paths` là khóa trong `ROUTE_PERMISSIONS`. */
export const ROLE_MATRIX_MODULES: ReadonlyArray<{
  label: string;
  paths: (keyof typeof ROUTE_PERMISSIONS)[];
}> = [
  { label: "Dashboard", paths: ["/"] },
  { label: "Hợp đồng", paths: ["/hop-dong"] },
  { label: "Bàn giao & HL", paths: ["/ban-giao"] },
  { label: "Bảo hành / SC", paths: ["/bao-hanh"] },
  { label: "Sản phẩm", paths: ["/san-pham"] },
  { label: "Vật tư", paths: ["/vat-tu"] },
  { label: "CRM / Khách hàng", paths: ["/khach-hang"] },
  { label: "Báo cáo", paths: ["/bao-cao"] },
  { label: "Đề tài NC", paths: ["/de-tai"] },
  { label: "Công việc", paths: ["/cong-viec"] },
  { label: "Đào tạo & HL", paths: ["/dao-tao", "/dao-tao/:id"] },
  { label: "Tài liệu", paths: ["/tai-lieu"] },
  { label: "Cài đặt", paths: ["/cai-dat"] },
];

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
