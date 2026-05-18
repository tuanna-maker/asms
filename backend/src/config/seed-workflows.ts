import { prisma } from "../utils/prisma";
import {
  HANDOVER_ENTITY_FIELD_SCHEMA,
  schemaForStepIndex,
  HANDOVER_STEP_SCHEMAS,
  CONTRACT_STEP_SCHEMAS,
  WARRANTY_STEP_SCHEMAS,
} from "./step-field-schema-templates";

const MODULE_STEP_TEMPLATES: Record<string, typeof HANDOVER_STEP_SCHEMAS> = {
  handover: HANDOVER_STEP_SCHEMAS,
  contract: CONTRACT_STEP_SCHEMAS,
  warranty: WARRANTY_STEP_SCHEMAS,
};

function fieldSchemaForModuleStep(moduleKey: string, stepIndex: number) {
  const templates = MODULE_STEP_TEMPLATES[moduleKey];
  if (!templates) return [];
  return schemaForStepIndex(templates, stepIndex);
}

type SeedStep = {
  order: number;
  name: string;
  actionCode: string;
  roleCode: string;
  slaHours?: number | null;
  description?: string | null;
  phaseCode?: "handover" | "training" | "warranty" | "other";
  requireDocument?: boolean;
};

type SeedWorkflow = {
  code: string;
  name: string;
  moduleKey: "handover" | "warranty" | "training" | "contract";
  description?: string | null;
  steps: SeedStep[];
};

