import type { LucideIcon } from "lucide-react";
import {
  Building2,
  FileText,
  Truck,
  Wrench,
  Boxes,
  Users,
  FlaskConical,
  ListTodo,
  GraduationCap,
  FolderOpen,
  Tags,
  Warehouse,
  Ruler,
  Workflow,
  CircleDot,
  ListChecks,
  Package,
  ArrowLeftRight,
  Gauge,
  Shield,
  Layers,
} from "lucide-react";

export type AttributeModuleKey =
  | "hop-dong"
  | "ban-giao"
  | "bao-hanh"
  | "san-pham"
  | "vat-tu"
  | "khach-hang"
  | "de-tai"
  | "cong-viec"
  | "dao-tao"
  | "tai-lieu"
  | "quy-trinh";

export type AttributeRowStatus = "active" | "inactive";

export type AttributeRow = {
  id: string;
  code: string;
  name: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  status: AttributeRowStatus;
  isSystem: boolean;
};

export type AttributeSectionDataSource =
  | "definitions"
  | "contract_clauses"
  | "contract_clause_groups";

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
        description: "Giá trị trạng thái trên danh sách / chi tiết hợp đồng (khớp mã lưu trong hệ thống).",
        icon: CircleDot,
        iconClassName: "bg-violet-500/15 text-violet-600",
        dataSource: "definitions",
        definitionCategory: "contract_status",
      },
      {
        id: "contract_clause_groups",
        title: "Nhóm điều khoản và điều kiện",
        description: "Gom các điều khoản mẫu thành nhóm để chọn nhanh trên hợp đồng.",
        icon: Layers,
        iconClassName: "bg-amber-500/15 text-amber-600",
        dataSource: "contract_clause_groups",
      },
      {
        id: "contract_clauses",
        title: "Điều khoản và điều kiện",
        description: "Nội dung mẫu điều khoản gắn vào hợp đồng khi tạo / sửa.",
        icon: ListChecks,
        iconClassName: "bg-emerald-500/15 text-emerald-600",
        dataSource: "contract_clauses",
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
        dataSource: "definitions",
        definitionCategory: "handover_type",
      },
      {
        id: "handover_status",
        title: "Trạng thái phiếu bàn giao",
        description: "Trạng thái tiến độ phiếu bàn giao trên màn Bàn giao.",
        icon: ListChecks,
        iconClassName: "bg-amber-500/15 text-amber-700",
        dataSource: "definitions",
        definitionCategory: "handover_status",
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
        dataSource: "definitions",
        definitionCategory: "warranty_priority",
      },
      {
        id: "warranty_status",
        title: "Trạng thái phiếu",
        description: "Trạng thái tiếp nhận và xử lý.",
        icon: Tags,
        iconClassName: "bg-violet-500/15 text-violet-600",
        dataSource: "definitions",
        definitionCategory: "warranty_status",
      },
      {
        id: "warranty_ticket_type",
        title: "Loại phiếu (BH / SC / bảo trì)",
        description: "Phân loại phiếu trên màn Bảo hành (bảo hành, sửa chữa, bảo trì).",
        icon: Shield,
        iconClassName: "bg-fuchsia-500/15 text-fuchsia-700",
        dataSource: "definitions",
        definitionCategory: "warranty_ticket_type",
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
        dataSource: "definitions",
        definitionCategory: "product_category",
      },
      {
        id: "product_status",
        title: "Trạng thái sản phẩm",
        description: "Trạng thái vòng đời sản phẩm trên danh mục / lọc.",
        icon: Gauge,
        iconClassName: "bg-emerald-500/15 text-emerald-700",
        dataSource: "definitions",
        definitionCategory: "product_status",
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
        dataSource: "definitions",
        definitionCategory: "warehouse",
      },
      {
        id: "material_unit",
        title: "Đơn vị vật tư",
        description: "Đơn vị tính trên form nhập kho.",
        icon: Ruler,
        iconClassName: "bg-teal-500/15 text-teal-600",
        dataSource: "definitions",
        definitionCategory: "material_unit",
      },
      {
        id: "material_type",
        title: "Loại vật tư (định danh / tiêu hao)",
        description: "Phân loại vật tư trên màn Vật tư.",
        icon: Package,
        iconClassName: "bg-slate-500/15 text-slate-700",
        dataSource: "definitions",
        definitionCategory: "material_type",
      },
      {
        id: "material_transfer_type",
        title: "Loại phiếu điều chuyển",
        description: "Liên hợp đồng, bảo hành hoặc sửa chữa.",
        icon: ArrowLeftRight,
        iconClassName: "bg-cyan-500/15 text-cyan-700",
        dataSource: "definitions",
        definitionCategory: "material_transfer_type",
      },
      {
        id: "material_transfer_status",
        title: "Trạng thái phiếu điều chuyển",
        description: "Trạng thái xử lý phiếu điều chuyển kho.",
        icon: CircleDot,
        iconClassName: "bg-indigo-500/15 text-indigo-700",
        dataSource: "definitions",
        definitionCategory: "material_transfer_status",
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
        dataSource: "definitions",
        definitionCategory: "customer_source",
      },
      {
        id: "company_type",
        title: "Loại công ty",
        description: "Phân loại tổ chức khách hàng.",
        icon: Building2,
        iconClassName: "bg-blue-500/15 text-blue-600",
        dataSource: "definitions",
        definitionCategory: "company_type",
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
        dataSource: "definitions",
        definitionCategory: "research_stage",
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
        dataSource: "definitions",
        definitionCategory: "task_priority",
      },
      {
        id: "task_status",
        title: "Trạng thái công việc",
        description: "Cột / thẻ trạng thái trên màn Công việc.",
        icon: CircleDot,
        iconClassName: "bg-blue-500/15 text-blue-700",
        dataSource: "definitions",
        definitionCategory: "task_status",
      },
      {
        id: "task_type",
        title: "Loại công việc",
        description: "Phân loại nhiệm vụ (nghiên cứu, báo cáo, khảo sát…).",
        icon: Tags,
        iconClassName: "bg-orange-500/15 text-orange-700",
        dataSource: "definitions",
        definitionCategory: "task_type",
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
        dataSource: "definitions",
        definitionCategory: "training_type",
      },
      {
        id: "training_status",
        title: "Trạng thái khóa đào tạo",
        description: "Trạng thái khóa học trên màn Đào tạo & HL.",
        icon: CircleDot,
        iconClassName: "bg-rose-500/15 text-rose-700",
        dataSource: "definitions",
        definitionCategory: "training_status",
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
        dataSource: "definitions",
        definitionCategory: "document_type",
      },
    ],
  },
  {
    key: "quy-trinh",
    label: "Quy trình",
    menuPath: "/quy-trinh",
    sections: [
      {
        id: "workflow_step_action",
        title: "Hành động bước quy trình",
        description: "Mã hành động khi cấu hình bước (trình ký, ký duyệt…).",
        icon: Workflow,
        iconClassName: "bg-purple-500/15 text-purple-700",
        dataSource: "definitions",
        definitionCategory: "workflow_step_action",
      },
      {
        id: "workflow_phase",
        title: "Giai đoạn bước quy trình",
        description: "Mã giai đoạn (bàn giao, huấn luyện, bảo hành…) trong biên tập quy trình.",
        icon: Layers,
        iconClassName: "bg-violet-500/15 text-violet-800",
        dataSource: "definitions",
        definitionCategory: "workflow_phase",
      },
    ],
  },
];

/** Tất cả nhóm danh mục dùng trong Cài đặt → Thuộc tính (cho FieldSchemaBuilder, v.v.). */
export const ALL_DEFINITION_CATEGORIES = ATTRIBUTE_MODULES.flatMap((m) =>
  m.sections.map((s) => s.definitionCategory ?? s.id),
).sort();

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
