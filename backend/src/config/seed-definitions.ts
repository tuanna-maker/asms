import { prisma } from "../utils/prisma";

const SEEDS: Array<{ category: string; code: string; label: string; sortOrder: number }> = [
  // ----- material / warehouse -----
  { category: "warehouse", code: "Kho chính", label: "Kho chính", sortOrder: 0 },
  { category: "warehouse", code: "Kho phụ", label: "Kho phụ", sortOrder: 10 },
  { category: "material_unit", code: "bộ", label: "Bộ", sortOrder: 0 },
  { category: "material_unit", code: "cái", label: "Cái", sortOrder: 10 },
  { category: "material_unit", code: "mét", label: "Mét", sortOrder: 20 },
  { category: "material_unit", code: "kg", label: "Kilogram", sortOrder: 30 },

  // ----- contracts -----
  { category: "contract_type", code: "maintenance", label: "Hợp đồng bảo trì", sortOrder: 0 },
  { category: "contract_type", code: "deployment", label: "Hợp đồng triển khai", sortOrder: 10 },
  { category: "contract_type", code: "sales", label: "Hợp đồng mua bán", sortOrder: 20 },
  { category: "contract_type", code: "service", label: "Hợp đồng dịch vụ", sortOrder: 30 },
  { category: "contract_status", code: "draft", label: "Bản nháp", sortOrder: 0 },
  { category: "contract_status", code: "active", label: "Đang triển khai", sortOrder: 10 },
  { category: "contract_status", code: "completed", label: "Hoàn tất", sortOrder: 20 },
  { category: "contract_status", code: "late", label: "Trễ hạn", sortOrder: 30 },
  { category: "contract_status", code: "liquidated", label: "Đã thanh lý", sortOrder: 40 },

  // ----- warranties -----
  { category: "warranty_priority", code: "low", label: "Thấp", sortOrder: 0 },
  { category: "warranty_priority", code: "medium", label: "Trung bình", sortOrder: 10 },
  { category: "warranty_priority", code: "high", label: "Cao", sortOrder: 20 },
  { category: "warranty_priority", code: "urgent", label: "Khẩn cấp", sortOrder: 30 },
  { category: "warranty_status", code: "open", label: "Mới tiếp nhận", sortOrder: 0 },
  { category: "warranty_status", code: "processing", label: "Đang xử lý", sortOrder: 10 },
  { category: "warranty_status", code: "completed", label: "Hoàn tất", sortOrder: 20 },
  { category: "warranty_status", code: "cancelled", label: "Đã hủy", sortOrder: 30 },

  // ----- tasks -----
  { category: "task_priority", code: "low", label: "Thấp", sortOrder: 0 },
  { category: "task_priority", code: "medium", label: "Trung bình", sortOrder: 10 },
  { category: "task_priority", code: "high", label: "Cao", sortOrder: 20 },
  { category: "task_priority", code: "urgent", label: "Khẩn cấp", sortOrder: 30 },

  // ----- training -----
  { category: "training_type", code: "internal", label: "Đào tạo nội bộ", sortOrder: 0 },
  { category: "training_type", code: "external", label: "Đào tạo bên ngoài", sortOrder: 10 },
  { category: "training_type", code: "online", label: "Đào tạo trực tuyến", sortOrder: 20 },

  // ----- research stage -----
  { category: "research_stage", code: "planning", label: "Lập kế hoạch", sortOrder: 0 },
  { category: "research_stage", code: "active", label: "Đang nghiên cứu", sortOrder: 10 },
  { category: "research_stage", code: "completed", label: "Hoàn tất", sortOrder: 20 },
  { category: "research_stage", code: "suspended", label: "Tạm dừng", sortOrder: 30 },

  // ----- documents -----
  { category: "document_type", code: "contract", label: "Hồ sơ hợp đồng", sortOrder: 0 },
  { category: "document_type", code: "technical", label: "Tài liệu kỹ thuật", sortOrder: 10 },
  { category: "document_type", code: "policy", label: "Quy định / chính sách", sortOrder: 20 },
  { category: "document_type", code: "training", label: "Tài liệu đào tạo", sortOrder: 30 },
  { category: "document_type", code: "report", label: "Báo cáo", sortOrder: 40 },
  { category: "document_type", code: "other", label: "Khác", sortOrder: 50 },

  // ----- handover -----
  { category: "handover_type", code: "delivery", label: "Bàn giao thiết bị", sortOrder: 0 },
  { category: "handover_type", code: "training", label: "Bàn giao huấn luyện", sortOrder: 10 },
  { category: "handover_type", code: "acceptance", label: "Bàn giao nghiệm thu", sortOrder: 20 },

  // ----- CRM -----
  { category: "customer_source", code: "referral", label: "Giới thiệu", sortOrder: 0 },
  { category: "customer_source", code: "marketing", label: "Marketing", sortOrder: 10 },
  { category: "customer_source", code: "event", label: "Sự kiện / hội thảo", sortOrder: 20 },
  { category: "customer_source", code: "direct", label: "Liên hệ trực tiếp", sortOrder: 30 },
  { category: "company_type", code: "government", label: "Cơ quan nhà nước", sortOrder: 0 },
  { category: "company_type", code: "military", label: "Đơn vị quân đội", sortOrder: 10 },
  { category: "company_type", code: "enterprise", label: "Doanh nghiệp", sortOrder: 20 },
  { category: "company_type", code: "research", label: "Tổ chức nghiên cứu", sortOrder: 30 },

  // ----- product -----
  { category: "product_category", code: "hardware", label: "Phần cứng", sortOrder: 0 },
  { category: "product_category", code: "software", label: "Phần mềm", sortOrder: 10 },
  { category: "product_category", code: "service", label: "Dịch vụ", sortOrder: 20 },

  { category: "product_status", code: "developing", label: "Đang phát triển", sortOrder: 0 },
  { category: "product_status", code: "producing", label: "Đang sản xuất", sortOrder: 10 },
  { category: "product_status", code: "equipped", label: "Đã trang bị", sortOrder: 20 },
  { category: "product_status", code: "stopped", label: "Ngừng / tạm dừng", sortOrder: 30 },

  { category: "warranty_ticket_type", code: "warranty", label: "Bảo hành", sortOrder: 0 },
  { category: "warranty_ticket_type", code: "repair", label: "Sửa chữa", sortOrder: 10 },
  { category: "warranty_ticket_type", code: "maintenance", label: "Bảo trì", sortOrder: 20 },

  { category: "handover_status", code: "pending", label: "Chưa bắt đầu", sortOrder: 0 },
  { category: "handover_status", code: "active", label: "Đang thực hiện", sortOrder: 10 },
  { category: "handover_status", code: "completed", label: "Hoàn tất", sortOrder: 20 },
  { category: "handover_status", code: "late", label: "Trễ hạn", sortOrder: 30 },

  { category: "task_status", code: "todo", label: "Chờ thực hiện", sortOrder: 0 },
  { category: "task_status", code: "in_progress", label: "Đang thực hiện", sortOrder: 10 },
  { category: "task_status", code: "review", label: "Đang xét duyệt", sortOrder: 20 },
  { category: "task_status", code: "completed", label: "Hoàn thành", sortOrder: 30 },
  { category: "task_status", code: "delayed", label: "Chậm tiến độ", sortOrder: 40 },

  { category: "task_type", code: "research", label: "Nghiên cứu", sortOrder: 0 },
  { category: "task_type", code: "report", label: "Báo cáo", sortOrder: 10 },
  { category: "task_type", code: "fieldwork", label: "Khảo sát hiện trường", sortOrder: 20 },
  { category: "task_type", code: "admin", label: "Hành chính", sortOrder: 30 },
  { category: "task_type", code: "review", label: "Xét duyệt", sortOrder: 40 },

  { category: "training_status", code: "planned", label: "Lên kế hoạch", sortOrder: 0 },
  { category: "training_status", code: "ongoing", label: "Đang diễn ra", sortOrder: 10 },
  { category: "training_status", code: "completed", label: "Hoàn thành", sortOrder: 20 },
  { category: "training_status", code: "cancelled", label: "Đã hủy", sortOrder: 30 },

  { category: "material_type", code: "identified", label: "Định danh", sortOrder: 0 },
  { category: "material_type", code: "consumable", label: "Tiêu hao", sortOrder: 10 },

  { category: "material_transfer_type", code: "contract", label: "Theo hợp đồng", sortOrder: 0 },
  { category: "material_transfer_type", code: "warranty", label: "Theo bảo hành", sortOrder: 10 },
  { category: "material_transfer_type", code: "repair", label: "Theo sửa chữa", sortOrder: 20 },

  { category: "material_transfer_status", code: "pending", label: "Chờ xử lý", sortOrder: 0 },
  { category: "material_transfer_status", code: "processing", label: "Đang xử lý", sortOrder: 10 },
  { category: "material_transfer_status", code: "completed", label: "Hoàn tất", sortOrder: 20 },

  // ----- workflow step actions (badges in editor) -----
  { category: "workflow_step_action", code: "submit", label: "Trình ký", sortOrder: 0 },
  { category: "workflow_step_action", code: "approve", label: "Ký duyệt", sortOrder: 10 },
  { category: "workflow_step_action", code: "sign", label: "Ký số", sortOrder: 20 },
  { category: "workflow_step_action", code: "release", label: "Ban hành", sortOrder: 30 },

  // ----- workflow phases (phase_code for steps) -----
  { category: "workflow_phase", code: "handover", label: "Bàn giao", sortOrder: 0 },
  { category: "workflow_phase", code: "training", label: "Huấn luyện", sortOrder: 10 },
  { category: "workflow_phase", code: "warranty", label: "Bảo hành", sortOrder: 20 },
  { category: "workflow_phase", code: "other", label: "Khác", sortOrder: 30 },
];

export async function seedDataDefinitions() {
  for (const s of SEEDS) {
    const exists = await prisma.dataDefinition.findFirst({
      where: { category: s.category, code: s.code, deletedAt: null },
    });
    if (exists) {
      if (!exists.isSystem) {
        await prisma.dataDefinition.update({
          where: { id: exists.id },
          data: { isSystem: true },
        });
      }
      continue;
    }
    await prisma.dataDefinition.create({
      data: {
        category: s.category,
        code: s.code,
        label: s.label,
        sortOrder: s.sortOrder,
        isSystem: true,
      },
    });
  }
}
