import type { AttributeModuleKey, AttributeRow } from "@/lib/attribute-settings-config";
import { ATTRIBUTE_MODULES } from "@/lib/attribute-settings-config";

const CREATORS = ["Nguyễn Văn A", "Trần Thị B", "Lê Minh C", "Phạm Thu D"];

function seedRows(sectionId: string, names: string[]): AttributeRow[] {
  return names.map((name, index) => ({
    id: `${sectionId}-${index + 1}`,
    name,
    createdAt: new Date(2025, (index + 1) % 12, 5 + index).toISOString(),
    createdBy: CREATORS[index % CREATORS.length],
    status: index % 5 === 0 ? "inactive" : "active",
  }));
}

const SECTION_SEEDS: Record<string, string[]> = {
  contract_type: ["Hợp đồng bảo trì", "Hợp đồng triển khai", "Hợp đồng mua bán", "Hợp đồng dịch vụ"],
  contract_status: ["Nháp", "Đang thực hiện", "Hoàn thành", "Tạm dừng", "Hủy"],
  handover_type: ["Bàn giao lắp đặt", "Huấn luyện vận hành", "Nghiệm thu"],
  warranty_priority: ["Thấp", "Trung bình", "Cao", "Khẩn cấp"],
  warranty_status: ["Mới", "Đang xử lý", "Chờ linh kiện", "Hoàn tất"],
  product_category: ["Thiết bị", "Phụ kiện", "Dịch vụ", "Giải pháp"],
  warehouse: ["Kho HN", "Kho HCM", "Kho Đà Nẵng"],
  material_unit: ["Cái", "Bộ", "Hộp", "Kg", "Mét"],
  customer_source: ["Website", "Giới thiệu", "Triển lãm", "Đối tác"],
  company_type: ["Doanh nghiệp", "Tổ chức", "Cá nhân"],
  report_period: ["Tuần", "Tháng", "Quý", "Năm"],
  research_stage: ["Đề xuất", "Thực hiện", "Nghiệm thu", "Kết thúc"],
  task_priority: ["Thấp", "Trung bình", "Cao"],
  training_type: ["Tại chỗ", "Trực tuyến", "Kết hợp"],
  document_type: ["Hợp đồng", "Biên bản", "Hướng dẫn", "Chứng từ"],
};

export type AttributeSectionData = Record<string, AttributeRow[]>;

export type AttributeModuleData = Record<AttributeModuleKey, AttributeSectionData>;

function buildModuleData(): AttributeModuleData {
  const data = {} as AttributeModuleData;
  for (const mod of ATTRIBUTE_MODULES) {
    const sections: AttributeSectionData = {};
    for (const section of mod.sections) {
      sections[section.id] = seedRows(section.id, SECTION_SEEDS[section.id] ?? ["Mục mẫu 1", "Mục mẫu 2"]);
    }
    data[mod.key] = sections;
  }
  return data;
}

export const INITIAL_ATTRIBUTE_MODULE_DATA = buildModuleData();
