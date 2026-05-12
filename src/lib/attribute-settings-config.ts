import type { LucideIcon } from "lucide-react";
import {
  Building2,
  FileText,
  Truck,
  Wrench,
  Boxes,
  Package,
  Users,
  BarChart3,
  FlaskConical,
  ListTodo,
  GraduationCap,
  FolderOpen,
  Tags,
  CircleDot,
  Warehouse,
  Ruler,
} from "lucide-react";

export type AttributeModuleKey =
  | "hop-dong"
  | "ban-giao"
  | "bao-hanh"
  | "san-pham"
  | "vat-tu"
  | "khach-hang"
  | "bao-cao"
  | "de-tai"
  | "cong-viec"
  | "dao-tao"
  | "tai-lieu";

export type AttributeRowStatus = "active" | "inactive";

export type AttributeRow = {
  id: string;
  name: string;
  createdAt: string;
  createdBy: string;
  status: AttributeRowStatus;
};

export type AttributeSectionDataSource = "definitions" | "contractStatusEnum" | "mock";

export type AttributeSectionDef = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  iconClassName: string;
  dataSource?: AttributeSectionDataSource;
  definitionCategory?: string;
};

export type AttributeModuleDef = {
  key: AttributeModuleKey;
  label: string;
  menuPath: string;
  sections: AttributeSectionDef[];
};

export const ATTRIBUTE_SETTINGS_BASE_PATH = "/cai-dat/thuoc-tinh";

export const ATTRIBUTE_MODULES: AttributeModuleDef[] = [
  {
    key: "hop-dong",
    label: "Hợp đồng",
    menuPath: "/hop-dong",
    sections: [
      {
        id: "contract_type",
        title: "Loại hợp đồng",
        description: "Danh mục loại hợp đồng dùng khi tạo và lọc hợp đồng.",
        icon: FileText,
        iconClassName: "bg-blue-500/15 text-blue-600",
        dataSource: "definitions",
        definitionCategory: "contract_type",
      },
      {
        id: "contract_status",
        title: "Trạng thái hợp đồng",
        description: "Trạng thái vòng đời do hệ thống quản lý (enum), không chỉnh trên màn này.",
        icon: CircleDot,
        iconClassName: "bg-emerald-500/15 text-emerald-600",
        dataSource: "contractStatusEnum",
      },
    ],
  },
  {
    key: "ban-giao",
    label: "Bàn giao & HL",
    menuPath: "/ban-giao",
    sections: [
      {
        id: "handover_type",
        title: "Loại bàn giao",
        description: "Phân loại phiếu bàn giao và huấn luyện.",
        icon: Truck,
        iconClassName: "bg-orange-500/15 text-orange-600",
      },
    ],
  },
  {
    key: "bao-hanh",
    label: "Bảo hành / SC",
    menuPath: "/bao-hanh",
    sections: [
      {
        id: "warranty_priority",
        title: "Mức ưu tiên",
        description: "Mức ưu tiên xử lý yêu cầu bảo hành, sửa chữa.",
        icon: Wrench,
        iconClassName: "bg-rose-500/15 text-rose-600",
      },
      {
        id: "warranty_status",
        title: "Trạng thái phiếu",
        description: "Trạng thái tiếp nhận và xử lý.",
        icon: Tags,
        iconClassName: "bg-violet-500/15 text-violet-600",
      },
    ],
  },
  {
    key: "san-pham",
    label: "Sản phẩm",
    menuPath: "/san-pham",
    sections: [
      {
        id: "product_category",
        title: "Nhóm sản phẩm",
        description: "Phân loại sản phẩm trên danh mục.",
        icon: Boxes,
        iconClassName: "bg-sky-500/15 text-sky-600",
      },
    ],
  },
  {
    key: "vat-tu",
    label: "Vật tư",
    menuPath: "/vat-tu",
    sections: [
      {
        id: "warehouse",
        title: "Kho / vị trí",
        description: "Hiển thị trong ô chọn Kho khi nhập vật tư.",
        icon: Warehouse,
        iconClassName: "bg-amber-500/15 text-amber-600",
      },
      {
        id: "material_unit",
        title: "Đơn vị vật tư",
        description: "Đơn vị tính trên form nhập kho.",
        icon: Ruler,
        iconClassName: "bg-teal-500/15 text-teal-600",
      },
    ],
  },
  {
    key: "khach-hang",
    label: "CRM / Khách hàng",
    menuPath: "/khach-hang",
    sections: [
      {
        id: "customer_source",
        title: "Nguồn giới thiệu",
        description: "Nguồn khách hàng tiềm năng.",
        icon: Users,
        iconClassName: "bg-indigo-500/15 text-indigo-600",
      },
      {
        id: "company_type",
        title: "Loại công ty",
        description: "Phân loại tổ chức khách hàng.",
        icon: Building2,
        iconClassName: "bg-blue-500/15 text-blue-600",
      },
    ],
  },
  {
    key: "bao-cao",
    label: "Báo cáo",
    menuPath: "/bao-cao",
    sections: [
      {
        id: "report_period",
        title: "Kỳ báo cáo",
        description: "Chu kỳ lọc báo cáo thống kê.",
        icon: BarChart3,
        iconClassName: "bg-fuchsia-500/15 text-fuchsia-600",
      },
    ],
  },
  {
    key: "de-tai",
    label: "Đề tài NC",
    menuPath: "/de-tai",
    sections: [
      {
        id: "research_stage",
        title: "Giai đoạn đề tài",
        description: "Trạng thái nghiên cứu.",
        icon: FlaskConical,
        iconClassName: "bg-lime-500/15 text-lime-600",
      },
    ],
  },
  {
    key: "cong-viec",
    label: "Công việc",
    menuPath: "/cong-viec",
    sections: [
      {
        id: "task_priority",
        title: "Độ ưu tiên",
        description: "Mức ưu tiên công việc.",
        icon: ListTodo,
        iconClassName: "bg-cyan-500/15 text-cyan-600",
      },
    ],
  },
  {
    key: "dao-tao",
    label: "Đào tạo & HL",
    menuPath: "/dao-tao",
    sections: [
      {
        id: "training_type",
        title: "Loại đào tạo",
        description: "Hình thức đào tạo và huấn luyện.",
        icon: GraduationCap,
        iconClassName: "bg-pink-500/15 text-pink-600",
      },
    ],
  },
  {
    key: "tai-lieu",
    label: "Tài liệu",
    menuPath: "/tai-lieu",
    sections: [
      {
        id: "document_type",
        title: "Loại tài liệu",
        description: "Phân loại tài liệu lưu trữ.",
        icon: FolderOpen,
        iconClassName: "bg-slate-500/15 text-slate-600",
      },
    ],
  },
];

export const DEFAULT_ATTRIBUTE_MODULE_KEY: AttributeModuleKey = "hop-dong";

export function isAttributeModuleKey(value: string): value is AttributeModuleKey {
  return ATTRIBUTE_MODULES.some((m) => m.key === value);
}

export function getAttributeModule(key: AttributeModuleKey): AttributeModuleDef {
  const mod = ATTRIBUTE_MODULES.find((m) => m.key === key);
  if (!mod) throw new Error(`Unknown attribute module: ${key}`);
  return mod;
}

export function attributeModulePath(key: AttributeModuleKey): string {
  return `${ATTRIBUTE_SETTINGS_BASE_PATH}/${key}`;
}
