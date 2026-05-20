/** Template fieldSchema theo chỉ số bước (0-based) cho từng module */

export type FieldSchemaTemplate = {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "date" | "select" | "boolean";
  required?: boolean;
  placeholder?: string;
  definitionCategory?: string;
  dataSource?: "contract" | "handover_status" | "readonly_text";
  options?: Array<{ value: string; label: string }>;
  showWhen?: { field: string; value: string | string[] };
};

/** Trường header phiếu bàn giao (màn BG & HL) */
export const HANDOVER_ENTITY_FIELD_SCHEMA: FieldSchemaTemplate[] = [
  { key: "contractId", label: "Hợp đồng", type: "select", dataSource: "contract", required: true },
  { key: "productCount", label: "Số sản phẩm", type: "text", dataSource: "readonly_text" },
  {
    key: "status",
    label: "Trạng thái",
    type: "select",
    dataSource: "handover_status",
  },
  { key: "startDate", label: "Ngày bắt đầu", type: "date" },
  { key: "dueDate", label: "Hạn hoàn thành", type: "date" },
];

const GENERIC_NOTES: FieldSchemaTemplate[] = [
  { key: "notes", label: "Ghi chú bước", type: "textarea" },
];

export const HANDOVER_STEP_SCHEMAS: FieldSchemaTemplate[][] = [
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

export const CONTRACT_STEP_SCHEMAS: FieldSchemaTemplate[][] = [
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

export const WARRANTY_STEP_SCHEMAS: FieldSchemaTemplate[][] = [
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

export const COACHING_STEP_SCHEMAS: FieldSchemaTemplate[][] = [
  [
    { key: "trainingPlanNote", label: "Kế hoạch huấn luyện", type: "textarea" },
    { key: "tempHandoverNote", label: "Ghi chú BBBG tạm (tùy chọn)", type: "textarea" },
  ],
  [
    { key: "trainingCostReport", label: "Tờ trình huấn luyện", type: "textarea" },
  ],
  [
    { key: "trainingReportNote", label: "Báo cáo KT thực hành", type: "textarea" },
    { key: "trainingDecision", label: "QĐ công nhận KQ huấn luyện", type: "textarea" },
  ],
];

export const TRAINING_STEP_SCHEMAS: FieldSchemaTemplate[][] = [
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

export const PRODUCT_STEP_SCHEMAS: FieldSchemaTemplate[][] = [
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

export function schemaForStepIndex(
  templates: FieldSchemaTemplate[][],
  stepIndex: number,
): FieldSchemaTemplate[] {
  if (stepIndex < templates.length) return templates[stepIndex]!;
  return GENERIC_NOTES;
}