const HANDOVER_K_STEPS: SeedStep[] = [
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
    description: "Gợi ý: KH HL · TTr HL (BDA) · Báo cáo KT thực hành · QĐ công nhận KQ HL",
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

const HANDOVER_H_STEPS: SeedStep[] = [
  {
    order: 10,
    name: "Lập Kế hoạch BG",
    actionCode: "submit",
    roleCode: "technician",
    slaHours: 48,
    phaseCode: "handover",
    requireDocument: true,
    description: "Gợi ý: KH Bàn giao",
  },
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
    description: "Gợi ý: Checklist kiểm tra ĐH",
  },
  {
    order: 40,
    name: "QT huấn luyện",
    actionCode: "approve",
    roleCode: "manager",
    slaHours: 168,
    phaseCode: "training",
    requireDocument: true,
    description: "Gợi ý: KH HL · TTr HL (T2) · BBBG tạm thời · Báo cáo KT thực hành · QĐ công nhận KQ HL",
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

const WORKFLOWS: SeedWorkflow[] = [
  {
    code: "WF_HANDOVER_DONG_K",
    name: "Bàn giao & HL — Dòng K (ví dụ)",
    moduleKey: "handover",
    description: "Quy trình mẫu 5 bước — tên «Dòng K» chỉ là ví dụ cấu hình, có thể đổi tên trong Quy trình.",
    steps: HANDOVER_K_STEPS,
  },
  {
    code: "WF_HANDOVER_DONG_H",
    name: "Bàn giao & HL — Dòng H (ví dụ)",
    moduleKey: "handover",
    description: "Quy trình mẫu 5 bước — tên «Dòng H» chỉ là ví dụ cấu hình, có thể đổi tên trong Quy trình.",
    steps: HANDOVER_H_STEPS,
  },
  {
    code: "WF_HANDOVER_DEFAULT",
    name: "Luồng phê duyệt bàn giao (cũ)",
    moduleKey: "handover",
    description: "Quy trình bàn giao thiết bị mặc định (4 bước) — giữ để tương thích.",
    steps: [
      { order: 10, name: "Lập phiếu bàn giao", actionCode: "submit", roleCode: "technician", slaHours: 24, phaseCode: "handover" },
      { order: 20, name: "Trưởng phòng phê duyệt", actionCode: "approve", roleCode: "manager", slaHours: 48, phaseCode: "handover", requireDocument: true },
      { order: 30, name: "Lãnh đạo ký duyệt", actionCode: "sign", roleCode: "admin", slaHours: 48, phaseCode: "handover" },
      { order: 40, name: "Ban hành văn bản", actionCode: "release", roleCode: "manager", slaHours: 24, phaseCode: "handover" },
    ],
  },
  {
    code: "WF_WARRANTY_DEFAULT",
    name: "Luồng xử lý bảo hành",
    moduleKey: "warranty",
    description:
      "Quy trình 5 giai đoạn BH/SC: tiếp nhận → phân tích/PA → thực hiện → kiểm tra sau → bàn giao.",
    steps: [
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
    ],
  },
  {
    code: "WF_TRAINING_DEFAULT",
    name: "Luồng tổ chức đào tạo",
    moduleKey: "training",
    description: "Quy trình tổ chức khoá đào tạo: lên kế hoạch → trưởng phòng phê duyệt → tổng kết.",
    steps: [
      { order: 10, name: "Lên kế hoạch khoá đào tạo", actionCode: "submit", roleCode: "manager", slaHours: 48, phaseCode: "training" },
      { order: 20, name: "Phê duyệt nội dung", actionCode: "approve", roleCode: "admin", slaHours: 48, phaseCode: "training", requireDocument: true },
      { order: 30, name: "Tổng kết và đóng khoá", actionCode: "release", roleCode: "manager", slaHours: 24, phaseCode: "training" },
    ],
  },
  {
    code: "WF_CONTRACT_DEFAULT",
    name: "Quy trình tổng hợp Hợp đồng",
    moduleKey: "contract",
    description: "Quy trình thống nhất cho một hợp đồng: bàn giao → huấn luyện → bảo hành.",
    steps: [
      { order: 10, name: "Bàn giao thiết bị", actionCode: "submit", roleCode: "technician", slaHours: 48, phaseCode: "handover" },
      { order: 20, name: "Trưởng phòng phê duyệt bàn giao", actionCode: "approve", roleCode: "manager", slaHours: 48, phaseCode: "handover", requireDocument: true },
      { order: 30, name: "Huấn luyện sử dụng", actionCode: "submit", roleCode: "manager", slaHours: 72, phaseCode: "training" },
      { order: 40, name: "Tổng kết khoá huấn luyện", actionCode: "release", roleCode: "manager", slaHours: 24, phaseCode: "training", requireDocument: true },
      { order: 50, name: "Bảo hành / hỗ trợ kỹ thuật", actionCode: "approve", roleCode: "technician", slaHours: 168, phaseCode: "warranty" },
      { order: 60, name: "Nghiệm thu kết thúc hợp đồng", actionCode: "release", roleCode: "admin", slaHours: 48, phaseCode: "warranty" },
    ],
  },
];

async function syncStepDescriptions(workflowId: string, steps: SeedStep[]) {
  const existingSteps = await prisma.workflowStep.findMany({
    where: { workflowId },
    select: { id: true, order: true },
  });
  for (const seedStep of steps) {
    if (!seedStep.description) continue;
    const row = existingSteps.find((s) => s.order === seedStep.order);
    if (!row) continue;
    await prisma.workflowStep.update({
      where: { id: row.id },
      data: { description: seedStep.description },
    });
  }
}

export async function seedWorkflows() {
  await prisma.workflowDefinition.updateMany({
    where: { code: "WF_HANDOVER_DEFAULT" },
    data: { isActive: false },
  });

  for (const wf of WORKFLOWS) {
    const existing = await prisma.workflowDefinition.findUnique({
      where: { code: wf.code },
      select: { id: true, isSystem: true },
    });
    if (existing) {
      if (!existing.isSystem) {
        await prisma.workflowDefinition.update({
          where: { id: existing.id },
          data: { isSystem: true, name: wf.name, description: wf.description ?? null },
        });
      }
      await syncStepDescriptions(existing.id, wf.steps);
      continue;
    }
    await prisma.workflowDefinition.create({
      data: {
        code: wf.code,
        name: wf.name,
        moduleKey: wf.moduleKey,
        description: wf.description ?? null,
        isActive: true,
        isSystem: true,
        ...(wf.moduleKey === "handover"
          ? { entityFieldSchema: HANDOVER_ENTITY_FIELD_SCHEMA }
          : {}),
        steps: {
          create: wf.steps.map((s, index) => ({
            order: s.order,
            name: s.name,
            actionCode: s.actionCode,
            roleCode: s.roleCode,
            slaHours: s.slaHours ?? null,
            description: s.description ?? null,
            phaseCode: s.phaseCode ?? "other",
            requireDocument: s.requireDocument ?? false,
            fieldSchema: fieldSchemaForModuleStep(wf.moduleKey, index),
          })),
        },
      },
    });
  }
}
