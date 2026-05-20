/**
 * Danh mục field mẫu theo module — đồng bộ backend/src/config/step-field-schema-templates.ts
 */
import type { FieldDef } from "@/lib/workflow-field-schema";

export const HANDOVER_STEP_SCHEMAS: FieldDef[][] = [
  [{ key: "handoverPlan", label: "Nội dung kế hoạch bàn giao", type: "textarea" }],
  [{ key: "costReportNote", label: "Tờ trình kinh phí", type: "textarea" }],
  [{ key: "goodsCheckNote", label: "Checklist chuẩn bị hàng hóa", type: "textarea" }],
  [
    { key: "trainingPlanNote", label: "KH huấn luyện", type: "textarea" },
    { key: "trainingCostReport", label: "Tờ trình huấn luyện", type: "textarea" },
    { key: "tempHandoverNote", label: "BBBG tạm thời (tùy chọn)", type: "textarea" },
    { key: "trainingReportNote", label: "Báo cáo KT thực hành", type: "textarea" },
    { key: "trainingDecision", label: "QĐ công nhận KQ HL", type: "textarea" },
  ],
  [{ key: "finalHandoverNote", label: "Ghi chú bàn giao chính thức", type: "textarea" }],
];

export const CONTRACT_STEP_SCHEMAS: FieldDef[][] = [
  [
    { key: "contractTypeCode", label: "Loại hợp đồng", type: "select", definitionCategory: "contract_type" },
    { key: "planDate", label: "Ngày kế hoạch", type: "date" },
    { key: "planNotes", label: "Nội dung kế hoạch bàn giao", type: "textarea" },
  ],
  [
    { key: "budgetAmount", label: "Kinh phí (ước tính)", type: "text" },
    { key: "budgetJustification", label: "Lý do / nội dung tờ trình", type: "textarea" },
  ],
  [
    { key: "checklistItems", label: "Checklist chuẩn bị", type: "textarea" },
    { key: "maintenanceNotes", label: "Ghi chú bảo dưỡng / chuẩn bị", type: "textarea" },
  ],
  [
    { key: "trainingPlan", label: "Kế hoạch huấn luyện", type: "textarea" },
    { key: "trainingProposal", label: "Tờ trình huấn luyện", type: "textarea" },
    { key: "tempHandoverDate", label: "Ngày bàn giao tạm", type: "date" },
    { key: "tempHandoverNotes", label: "Ghi chú BBBG tạm thời", type: "textarea" },
    { key: "trainingReport", label: "Báo cáo kỹ thuật / thực hiện", type: "textarea" },
    { key: "trainingCertDecision", label: "QĐ công nhận kết quả HL", type: "textarea" },
  ],
  [
    { key: "handoverDate", label: "Ngày bàn giao chính thức", type: "date" },
    { key: "handoverNotes", label: "Ghi chú bàn giao", type: "textarea" },
  ],
];

