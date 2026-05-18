import { Prisma } from "@prisma/client";

import { HttpError } from "../../lib/errors/HttpError";
import { prisma } from "../../utils/prisma";
import { assertActiveDefinitionCode } from "../definitions/assert-active-code";

const SELECT_STEP = {
  id: true,
  workflowId: true,
  order: true,
  name: true,
  actionCode: true,
  roleCode: true,
  slaHours: true,
  description: true,
  phaseCode: true,
  requireDocument: true,
  fieldSchema: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.WorkflowStepSelect;

const SELECT_WORKFLOW_BASE = {
  id: true,
  code: true,
  name: true,
  moduleKey: true,
  description: true,
  isActive: true,
  isSystem: true,
  entityFieldSchema: true,
  createdAt: true,
  updatedAt: true,
  createdBy: { select: { id: true, fullName: true } },
  updatedBy: { select: { id: true, fullName: true } },
} satisfies Prisma.WorkflowDefinitionSelect;

const SELECT_WORKFLOW_DETAIL = {
  ...SELECT_WORKFLOW_BASE,
  steps: { select: SELECT_STEP, orderBy: { order: "asc" as const } },
} satisfies Prisma.WorkflowDefinitionSelect;

function toFieldSchemaJson(
  value: Prisma.InputJsonValue | null,
): Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue {
  return value === null ? Prisma.JsonNull : value;
}

async function assertRoleExists(roleCode: string) {
  const role = await prisma.role.findUnique({ where: { code: roleCode } });
  if (!role) {
    throw new HttpError(400, `Vai trò «${roleCode}» chưa tồn tại trong hệ thống.`);
  }
  if (role.deletedAt || !role.isActive) {
    throw new HttpError(400, `Vai trò «${roleCode}» đã bị tắt — chọn vai trò khác.`);
  }
}

export async function listWorkflowsService(moduleKey?: string) {
  const rows = await prisma.workflowDefinition.findMany({
    where: {
      deletedAt: null,
      ...(moduleKey ? { moduleKey } : {}),
    },
    orderBy: [{ moduleKey: "asc" }, { createdAt: "asc" }],
    select: {
      ...SELECT_WORKFLOW_BASE,
      steps: { select: { id: true, slaHours: true } },
    },
  });
  return rows.map((row) => {
    const stepCount = row.steps.length;
    const totalSla = row.steps.reduce((sum, s) => sum + (s.slaHours ?? 0), 0);
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      moduleKey: row.moduleKey,
      description: row.description,
      isActive: row.isActive,
      isSystem: row.isSystem,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      createdBy: row.createdBy,
      updatedBy: row.updatedBy,
      stepCount,
      totalSlaHours: totalSla,
    };
  });
}

export async function getWorkflowDetailService(id: string) {
  const row = await prisma.workflowDefinition.findFirst({
    where: { id, deletedAt: null },
    select: SELECT_WORKFLOW_DETAIL,
  });
  if (!row) throw new HttpError(404, "Không tìm thấy quy trình");
  return row;
}

export async function createWorkflowService(input: {
  code: string;
  name: string;
  moduleKey: string;
  description?: string | null;
  isActive?: boolean;
  actorId?: string | null;
}) {
  const code = input.code.trim();
  const dup = await prisma.workflowDefinition.findFirst({ where: { code, deletedAt: null } });
  if (dup) throw new HttpError(409, "Mã quy trình đã tồn tại");
  const row = await prisma.workflowDefinition.create({
    data: {
      code,
      name: input.name.trim(),
      moduleKey: input.moduleKey,
      description: input.description ?? null,
      isActive: input.isActive ?? true,
      ...(input.actorId ? { createdById: input.actorId, updatedById: input.actorId } : {}),
    },
    select: SELECT_WORKFLOW_DETAIL,
  });
  return row;
}

