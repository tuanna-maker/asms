import { ROUTE_PERMISSIONS } from "@/hooks/use-role";
import type { CrudPermission } from "@/lib/permission-types";

/** Khớp `PERMISSION_MODULES` trên backend — chỉ parent có paths route. */
export const PERMISSION_MODULE_DEFS: ReadonlyArray<{
  key: string;
  label: string;
  paths: (keyof typeof ROUTE_PERMISSIONS)[];
  children?: ReadonlyArray<{ key: string; label: string }>;
}> = [
  { key: "dashboard", label: "Bảng điều khiển", paths: ["/"] },
  {
    key: "hop-dong",
    label: "Hợp đồng",
    paths: ["/hop-dong"],
    children: [
      { key: "hop-dong.thong-tin", label: "Thông tin chung" },
      { key: "hop-dong.dieu-khoan", label: "Điều khoản & Điều kiện" },
      { key: "hop-dong.san-pham", label: "Danh mục sản phẩm" },
      { key: "hop-dong.tai-lieu", label: "Tài liệu" },
      { key: "hop-dong.phan-anh", label: "Phản ánh" },
    ],
  },
  {
    key: "ban-giao",
    label: "Bàn giao & HL",
    paths: ["/ban-giao"],
    children: [
      { key: "ban-giao.ban-giao", label: "Bàn giao" },
      { key: "ban-giao.huan-luyen", label: "Huấn luyện" },
    ],
  },
  {
    key: "bao-hanh",
    label: "Bảo hành / SC",
    paths: ["/bao-hanh"],
    children: [
      { key: "bao-hanh.danh-sach", label: "Danh sách phiếu" },
      { key: "bao-hanh.thong-ke", label: "Thống kê" },
    ],
  },
  {
    key: "san-pham",
    label: "Sản phẩm",
    paths: ["/san-pham"],
    children: [
      { key: "san-pham.tong-quan", label: "Tổng quan" },
      { key: "san-pham.linh-kien", label: "Linh kiện" },
      { key: "san-pham.thong-so", label: "Thông số" },
      { key: "san-pham.tai-lieu", label: "Tài liệu" },
      { key: "san-pham.dao-tao", label: "Đào tạo" },
      { key: "san-pham.lich-su", label: "Lịch sử" },
    ],
  },
  {
    key: "vat-tu",
    label: "Vật tư",
    paths: ["/vat-tu"],
    children: [
      { key: "vat-tu.kho", label: "Kho vật tư" },
      { key: "vat-tu.dieu-chuyen", label: "Điều chuyển" },
    ],
  },
  { key: "phan-anh", label: "Phản ánh", paths: ["/phan-anh"] },
  {
    key: "khach-hang",
    label: "Khách hàng",
    paths: ["/khach-hang"],
    children: [
      { key: "khach-hang.hoat-dong", label: "Hoạt động" },
      { key: "khach-hang.lien-he", label: "Liên hệ" },
      { key: "khach-hang.khach-hang", label: "Khách hàng" },
      { key: "khach-hang.loyalty", label: "Loyalty" },
    ],
  },
  {
    key: "bao-cao",
    label: "Báo cáo",
    paths: ["/bao-cao"],
    children: [
      { key: "bao-cao.khach-hang", label: "Theo khách hàng" },
      { key: "bao-cao.hop-dong", label: "Theo hợp đồng" },
      { key: "bao-cao.dong-sp", label: "Theo dòng sản phẩm" },
      { key: "bao-cao.phan-anh", label: "Phản ánh" },
      { key: "bao-cao.don-vi", label: "Đơn vị thực hiện" },
    ],
  },
  {
    key: "de-tai",
    label: "Đề tài NC",
    paths: ["/de-tai"],
    children: [
      { key: "de-tai.tong-quan", label: "Tổng quan" },
      { key: "de-tai.cong-viec", label: "Công việc" },
      { key: "de-tai.san-pham", label: "Sản phẩm" },
      { key: "de-tai.chi-phi", label: "Chi phí" },
      { key: "de-tai.hoi-dong", label: "Hội đồng" },
      { key: "de-tai.so-cu", label: "Sở cứ" },
      { key: "de-tai.trien-khai", label: "Triển khai" },
      { key: "de-tai.hop-tac", label: "Hợp tác" },
      { key: "de-tai.thanh-vien", label: "Thành viên" },
    ],
  },
  {
    key: "cong-viec",
    label: "Công việc",
    paths: ["/cong-viec"],
    children: [
      { key: "cong-viec.kanban", label: "Kanban" },
      { key: "cong-viec.danh-sach", label: "Danh sách" },
      { key: "cong-viec.lich", label: "Lịch" },
    ],
  },
  {
    key: "dao-tao",
    label: "Đào tạo & HL",
    paths: ["/dao-tao", "/dao-tao/:id"],
    children: [
      { key: "dao-tao.tong-quan", label: "Tổng quan" },
      { key: "dao-tao.hoc-vien", label: "Học viên" },
      { key: "dao-tao.lich-hoc", label: "Lịch học" },
    ],
  },
  {
    key: "tai-lieu",
    label: "Tài liệu",
    paths: ["/tai-lieu"],
    children: [
      { key: "tai-lieu.hop-dong", label: "Hợp đồng" },
      { key: "tai-lieu.ky-thuat", label: "Kỹ thuật" },
      { key: "tai-lieu.chinh-sach", label: "Chính sách" },
      { key: "tai-lieu.dao-tao", label: "Đào tạo" },
      { key: "tai-lieu.bao-cao", label: "Báo cáo" },
      { key: "tai-lieu.khac", label: "Khác" },
    ],
  },
  {
    key: "quy-trinh",
    label: "Quy trình",
    paths: ["/quy-trinh", "/quy-trinh/:moduleKey", "/quy-trinh/:moduleKey/:workflowId"],
  },
  {
    key: "cai-dat",
    label: "Cài đặt",
    paths: ["/cai-dat", "/cai-dat/thuoc-tinh", "/cai-dat/thuoc-tinh/:moduleKey"],
    children: [
      { key: "cai-dat.nguoi-dung", label: "Người dùng" },
      { key: "cai-dat.vai-tro", label: "Vai trò" },
      { key: "cai-dat.phan-quyen", label: "Phân quyền" },
      { key: "cai-dat.thong-bao", label: "Thông báo" },
      { key: "cai-dat.he-thong", label: "Hệ thống" },
      { key: "cai-dat.phien", label: "Phiên đăng nhập" },
      { key: "cai-dat.nhat-ky", label: "Nhật ký" },
      { key: "cai-dat.thuoc-tinh", label: "Thuộc tính" },
    ],
  },
];