export const WARRANTY_STEP_SCHEMAS: FieldDef[][] = [
  [
    { key: "issue", label: "Mô tả sự cố", type: "textarea", required: true },
    {
      key: "receiptCategory",
      label: "Phân loại",
      type: "select",
      options: [
        { value: "incident", label: "Sự cố, hỏng hóc" },
        { value: "technical_support", label: "Kỹ thuật" },
      ],
    },
    { key: "occurredAt", label: "Thời điểm xảy ra", type: "date" },
    { key: "productSerialSnapshot", label: "Serial thiết bị", type: "text" },
    {
      key: "source",
      label: "Nguồn phiếu",
      type: "select",
      options: [
        { value: "Khách hàng", label: "Khách hàng" },
        { value: "Nội bộ", label: "Nội bộ" },
      ],
    },
    {
      key: "type",
      label: "Loại phiếu",
      type: "select",
      options: [
        { value: "warranty", label: "Bảo hành" },
        { value: "repair", label: "Sửa chữa" },
        { value: "maintenance", label: "Bảo trì" },
      ],
    },
    { key: "priorityCode", label: "Mức độ ưu tiên", type: "select", definitionCategory: "warranty_priority" },
    { key: "statusCode", label: "Trạng thái phiếu", type: "select", definitionCategory: "warranty_status" },
  ],
  [
    {
      key: "rootCause",
      label: "Đánh giá nguyên nhân",
      type: "select",
      options: [
        { value: "manufacturer", label: "Do nhà SX" },
        { value: "customer", label: "Do khách hàng" },
        { value: "unknown", label: "Chưa rõ (dữ liệu cũ)" },
      ],
    },
    { key: "handlingPlan", label: "Phương án xử lý (PA)", type: "textarea" },
    { key: "plannedHours", label: "Thời gian xử lý (dự kiến)", type: "number", placeholder: "Giờ" },
    { key: "costEstimate", label: "Chi phí (nếu có)", type: "text" },
    { key: "customerDisagreedClose", label: "KH không đồng ý PA → đóng sự cố", type: "boolean" },
  ],
  [
    {
      key: "executionMode",
      label: "Hình thức thực hiện",
      type: "select",
      options: [
        { value: "outsource", label: "Thuê đối tác ngoài" },
        { value: "self", label: "Tự thực hiện" },
      ],
    },
    {
      key: "outsourcePartner",
      label: "Đối tác",
      type: "text",
      showWhen: { field: "executionMode", value: "outsource" },
    },
    {
      key: "outsourceBudget",
      label: "Kinh phí",
      type: "text",
      showWhen: { field: "executionMode", value: "outsource" },
    },
    {
      key: "outsourceTimeline",
      label: "Thời gian",
      type: "text",
      showWhen: { field: "executionMode", value: "outsource" },
    },
    {
      key: "repairDetails",
      label: "Nội dung sửa chữa",
      type: "textarea",
      showWhen: { field: "executionMode", value: "self" },
    },
  ],
  [{ key: "postRepairAssessment", label: "Đánh giá hàng sau SC với khách hàng", type: "textarea" }],
  [{ key: "handoverNotes", label: "Ghi chú bàn giao", type: "textarea" }],
];

export const COACHING_STEP_SCHEMAS: FieldDef[][] = [
  [
    { key: "trainingPlanNote", label: "Kế hoạch huấn luyện", type: "textarea" },
    { key: "tempHandoverNote", label: "Ghi chú BBBG tạm (tùy chọn)", type: "textarea" },
  ],
  [{ key: "trainingCostReport", label: "Tờ trình huấn luyện", type: "textarea" }],
  [
    { key: "trainingReportNote", label: "Báo cáo KT thực hành", type: "textarea" },
    { key: "trainingDecision", label: "QĐ công nhận KQ huấn luyện", type: "textarea" },
  ],
];

export const TRAINING_STEP_SCHEMAS: FieldDef[][] = [
  [
    { key: "trainingPlanNote", label: "Nội dung chương trình", type: "textarea" },
    { key: "participantsNote", label: "Thành phần học viên", type: "textarea" },
    { key: "scheduleNote", label: "Lịch dự kiến", type: "textarea" },
  ],
  [
    { key: "contentApprovalNote", label: "Nội dung phê duyệt", type: "textarea" },
    { key: "approvalDecision", label: "Quyết định phê duyệt", type: "textarea" },
  ],
  [
    { key: "trainingConclusion", label: "Kết luận khóa đào tạo", type: "textarea" },
    { key: "closeoutNote", label: "Ghi chú đóng khóa", type: "textarea" },
  ],
];

export const PRODUCT_STEP_SCHEMAS: FieldDef[][] = [
  [
    { key: "productionStartDate", label: "Ngày bắt đầu sản xuất", type: "date" },
    { key: "productionEndDate", label: "Ngày kết thúc sản xuất", type: "date" },
    { key: "productionNotes", label: "Ghi chú sản xuất", type: "textarea" },
  ],
  [
    { key: "inspectionDecisionNumber", label: "Số quyết định nghiệm thu", type: "text", required: true },
    { key: "inspectionDecisionDate", label: "Ngày quyết định nghiệm thu", type: "date", required: true },
    { key: "inspectionNotes", label: "Ghi chú nghiệm thu", type: "textarea" },
  ],
  [
    { key: "equipDecisionNumber", label: "Số quyết định trang bị", type: "text", required: true },
    { key: "equipDecisionDate", label: "Ngày quyết định trang bị", type: "date", required: true },
    { key: "equipNotes", label: "Ghi chú trang bị", type: "textarea" },
  ],
];