export async function updateWorkflowService(
  id: string,
  input: {
    code?: string;
    name?: string;
    moduleKey?: string;
    description?: string | null;
    isActive?: boolean;
    entityFieldSchema?: Prisma.InputJsonValue | null;
    actorId?: string | null;
  },
) {
  const row = await prisma.workflowDefinition.findFirst({ where: { id, deletedAt: null } });
  if (!row) throw new HttpError(404, "Không tìm thấy quy trình");

  if (row.isSystem) {
    if (input.code !== undefined && input.code.trim() !== row.code) {
      throw new HttpError(400, "Không thể đổi mã của quy trình hệ thống");
    }
    if (input.moduleKey !== undefined && input.moduleKey !== row.moduleKey) {
      throw new HttpError(400, "Không thể đổi nhóm của quy trình hệ thống");
    }
  }

  const codeNew = input.code !== undefined ? input.code.trim() : row.code;
  if (codeNew !== row.code) {
    const dup = await prisma.workflowDefinition.findFirst({
      where: { code: codeNew, deletedAt: null, NOT: { id } },
    });
    if (dup) throw new HttpError(409, "Mã quy trình đã tồn tại");
  }

  const data: Prisma.WorkflowDefinitionUpdateInput = {
    code: codeNew,
    ...(input.name !== undefined ? { name: input.name.trim() } : {}),
    ...(input.moduleKey !== undefined ? { moduleKey: input.moduleKey } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    ...(input.entityFieldSchema !== undefined
      ? { entityFieldSchema: toFieldSchemaJson(input.entityFieldSchema) }
      : {}),
    ...(input.actorId ? { updatedBy: { connect: { id: input.actorId } } } : {}),
  };

  const updated = await prisma.workflowDefinition.update({
    where: { id },
    data,
    select: SELECT_WORKFLOW_DETAIL,
  });
  return updated;
}

export async function softDeleteWorkflowService(id: string) {
  const row = await prisma.workflowDefinition.findFirst({ where: { id, deletedAt: null } });
  if (!row) throw new HttpError(404, "Không tìm thấy quy trình");
  if (row.isSystem) throw new HttpError(400, "Không thể xoá quy trình hệ thống. Hãy tắt thay vì xoá.");

  const running = await prisma.workflowInstance.count({
    where: { workflowId: id, status: "running" },
  });
  if (running > 0) {
    throw new HttpError(409, `Còn ${running} phiếu đang chạy theo quy trình — không thể xoá.`);
  }

  await prisma.workflowDefinition.update({ where: { id }, data: { deletedAt: new Date() } });
  return { id };
}

async function nextOrder(workflowId: string): Promise<number> {
  const last = await prisma.workflowStep.findFirst({
    where: { workflowId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  return (last?.order ?? 0) + 10;
}

export async function addStepService(
  workflowId: string,
  input: {
    name: string;
    actionCode: string;
    roleCode: string;
    slaHours?: number | null;
    description?: string | null;
    phaseCode?: string;
    requireDocument?: boolean;
    fieldSchema?: Prisma.InputJsonValue | null;
  },
) {
  const wf = await prisma.workflowDefinition.findFirst({ where: { id: workflowId, deletedAt: null } });
  if (!wf) throw new HttpError(404, "Không tìm thấy quy trình");
  await assertActiveDefinitionCode("workflow_step_action", input.actionCode, "Hành động bước");
  await assertRoleExists(input.roleCode);
  if (input.phaseCode !== undefined) {
    await assertActiveDefinitionCode("workflow_phase", input.phaseCode, "Giai đoạn");
  }

  const step = await prisma.workflowStep.create({
    data: {
      workflowId,
      order: await nextOrder(workflowId),
      name: input.name.trim(),
      actionCode: input.actionCode,
      roleCode: input.roleCode,
      slaHours: input.slaHours ?? null,
      description: input.description ?? null,
      ...(input.phaseCode !== undefined ? { phaseCode: input.phaseCode } : {}),
      ...(input.requireDocument !== undefined ? { requireDocument: input.requireDocument } : {}),
      ...(input.fieldSchema !== undefined
        ? { fieldSchema: toFieldSchemaJson(input.fieldSchema) }
        : {}),
    },
    select: SELECT_STEP,
  });
  return step;
}

export async function updateStepService(
  workflowId: string,
  stepId: string,
  input: {
    name?: string;
    actionCode?: string;
    roleCode?: string;
    slaHours?: number | null;
    description?: string | null;
    phaseCode?: string;
    requireDocument?: boolean;
    fieldSchema?: Prisma.InputJsonValue | null;
  },
) {
  const step = await prisma.workflowStep.findFirst({ where: { id: stepId, workflowId } });
  if (!step) throw new HttpError(404, "Không tìm thấy bước trong quy trình");

  if (input.actionCode !== undefined) {
    await assertActiveDefinitionCode("workflow_step_action", input.actionCode, "Hành động bước");
  }
  if (input.roleCode !== undefined) {
    await assertRoleExists(input.roleCode);
  }
  if (input.phaseCode !== undefined) {
    await assertActiveDefinitionCode("workflow_phase", input.phaseCode, "Giai đoạn");
  }

  const updated = await prisma.workflowStep.update({
    where: { id: stepId },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.actionCode !== undefined ? { actionCode: input.actionCode } : {}),
      ...(input.roleCode !== undefined ? { roleCode: input.roleCode } : {}),
      ...(input.slaHours !== undefined ? { slaHours: input.slaHours } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.phaseCode !== undefined ? { phaseCode: input.phaseCode } : {}),
      ...(input.requireDocument !== undefined ? { requireDocument: input.requireDocument } : {}),
      ...(input.fieldSchema !== undefined
        ? { fieldSchema: toFieldSchemaJson(input.fieldSchema) }
        : {}),
    },
    select: SELECT_STEP,
  });
  return updated;
}

export async function deleteStepService(workflowId: string, stepId: string) {
  const step = await prisma.workflowStep.findFirst({ where: { id: stepId, workflowId } });
  if (!step) throw new HttpError(404, "Không tìm thấy bước trong quy trình");

  const usingInstances = await prisma.workflowInstance.count({
    where: { currentStepId: stepId, status: "running" },
  });
  if (usingInstances > 0) {
    throw new HttpError(
      409,
      `Còn ${usingInstances} phiếu đang ở bước này — chuyển sang bước khác trước khi xoá.`,
    );
  }

  await prisma.workflowStep.delete({ where: { id: stepId } });
  return { id: stepId };
}

export async function reorderStepsService(
  workflowId: string,
  items: Array<{ id: string; order: number }>,
) {
  if (items.length === 0) return { count: 0 };
  const ids = items.map((i) => i.id);
  const rows = await prisma.workflowStep.findMany({
    where: { workflowId, id: { in: ids } },
    select: { id: true },
  });
  if (rows.length !== ids.length) {
    throw new HttpError(404, "Có bước không tồn tại trong quy trình này");
  }

  // Two-phase: dùng offset lớn để tránh đụng unique (workflowId, order).
  const OFFSET = 100000;
  await prisma.$transaction([
    ...items.map((it) =>
      prisma.workflowStep.update({
        where: { id: it.id },
        data: { order: it.order + OFFSET },
      }),
    ),
    ...items.map((it) =>
      prisma.workflowStep.update({
        where: { id: it.id },
        data: { order: it.order },
      }),
    ),
  ]);
  return { count: items.length };
}
