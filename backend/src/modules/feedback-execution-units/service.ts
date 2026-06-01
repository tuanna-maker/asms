import { HttpError } from "../../lib/errors/HttpError";
import { prisma } from "../../utils/prisma";

import type { z } from "zod";
import type { createRoutingRuleSchema, createUnitSchema, updateRoutingRuleSchema, updateUnitSchema } from "./schema";

const unitSelect = {
  id: true,
  code: true,
  name: true,
  roleCodes: true,
  notifyUserIds: true,
  isActive: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
} as const;

const ruleSelect = {
  id: true,
  unitId: true,
  productId: true,
  productCategory: true,
  priority: true,
  createdAt: true,
  updatedAt: true,
  unit: { select: { id: true, code: true, name: true } },
} as const;

export async function listFeedbackExecutionUnitsService() {
  return prisma.feedbackExecutionUnit.findMany({
    where: { deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      ...unitSelect,
      routingRules: {
        where: { deletedAt: null },
        orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
        select: ruleSelect,
      },
    },
  });
}

async function assertNotifyUserIdsExist(userIds: string[]) {
  if (userIds.length === 0) return;
  const found = await prisma.user.count({
    where: { id: { in: userIds }, deletedAt: null },
  });
  if (found !== userIds.length) {
    throw new HttpError(400, "Một hoặc nhiều người nhận thông báo không tồn tại");
  }
}

export async function createFeedbackExecutionUnitService(
  payload: z.infer<typeof createUnitSchema>,
) {
  await assertNotifyUserIdsExist(payload.notifyUserIds ?? []);
  const exists = await prisma.feedbackExecutionUnit.findFirst({
    where: { code: payload.code, deletedAt: null },
  });
  if (exists) throw new HttpError(400, "Mã đơn vị đã tồn tại");
  return prisma.feedbackExecutionUnit.create({
    data: {
      code: payload.code.trim(),
      name: payload.name.trim(),
      roleCodes: payload.roleCodes,
      notifyUserIds: payload.notifyUserIds,
      isActive: payload.isActive,
      sortOrder: payload.sortOrder,
    },
    select: unitSelect,
  });
}

export async function updateFeedbackExecutionUnitService(
  id: string,
  payload: z.infer<typeof updateUnitSchema>,
) {
  const row = await prisma.feedbackExecutionUnit.findFirst({
    where: { id, deletedAt: null },
  });
  if (!row) throw new HttpError(404, "Không tìm thấy đơn vị");
  if (payload.notifyUserIds !== undefined) {
    await assertNotifyUserIdsExist(payload.notifyUserIds);
  }
  if (payload.code && payload.code !== row.code) {
    const dup = await prisma.feedbackExecutionUnit.findFirst({
      where: { code: payload.code, deletedAt: null, NOT: { id } },
    });
    if (dup) throw new HttpError(400, "Mã đơn vị đã tồn tại");
  }
  return prisma.feedbackExecutionUnit.update({
    where: { id },
    data: {
      ...(payload.code !== undefined ? { code: payload.code.trim() } : {}),
      ...(payload.name !== undefined ? { name: payload.name.trim() } : {}),
      ...(payload.roleCodes !== undefined ? { roleCodes: payload.roleCodes } : {}),
      ...(payload.notifyUserIds !== undefined ? { notifyUserIds: payload.notifyUserIds } : {}),
      ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
      ...(payload.sortOrder !== undefined ? { sortOrder: payload.sortOrder } : {}),
    },
    select: unitSelect,
  });
}

export async function deleteFeedbackExecutionUnitService(id: string) {
  const row = await prisma.feedbackExecutionUnit.findFirst({
    where: { id, deletedAt: null },
  });
  if (!row) throw new HttpError(404, "Không tìm thấy đơn vị");
  const now = new Date();
  await prisma.$transaction([
    prisma.feedbackProductRoutingRule.updateMany({
      where: { unitId: id, deletedAt: null },
      data: { deletedAt: now },
    }),
    prisma.feedbackExecutionUnit.update({
      where: { id },
      data: { deletedAt: now },
    }),
  ]);
  return { id };
}

export async function listRoutingRulesService(unitId?: string) {
  return prisma.feedbackProductRoutingRule.findMany({
    where: { deletedAt: null, ...(unitId ? { unitId } : {}) },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    select: ruleSelect,
  });
}

export async function createRoutingRuleService(payload: z.infer<typeof createRoutingRuleSchema>) {
  if (!payload.productId && !payload.productCategory) {
    throw new HttpError(400, "Cần chọn sản phẩm hoặc dòng sản phẩm");
  }
  const unit = await prisma.feedbackExecutionUnit.findFirst({
    where: { id: payload.unitId, deletedAt: null, isActive: true },
  });
  if (!unit) throw new HttpError(400, "Đơn vị không hợp lệ");
  return prisma.feedbackProductRoutingRule.create({
    data: {
      unitId: payload.unitId,
      productId: payload.productId ?? null,
      productCategory: payload.productCategory?.trim() || null,
      priority: payload.priority,
    },
    select: ruleSelect,
  });
}

export async function updateRoutingRuleService(
  ruleId: string,
  payload: z.infer<typeof updateRoutingRuleSchema>,
) {
  const row = await prisma.feedbackProductRoutingRule.findFirst({
    where: { id: ruleId, deletedAt: null },
  });
  if (!row) throw new HttpError(404, "Không tìm thấy rule");
  if (payload.productId === null && payload.productCategory === null) {
    throw new HttpError(400, "Cần chọn sản phẩm hoặc dòng sản phẩm");
  }
  return prisma.feedbackProductRoutingRule.update({
    where: { id: ruleId },
    data: {
      ...(payload.productId !== undefined ? { productId: payload.productId } : {}),
      ...(payload.productCategory !== undefined
        ? { productCategory: payload.productCategory?.trim() || null }
        : {}),
      ...(payload.priority !== undefined ? { priority: payload.priority } : {}),
    },
    select: ruleSelect,
  });
}

export async function deleteRoutingRuleService(ruleId: string) {
  const n = await prisma.feedbackProductRoutingRule.updateMany({
    where: { id: ruleId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  if (n.count === 0) throw new HttpError(404, "Không tìm thấy rule");
  return { id: ruleId };
}