/** Trường header phiếu bàn giao — đồng bộ backend HANDOVER_ENTITY_FIELD_SCHEMA */
export const HANDOVER_ENTITY_FIELD_SCHEMA: FieldDef[] = [
  { key: "contractId", label: "Hợp đồng", type: "select", dataSource: "contract", required: true },
  { key: "productCount", label: "Số sản phẩm", type: "text", dataSource: "readonly_text" },
  { key: "status", label: "Trạng thái", type: "select", dataSource: "handover_status" },
  { key: "startDate", label: "Ngày bắt đầu", type: "date" },
  { key: "dueDate", label: "Hạn hoàn thành", type: "date" },
];

export function getModuleEntityFieldTemplate(moduleKey: string): FieldDef[] {
  if (moduleKey === "handover") {
    return HANDOVER_ENTITY_FIELD_SCHEMA.map((f) => ({ ...f }));
  }
  return [];
}

const MODULE_MAP: Record<string, FieldDef[][]> = {
  handover: HANDOVER_STEP_SCHEMAS,
  contract: CONTRACT_STEP_SCHEMAS,
  warranty: WARRANTY_STEP_SCHEMAS,
  product: PRODUCT_STEP_SCHEMAS,
  training: TRAINING_STEP_SCHEMAS,
  coaching: COACHING_STEP_SCHEMAS,
};

/** Field mẫu theo vị trí bước (0-based) — đồng bộ các màn BG/HĐ/BH */
export function getModuleStepFieldTemplate(moduleKey: string, stepIndex: number): FieldDef[] {
  const templates = MODULE_MAP[moduleKey];
  if (!templates || stepIndex < 0 || stepIndex >= templates.length) return [];
  return templates[stepIndex]!.map((f) => ({ ...f }));
}

/** Bước chuẩn (tên + field) giống luồng trên màn nghiệp vụ */
export type ModuleStandardStep = {
  order: number;
  name: string;
  actionCode: string;
  roleCode: string;
  slaHours: number;
  phaseCode: string;
  requireDocument?: boolean;
  description?: string;
  fieldSchema: FieldDef[];
};

const HANDOVER_STANDARD_STEPS: Omit<ModuleStandardStep, "fieldSchema">[] = [
  { order: 10, name: "Lập Kế hoạch BG", actionCode: "submit", roleCode: "technician", slaHours: 48, phaseCode: "handover" },
  {
    order: 20,
    name: "Lập Tờ trình kinh phí",
    actionCode: "approve",
    roleCode: "manager",
    slaHours: 72,
    phaseCode: "handover",
    requireDocument: true,
    description: "Gợi ý: TTr xin KP BG",
  },
  {
    order: 30,
    name: "Chuẩn bị hàng hóa",
    actionCode: "approve",
    roleCode: "technician",
    slaHours: 120,
    phaseCode: "handover",
    requireDocument: true,
    description: "Gợi ý: Checklist kiểm tra ĐK · bảo dưỡng · Hợp đồng",
  },
  {
    order: 40,
    name: "QT huấn luyện",
    actionCode: "approve",
    roleCode: "manager",
    slaHours: 168,
    phaseCode: "training",
    requireDocument: true,
    description: "Gợi ý: KH HL · TTr HL · BBBG tạm · Báo cáo KT · QĐ công nhận KQ HL",
  },
  {
    order: 50,
    name: "Bàn giao chính thức",
    actionCode: "release",
    roleCode: "manager",
    slaHours: 48,
    phaseCode: "handover",
    requireDocument: true,
    description: "Gợi ý: BBBG cuối cùng",
  },
];

const WARRANTY_STANDARD_STEPS: Omit<ModuleStandardStep, "fieldSchema">[] = [
  { order: 10, name: "Tiếp nhận yêu cầu", actionCode: "submit", roleCode: "technician", slaHours: 8, phaseCode: "warranty" },
  {
    order: 20,
    name: "Phân tích, đề xuất PA và KH BHSC",
    actionCode: "approve",
    roleCode: "technician",
    slaHours: 48,
    phaseCode: "warranty",
    requireDocument: true,
  },
  { order: 30, name: "Thực hiện BHSC", actionCode: "approve", roleCode: "technician", slaHours: 72, phaseCode: "warranty", requireDocument: true },
  { order: 40, name: "Kiểm tra sau BHSC", actionCode: "approve", roleCode: "manager", slaHours: 24, phaseCode: "warranty" },
  { order: 50, name: "Bàn giao SP cho KH", actionCode: "release", roleCode: "technician", slaHours: 24, phaseCode: "warranty" },
];

