import type {
  ContractStatus,
  DataDefinition,
  HandoverStatus,
  MaterialTransferStatus,
  MaterialTransferType,
  MaterialType,
  Prisma,
  ProductStatus,
  TaskStatus,
  TaskType,
  TrainingStatus,
  WarrantyType,
} from "@prisma/client";

import { HttpError } from "../../lib/errors/HttpError";
import { prisma } from "../../utils/prisma";

type RowWithMeta = DataDefinition & {
  createdBy: { id: string; fullName: string } | null;
  updatedBy: { id: string; fullName: string } | null;
};

export type DefinitionDTO = Pick<
  DataDefinition,
  | "id"
  | "category"
  | "code"
  | "label"
  | "sortOrder"
  | "isActive"
  | "isSystem"
  | "createdAt"
  | "updatedAt"
> & {
  createdBy: { id: string; fullName: string } | null;
  updatedBy: { id: string; fullName: string } | null;
};

function toDTO(row: RowWithMeta): DefinitionDTO {
  return {
    id: row.id,
    category: row.category,
    code: row.code,
    label: row.label,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    isSystem: row.isSystem,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

const selectWithMeta = {
  id: true,
  category: true,
  code: true,
  label: true,
  sortOrder: true,
  isActive: true,
  isSystem: true,
  createdById: true,
  updatedById: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  createdBy: { select: { id: true, fullName: true } },
  updatedBy: { select: { id: true, fullName: true } },
} satisfies Prisma.DataDefinitionSelect;

export async function listDefinitionsService(params: {
  category: string;
  includeInactive: boolean;
}): Promise<DefinitionDTO[]> {
  const rows = await prisma.dataDefinition.findMany({
    where: {
      deletedAt: null,
      category: params.category,
      ...(params.includeInactive ? {} : { isActive: true }),
    },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    select: selectWithMeta,
  });
  return rows.map((row) => toDTO(row as unknown as RowWithMeta));
}

export async function createDefinitionService(input: {
  category: string;
  code: string;
  label: string;
  sortOrder?: number;
  isActive?: boolean;
  actorId?: string | null;
}): Promise<DefinitionDTO> {
  const existing = await prisma.dataDefinition.findFirst({
    where: { category: input.category, code: input.code.trim(), deletedAt: null },
  });
  if (existing) throw new HttpError(409, "Đã tồn tại giá trị với nhóm và mã này");

  const row = await prisma.dataDefinition.create({
    data: {
      category: input.category.trim(),
      code: input.code.trim(),
      label: input.label.trim(),
      sortOrder: input.sortOrder ?? 0,
      ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
      ...(input.actorId ? { createdById: input.actorId, updatedById: input.actorId } : {}),
    },
    select: selectWithMeta,
  });
  return toDTO(row as unknown as RowWithMeta);
}

export async function updateDefinitionService(
  id: string,
  input: {
    code?: string;
    label?: string;
    sortOrder?: number;
    isActive?: boolean;
    actorId?: string | null;
  }
): Promise<DefinitionDTO> {
  const row = await prisma.dataDefinition.findFirst({ where: { id, deletedAt: null } });
  if (!row) throw new HttpError(404, "Không tìm thấy định nghĩa");

  const codeNew = input.code !== undefined ? input.code.trim() : row.code;
  if (codeNew !== row.code) {
    const dup = await prisma.dataDefinition.findFirst({
      where: { category: row.category, code: codeNew, deletedAt: null, NOT: { id } },
    });
    if (dup) throw new HttpError(409, "Mã đã được dùng trong nhóm này");
  }

  const labelNew = input.label !== undefined ? input.label.trim() : row.label;
  const updated = await prisma.dataDefinition.update({
    where: { id },
    data: {
      code: codeNew,
      label: labelNew,
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.actorId ? { updatedById: input.actorId } : {}),
    },
    select: selectWithMeta,
  });
  return toDTO(updated as unknown as RowWithMeta);
}

export async function softDeleteDefinitionService(id: string): Promise<{ id: string }> {
  const row = await prisma.dataDefinition.findFirst({ where: { id, deletedAt: null } });
  if (!row) throw new HttpError(404, "Không tìm thấy định nghĩa");

  const usage = await countDefinitionUsage(row.category, row.code);
  if (usage.count > 0) {
    throw new HttpError(
      409,
      `Còn ${usage.count} bản ghi đang dùng giá trị này. Vui lòng chuyển sang định nghĩa khác trước khi xoá.`
    );
  }

  await prisma.dataDefinition.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  return { id };
}

/**
 * Bảng tham chiếu: từ `category` → các bảng/cột sử dụng mã.
 *
 * Khi convert thêm enum sang DataDefinition cần bổ sung mục tương ứng để cảnh báo
 * không xoá nhầm.
 */
const USAGE_TARGETS: Record<string, Array<{ entity: string; count: (code: string) => Promise<number> }>> = {
  warehouse: [
    {
      entity: "Vật tư",
      count: (code) => prisma.material.count({ where: { warehouse: code, deletedAt: null } }),
    },
  ],
  material_unit: [
    {
      entity: "Vật tư",
      count: (code) => prisma.material.count({ where: { unit: code, deletedAt: null } }),
    },
  ],
  contract_type: [
    {
      entity: "Hợp đồng",
      count: (code) =>
        prisma.contract.count({ where: { contractTypeCode: code, deletedAt: null } }),
    },
  ],
  contract_status: [
    {
      entity: "Hợp đồng",
      count: (code) =>
        prisma.contract.count({
          where: { status: code as ContractStatus, deletedAt: null },
        }),
    },
  ],
  warranty_priority: [
    {
      entity: "Phiếu bảo hành",
      count: (code) => prisma.warranty.count({ where: { priorityCode: code, deletedAt: null } }),
    },
  ],
  warranty_status: [
    {
      entity: "Phiếu bảo hành",
      count: (code) => prisma.warranty.count({ where: { statusCode: code, deletedAt: null } }),
    },
  ],
  warranty_ticket_type: [
    {
      entity: "Phiếu bảo hành",
      count: (code) =>
        prisma.warranty.count({
          where: { type: code as WarrantyType, deletedAt: null },
        }),
    },
  ],
  task_priority: [
    {
      entity: "Công việc",
      count: (code) => prisma.task.count({ where: { priorityCode: code, deletedAt: null } }),
    },
  ],
  task_status: [
    {
      entity: "Công việc",
      count: (code) =>
        prisma.task.count({
          where: { status: code as TaskStatus, deletedAt: null },
        }),
    },
  ],
  task_type: [
    {
      entity: "Công việc",
      count: (code) =>
        prisma.task.count({
          where: { type: code as TaskType, deletedAt: null },
        }),
    },
  ],
  training_type: [
    {
      entity: "Khoá đào tạo",
      count: (code) =>
        prisma.trainingCourse.count({ where: { typeCode: code, deletedAt: null } }),
    },
  ],
  training_status: [
    {
      entity: "Khoá đào tạo",
      count: (code) =>
        prisma.trainingCourse.count({
          where: { status: code as TrainingStatus, deletedAt: null },
        }),
    },
  ],
  research_stage: [
    {
      entity: "Đề tài",
      count: (code) =>
        prisma.researchProject.count({ where: { stageCode: code, deletedAt: null } }),
    },
  ],
  document_type: [
    {
      entity: "Tài liệu",
      count: (code) => prisma.document.count({ where: { categoryCode: code, deletedAt: null } }),
    },
  ],
  handover_type: [
    {
      entity: "Phiếu bàn giao",
      count: (code) => prisma.handover.count({ where: { typeCode: code, deletedAt: null } }),
    },
  ],
  handover_status: [
    {
      entity: "Phiếu bàn giao",
      count: (code) =>
        prisma.handover.count({
          where: { status: code as HandoverStatus, deletedAt: null },
        }),
    },
  ],
  customer_source: [
    {
      entity: "Khách hàng",
      count: (code) => prisma.customer.count({ where: { sourceCode: code, deletedAt: null } }),
    },
  ],
  company_type: [
    {
      entity: "Khách hàng",
      count: (code) =>
        prisma.customer.count({ where: { companyTypeCode: code, deletedAt: null } }),
    },
  ],
  product_category: [
    {
      entity: "Sản phẩm",
      count: (code) => prisma.product.count({ where: { category: code, deletedAt: null } }),
    },
  ],
  product_status: [
    {
      entity: "Sản phẩm",
      count: (code) =>
        prisma.product.count({
          where: { status: code as ProductStatus, deletedAt: null },
        }),
    },
  ],
  material_type: [
    {
      entity: "Vật tư",
      count: (code) =>
        prisma.material.count({
          where: { type: code as MaterialType, deletedAt: null },
        }),
    },
  ],
  material_transfer_type: [
    {
      entity: "Phiếu điều chuyển",
      count: (code) =>
        prisma.materialTransfer.count({
          where: { type: code as MaterialTransferType, deletedAt: null },
        }),
    },
  ],
  material_transfer_status: [
    {
      entity: "Phiếu điều chuyển",
      count: (code) =>
        prisma.materialTransfer.count({
          where: { status: code as MaterialTransferStatus, deletedAt: null },
        }),
    },
  ],
  workflow_step_action: [
    {
      entity: "Bước quy trình",
      count: (code) =>
        prisma.workflowStep.count({
          where: { actionCode: code, workflow: { deletedAt: null } },
        }),
    },
  ],
  workflow_phase: [
    {
      entity: "Bước quy trình",
      count: (code) =>
        prisma.workflowStep.count({
          where: { phaseCode: code, workflow: { deletedAt: null } },
        }),
    },
  ],
};

export async function countDefinitionUsage(
  category: string,
  code: string,
): Promise<{ count: number; breakdown: Array<{ entity: string; count: number }> }> {
  const targets = USAGE_TARGETS[category] ?? [];
  const breakdown = await Promise.all(
    targets.map(async (t) => ({ entity: t.entity, count: await t.count(code) })),
  );
  const filtered = breakdown.filter((b) => b.count > 0);
  return {
    count: filtered.reduce((s, b) => s + b.count, 0),
    breakdown: filtered,
  };
}

export async function getDefinitionUsageService(id: string) {
  const row = await prisma.dataDefinition.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, category: true, code: true, label: true, isSystem: true },
  });
  if (!row) throw new HttpError(404, "Không tìm thấy định nghĩa");
  const usage = await countDefinitionUsage(row.category, row.code);
  return { id: row.id, category: row.category, code: row.code, label: row.label, isSystem: row.isSystem, ...usage };
}

export async function reorderDefinitionsService(input: {
  category: string;
  items: Array<{ id: string; sortOrder: number }>;
  actorId?: string | null;
}) {
  if (input.items.length === 0) return { count: 0 };
  const ids = input.items.map((i) => i.id);
  const rows = await prisma.dataDefinition.findMany({
    where: { id: { in: ids }, deletedAt: null },
    select: { id: true, category: true },
  });
  if (rows.length !== ids.length) throw new HttpError(404, "Có định nghĩa không tồn tại");
  for (const r of rows) {
    if (r.category !== input.category) {
      throw new HttpError(400, "Tất cả định nghĩa phải cùng một nhóm");
    }
  }

  await prisma.$transaction(
    input.items.map((it) =>
      prisma.dataDefinition.update({
        where: { id: it.id },
        data: {
          sortOrder: it.sortOrder,
          ...(input.actorId ? { updatedById: input.actorId } : {}),
        },
      }),
    ),
  );
  return { count: input.items.length };
}