export function resolveModuleKeyFromPath(path: string): string | null {
  for (const mod of PERMISSION_MODULE_DEFS) {
    for (const p of mod.paths) {
      if (path === p) return mod.key;
      const base = p.split("/:")[0];
      if (base && base !== "/" && path.startsWith(base)) return mod.key;
    }
  }
  return null;
}

function legacyPathAllowed(role: string, moduleKey: string): boolean {
  const mod = PERMISSION_MODULE_DEFS.find((m) => m.key === moduleKey);
  if (!mod) return true;
  return mod.paths.some((path) => ROUTE_PERMISSIONS[path]?.includes(role as never));
}

export function moduleAllowedForRoleFromMap(
  role: string,
  moduleKey: string,
  permissionsByRole: Record<string, Record<string, CrudPermission>> | null,
): boolean {
  if (role === "admin") return true;
  const perm = permissionsByRole?.[role]?.[moduleKey];
  if (perm !== undefined) return perm.read;
  return legacyPathAllowed(role, moduleKey);
}

export function moduleActionAllowedFromMap(
  role: string,
  moduleKey: string,
  action: keyof CrudPermission,
  permissionsByRole: Record<string, Record<string, CrudPermission>> | null,
): boolean {
  if (role === "admin") return true;
  const perm = permissionsByRole?.[role]?.[moduleKey];
  if (perm !== undefined) return perm[action];
  if (action === "read") return legacyPathAllowed(role, moduleKey);
  return false;
}