const CONTRACT_STANDARD_STEPS: Omit<ModuleStandardStep, "fieldSchema">[] = [
  { order: 10, name: "Kế hoạch bàn giao", actionCode: "submit", roleCode: "technician", slaHours: 48, phaseCode: "handover" },
  { order: 20, name: "Tờ trình kinh phí", actionCode: "approve", roleCode: "manager", slaHours: 72, phaseCode: "handover", requireDocument: true },
  { order: 30, name: "Chuẩn bị hàng hóa", actionCode: "approve", roleCode: "technician", slaHours: 120, phaseCode: "handover", requireDocument: true },
  { order: 40, name: "Huấn luyện", actionCode: "approve", roleCode: "manager", slaHours: 168, phaseCode: "training", requireDocument: true },
  { order: 50, name: "Bàn giao chính thức", actionCode: "release", roleCode: "manager", slaHours: 48, phaseCode: "handover", requireDocument: true },
];

const COACHING_STANDARD_STEPS: Omit<ModuleStandardStep, "fieldSchema">[] = [
  { order: 10, name: "Lập kế hoạch huấn luyện", actionCode: "submit", roleCode: "technician", slaHours: 48, phaseCode: "training" },
  {
    order: 20,
    name: "Phê duyệt tờ trình HL",
    actionCode: "approve",
    roleCode: "manager",
    slaHours: 72,
    phaseCode: "training",
    requireDocument: true,
  },
  {
    order: 30,
    name: "Báo cáo và công nhận KQ",
    actionCode: "release",
    roleCode: "manager",
    slaHours: 48,
    phaseCode: "training",
    requireDocument: true,
  },
];

const TRAINING_STANDARD_STEPS: Omit<ModuleStandardStep, "fieldSchema">[] = [
  { order: 10, name: "Lên kế hoạch khoá đào tạo", actionCode: "submit", roleCode: "manager", slaHours: 48, phaseCode: "training" },
  {
    order: 20,
    name: "Phê duyệt nội dung",
    actionCode: "approve",
    roleCode: "admin",
    slaHours: 48,
    phaseCode: "training",
    requireDocument: true,
  },
  { order: 30, name: "Tổng kết và đóng khoá", actionCode: "release", roleCode: "manager", slaHours: 24, phaseCode: "training" },
];

const PRODUCT_STANDARD_STEPS: Omit<ModuleStandardStep, "fieldSchema">[] = [
  { order: 10, name: "Đang sản xuất", actionCode: "submit", roleCode: "technician", slaHours: 0, phaseCode: "product" },
  {
    order: 20,
    name: "Nghiệm thu cấp Bộ",
    actionCode: "approve",
    roleCode: "admin",
    slaHours: 168,
    phaseCode: "product",
    requireDocument: true,
  },
  {
    order: 30,
    name: "Đưa vào trang bị",
    actionCode: "release",
    roleCode: "admin",
    slaHours: 168,
    phaseCode: "product",
    requireDocument: true,
  },
];

const STANDARD_STEP_META: Record<string, Omit<ModuleStandardStep, "fieldSchema">[]> = {
  handover: HANDOVER_STANDARD_STEPS,
  warranty: WARRANTY_STANDARD_STEPS,
  contract: CONTRACT_STANDARD_STEPS,
  product: PRODUCT_STANDARD_STEPS,
  training: TRAINING_STANDARD_STEPS,
  coaching: COACHING_STANDARD_STEPS,
};

export function getModuleStandardSteps(moduleKey: string): ModuleStandardStep[] | null {
  const meta = STANDARD_STEP_META[moduleKey];
  if (!meta) return null;
  return meta.map((step, index) => ({
    ...step,
    fieldSchema: getModuleStepFieldTemplate(moduleKey, index),
  }));
}

export function getModuleStandardStepCount(moduleKey: string): number {
  return STANDARD_STEP_META[moduleKey]?.length ?? 0;
}
