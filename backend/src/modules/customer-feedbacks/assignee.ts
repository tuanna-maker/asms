import type { Prisma } from "@prisma/client";

import { HttpError } from "../../lib/errors/HttpError";
import { prisma } from "../../utils/prisma";

import { resolveUnitIdsForUser } from "./routing";

export type FeedbackAssigneeInput = {
  type: "user" | "role";
  userId?: string | null;
  roleCode?: string | null;
};

export function feedbackVisibilityRoles(): string[] {
  return ["admin", "manager"];
}

export function canViewAllFeedbacks(roleCode: string | null | undefined): boolean {
  if (!roleCode) return false;
  return feedbackVisibilityRoles().includes(roleCode);
}

export function buildAssigneeVisibilityFilter(viewer: {
  userId: string;
  roleCode: string | null;
}): Prisma.CustomerFeedbackWhereInput {
  if (canViewAllFeedbacks(viewer.roleCode)) {
    return {};
  }
  const or: Prisma.CustomerFeedbackWhereInput[] = [
    { assigneeType: "user", assignedUserId: viewer.userId },
    { createdById: viewer.userId },
  ];
  if (viewer.roleCode) {
    or.push({ assigneeType: "role", assignedRoleCode: viewer.roleCode });
  }
  return { OR: or };
}

/** Quyền xem: phân công trực tiếp, người tạo, hoặc đơn vị xử lý (routing). */
export async function buildFeedbackAccessFilter(viewer: {
  userId: string;
  roleCode: string | null;
}): Promise<Prisma.CustomerFeedbackWhereInput> {
  if (canViewAllFeedbacks(viewer.roleCode)) {
    return {};
  }
  const or = [...(buildAssigneeVisibilityFilter(viewer).OR ?? [])];
  const unitIds = await resolveUnitIdsForUser(viewer.userId, viewer.roleCode);
  if (unitIds.length > 0) {
    or.push({ assignments: { some: { unitId: { in: unitIds } } } });
  }
  return { OR: or };
}

export async function validateAndNormalizeAssignee(
  input: FeedbackAssigneeInput | null | undefined,
): Promise<{
  assigneeType: string | null;
  assignedUserId: string | null;
  assignedRoleCode: string | null;
}> {
  if (!input) {
    return { assigneeType: null, assignedUserId: null, assignedRoleCode: null };
  }
  if (input.type === "user") {
    const userId = input.userId?.trim();
    if (!userId) throw new HttpError(400, "Vui lòng chọn người được phân công");
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null, status: "active" },
      select: { id: true },
    });
    if (!user) throw new HttpError(400, "Người phân công không hợp lệ");
    return { assigneeType: "user", assignedUserId: user.id, assignedRoleCode: null };
  }
  if (input.type === "role") {
    const roleCode = input.roleCode?.trim();
    if (!roleCode) throw new HttpError(400, "Vui lòng chọn vai trò phân công");
    const role = await prisma.role.findFirst({
      where: { code: roleCode, deletedAt: null, isActive: true },
      select: { code: true },
    });
    if (!role) throw new HttpError(400, "Vai trò phân công không hợp lệ");
    return { assigneeType: "role", assignedUserId: null, assignedRoleCode: role.code };
  }
  throw new HttpError(400, "Phân công không hợp lệ");
}

export async function resolveUserIdsForAssignee(input: {
  assigneeType: string | null;
  assignedUserId: string | null;
  assignedRoleCode: string | null;
}): Promise<string[]> {
  if (input.assigneeType === "user" && input.assignedUserId) {
    return [input.assignedUserId];
  }
  if (input.assigneeType === "role" && input.assignedRoleCode) {
    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        status: "active",
        role: { code: input.assignedRoleCode, deletedAt: null, isActive: true },
      },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }
  return [];
}

export function applyAssigneeToPrismaUpdate(
  data: Prisma.CustomerFeedbackUpdateInput,
  assignee: {
    assigneeType: string | null;
    assignedUserId: string | null;
    assignedRoleCode: string | null;
  },
): void {
  data.assigneeType = assignee.assigneeType;
  data.assignedRoleCode = assignee.assignedRoleCode;
  if (assignee.assigneeType === "user" && assignee.assignedUserId) {
    data.assignedUser = { connect: { id: assignee.assignedUserId } };
  } else {
    data.assignedUser = { disconnect: true };
  }
}

export function formatAssigneeLabel(row: {
  assigneeType: string | null;
  assignedUser?: { fullName: string } | null;
  assignedRoleCode: string | null;
}): string {
  if (row.assigneeType === "user" && row.assignedUser) {
    return row.assignedUser.fullName;
  }
  if (row.assigneeType === "role" && row.assignedRoleCode) {
    return `Vai trò: ${row.assignedRoleCode}`;
  }
  return "—";
}
