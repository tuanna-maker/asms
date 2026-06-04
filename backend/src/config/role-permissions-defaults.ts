export type CrudPermission = {
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
};

export type PermissionModuleChild = { key: string; label: string };

export type PermissionModuleNode = {
  key: string;
  label: string;
  children?: ReadonlyArray<PermissionModuleChild>;
};

/** Cây module phân quyền — khớp frontend. */
export const PERMISSION_MODULES: ReadonlyArray<PermissionModuleNode> = [
  { key: "dashboard", label: "Dashboard" },
  {
    key: "hop-dong",
    label: "Hợp đồng",
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
    children: [
      { key: "ban-giao.ban-giao", label: "Bàn giao" },
      { key: "ban-giao.huan-luyen", label: "Huấn luyện" },
    ],
  },
  {
    key: "bao-hanh",
    label: "Bảo hành / SC",
    children: [
      { key: "bao-hanh.danh-sach", label: "Danh sách phiếu" },
    ],
  },
  {
    key: "san-pham",
    label: "Sản phẩm",
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
    children: [
      { key: "vat-tu.kho", label: "Kho vật tư" },
      { key: "vat-tu.dieu-chuyen", label: "Điều chuyển" },
    ],
  },
  { key: "phan-anh", label: "Phản ánh" },
  {
    key: "khach-hang",
    label: "CRM / Khách hàng",
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
    children: [
      { key: "cong-viec.kanban", label: "Kanban" },
      { key: "cong-viec.danh-sach", label: "Danh sách" },
      { key: "cong-viec.lich", label: "Lịch" },
    ],
  },
  {
    key: "dao-tao",
    label: "Đào tạo & HL",
    children: [
      { key: "dao-tao.tong-quan", label: "Tổng quan" },
      { key: "dao-tao.hoc-vien", label: "Học viên" },
      { key: "dao-tao.lich-hoc", label: "Lịch học" },
    ],
  },
  {
    key: "tai-lieu",
    label: "Tài liệu",
    children: [
      { key: "tai-lieu.hop-dong", label: "Hợp đồng" },
      { key: "tai-lieu.ky-thuat", label: "Kỹ thuật" },
      { key: "tai-lieu.chinh-sach", label: "Chính sách" },
      { key: "tai-lieu.dao-tao", label: "Đào tạo" },
      { key: "tai-lieu.bao-cao", label: "Báo cáo" },
      { key: "tai-lieu.khac", label: "Khác" },
    ],
  },
  { key: "quy-trinh", label: "Quy trình" },
  {
    key: "cai-dat",
    label: "Cài đặt",
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

export function flattenPermissionModules(): Array<{
  key: string;
  label: string;
  parentKey?: string;
}> {
  const result: Array<{ key: string; label: string; parentKey?: string }> = [];
  for (const mod of PERMISSION_MODULES) {
    result.push({ key: mod.key, label: mod.label });
    if (mod.children) {
      for (const child of mod.children) {
        result.push({ key: child.key, label: child.label, parentKey: mod.key });
      }
    }
  }
  return result;
}

const ALL_MODULE_KEYS = flattenPermissionModules().map((m) => m.key);

export function fullCrud(all = true): CrudPermission {
  return { read: all, create: all, update: all, delete: all };
}

export function readWrite(): CrudPermission {
  return { read: true, create: true, update: true, delete: false };
}

export function readOnly(): CrudPermission {
  return { read: true, create: false, update: false, delete: false };
}

export function noAccess(): CrudPermission {
  return { read: false, create: false, update: false, delete: false };
}

function applyToModuleTree(
  target: Record<string, CrudPermission>,
  mod: PermissionModuleNode,
  crud: CrudPermission,
) {
  target[mod.key] = { ...crud };
  if (mod.children) {
    for (const child of mod.children) {
      target[child.key] = { ...crud };
    }
  }
}

function buildDefaultsForRole(
  parentAccess: Record<string, CrudPermission>,
  overrides?: Record<string, CrudPermission>,
): Record<string, CrudPermission> {
  const result: Record<string, CrudPermission> = {};
  for (const mod of PERMISSION_MODULES) {
    const parentCrud = parentAccess[mod.key] ?? noAccess();
    applyToModuleTree(result, mod, parentCrud);
  }
  if (overrides) {
    for (const [key, crud] of Object.entries(overrides)) {
      result[key] = { ...crud };
    }
  }
  return result;
}

/** roleCode → moduleKey → CRUD */
export const DEFAULT_ROLE_PERMISSIONS: Record<string, Record<string, CrudPermission>> = {
  admin: Object.fromEntries(ALL_MODULE_KEYS.map((k) => [k, fullCrud()])),
  manager: buildDefaultsForRole(
    {
      dashboard: readOnly(),
      "hop-dong": readWrite(),
      "ban-giao": readWrite(),
      "bao-hanh": readWrite(),
      "san-pham": readWrite(),
      "vat-tu": readWrite(),
      "khach-hang": readWrite(),
      "phan-anh": readWrite(),
      "bao-cao": readOnly(),
      "de-tai": readWrite(),
      "cong-viec": readWrite(),
      "dao-tao": readWrite(),
      "tai-lieu": readWrite(),
      "quy-trinh": readWrite(),
      "cai-dat": readOnly(),
    },
    {
      "cai-dat.nguoi-dung": readOnly(),
      "cai-dat.vai-tro": readOnly(),
      "cai-dat.phan-quyen": noAccess(),
      "cai-dat.thong-bao": readWrite(),
      "cai-dat.he-thong": readWrite(),
      "cai-dat.phien": readOnly(),
      "cai-dat.nhat-ky": readOnly(),
      "cai-dat.thuoc-tinh": readWrite(),
    },
  ),
  technician: buildDefaultsForRole({
    dashboard: readOnly(),
    "ban-giao": readWrite(),
    "bao-hanh": readWrite(),
    "san-pham": readOnly(),
    "vat-tu": readWrite(),
    "de-tai": readWrite(),
    "cong-viec": readWrite(),
    "dao-tao": readWrite(),
    "tai-lieu": readOnly(),
    "quy-trinh": readWrite(),
    "phan-anh": readWrite(),
  }),
  viewer: buildDefaultsForRole({
    dashboard: readOnly(),
    "hop-dong": readOnly(),
    "san-pham": readOnly(),
    "khach-hang": readOnly(),
    "phan-anh": readOnly(),
    "bao-cao": readOnly(),
    "tai-lieu": readOnly(),
  }),
  sales: buildDefaultsForRole({
    dashboard: readOnly(),
    "hop-dong": readWrite(),
    "san-pham": readOnly(),
    "khach-hang": readWrite(),
    "phan-anh": readWrite(),
    "bao-cao": readOnly(),
    "tai-lieu": readOnly(),
  }),
};

export function getDefaultCrudForModule(
  roleCode: string,
  moduleKey: string,
): CrudPermission {
  return DEFAULT_ROLE_PERMISSIONS[roleCode]?.[moduleKey] ?? noAccess();
}

export const VALID_MODULE_KEYS = new Set(ALL_MODULE_KEYS);
