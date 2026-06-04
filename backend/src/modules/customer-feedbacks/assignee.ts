import type { Prisma } from "@prisma/client";

import { HttpError } from "../../lib/errors/HttpError";
import { prisma } from "../../utils/prisma";

/** @deprecated Dùng FeedbackAssigneesInput */
export type FeedbackAssigneeInput = {
  type: "user" | "role";
  userId?: string | null;
  roleCode?: string | null;
};

export type FeedbackAssigneesInput = {
  userIds: string[];
  roleCodes: string[];
};

export type NormalizedAssignees = {
  userIds: string[];
  roleCodes: string[];
  assigneeType: string | null;
  assignedUserId: string | null;
  assignedRoleCode: string | null;
};

/** Vai trò xem toàn bộ phản ánh (danh sách, chi tiết, thống kê). */
export function feedbackVisibilityRoles(): string[] {
  return ["admin"];
}

export function canViewAllFeedbacks(roleCode: string | null | undefined): boolean {
  if (!roleCode) return false;
  return feedbackVisibilityRoles().includes(roleCode);
}

export function parseAssigneesPayload(
  input: FeedbackAssigneesInput | FeedbackAssigneeInput | null | undefined,
): FeedbackAssigneesInput {
  if (!input) return { userIds: [], roleCodes: [] };
  if ("userIds" in input || "roleCodes" in input) {
    const multi = input as FeedbackAssigneesInput;
    return {
      userIds: [...new Set((multi.userIds ?? []).map((id) => id.trim()).filter(Boolean))],
      roleCodes: [...new Set((multi.roleCodes ?? []).map((c) => c.trim()).filter(Boolean))],
    };
  }
  const single = input as FeedbackAssigneeInput;
  if (single.type === "user" && single.userId?.trim()) {
    return { userIds: [single.userId.trim()], roleCodes: [] };
  }
  if (single.type === "role" && single.roleCode?.trim()) {
    return { userIds: [], roleCodes: [single.roleCode.trim()] };
  }
  return { userIds: [], roleCodes: [] };
}

export function buildAssigneeVisibilityFilter(viewer: {
  userId: string;
  roleCode: string | null;
}): Prisma.CustomerFeedbackWhereInput {
  if (canViewAllFeedbacks(viewer.roleCode)) {
    return {};
  }
  const or: Prisma.CustomerFeedbackWhereInput[] = [
    { assigneeTargets: { some: { userId: viewer.userId } } },
    { assigneeType: "user", assignedUserId: viewer.userId },
  ];
  if (viewer.roleCode) {
    or.push({ assigneeTargets: { some: { roleCode: viewer.roleCode } } });
    or.push({ assigneeType: "role", assignedRoleCode: viewer.roleCode });
  }
  return { OR: or };
}

export async function buildFeedbackAccessFilter(viewer: {
  userId: string;
  roleCode: string | null;
}): Promise<Prisma.CustomerFeedbackWhereInput> {
  return buildAssigneeVisibilityFilter(viewer);
}

export async function validateAndNormalizeAssignees(
  input: FeedbackAssigneesInput | FeedbackAssigneeInput | null | undefined,
): Promise<NormalizedAssignees> {
  const parsed = parseAssigneesPayload(input);
  if (parsed.userIds.length === 0 && parsed.roleCodes.length === 0) {
    return {
      userIds: [],
      roleCodes: [],
      assigneeType: null,
      assignedUserId: null,
      assignedRoleCode: null,
    };
  }

  const userIds: string[] = [];
  for (const userId of parsed.userIds) {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null, status: "active" },
      select: { id: true },
    });
    if (!user) throw new HttpError(400, `Người phân công không hợp lệ: ${userId}`);
    userIds.push(user.id);
  }

  const roleCodes: string[] = [];
  for (const roleCode of parsed.roleCodes) {
    const role = await prisma.role.findFirst({
      where: { code: roleCode, deletedAt: null, isActive: true },
      select: { code: true },
    });
    if (!role) throw new HttpError(400, `Vai trò phân công không hợp lệ: ${roleCode}`);
    roleCodes.push(role.code);
  }

  const assigneeType = userIds.length > 0 ? "user" : roleCodes.length > 0 ? "role" : null;
  return {
    userIds,
    roleCodes,
    assigneeType,
    assignedUserId: userIds[0] ?? null,
    assignedRoleCode: roleCodes[0] ?? null,
  };
}

export async function validateAndNormalizeAssignee(input: FeedbackAssigneeInput | null | undefined) {
  const normalized = await validateAndNormalizeAssignees(input);
  return {
    assigneeType: normalized.assigneeType,
    assignedUserId: normalized.assignedUserId,
    assignedRoleCode: normalized.assignedRoleCode,
  };
}

export async function resolveUserIdsForAssignees(input: {
  userIds: string[];
  roleCodes: string[];
}): Promise<string[]> {
  const ids = new Set<string>(input.userIds);
  if (input.roleCodes.length > 0) {
    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        status: "active",
        role: { code: { in: input.roleCodes }, deletedAt: null, isActive: true },
      },
      select: { id: true },
    });
    for (const u of users) ids.add(u.id);
  }
  return [...ids];
}

export async function resolveUserIdsForAssignee(input: {
  assigneeType: string | null;
  assignedUserId: string | null;
  assignedRoleCode: string | null;
}): Promise<string[]> {
  return resolveUserIdsForAssignees({
    userIds: input.assigneeType === "user" && input.assignedUserId ? [input.assignedUserId] : [],
    roleCodes: input.assigneeType === "role" && input.assignedRoleCode ? [input.assignedRoleCode] : [],
  });
}

export async function replaceFeedbackAssigneeTargets(
  feedbackId: string,
  assignees: NormalizedAssignees,
): Promise<void> {
  await prisma.customerFeedbackAssigneeTarget.deleteMany({ where: { feedbackId } });
  const rows: Array<{
    feedbackId: string;
    targetKey: string;
    userId: string | null;
    roleCode: string | null;
  }> = [];
  for (const userId of assignees.userIds) {
    rows.push({ feedbackId, targetKey: `user:${userId}`, userId, roleCode: null });
  }
  for (const roleCode of assignees.roleCodes) {
    rows.push({ feedbackId, targetKey: `role:${roleCode}`, userId: null, roleCode });
  }
  if (rows.length > 0) {
    await prisma.customerFeedbackAssigneeTarget.createMany({ data: rows });
  }
}

export function applyLegacyAssigneeColumns(
  data: Prisma.CustomerFeedbackUpdateInput,
  assignees: NormalizedAssignees,
): void {
  data.assigneeType = assignees.assigneeType;
  data.assignedRoleCode = assignees.assignedRoleCode;
  if (assignees.assignedUserId) {
    data.assignedUser = { connect: { id: assignees.assignedUserId } };
  } else {
    data.assignedUser = { disconnect: true };
  }
}

export function applyAssigneeToPrismaUpdate(
  data: Prisma.CustomerFeedbackUpdateInput,
  assignee: {
    assigneeType: string | null;
    assignedUserId: string | null;
    assignedRoleCode: string | null;
  },
): void {
  applyLegacyAssigneeColumns(data, {
    userIds: assignee.assigneeType === "user" && assignee.assignedUserId ? [assignee.assignedUserId] : [],
    roleCodes: assignee.assigneeType === "role" && assignee.assignedRoleCode ? [assignee.assignedRoleCode] : [],
    assigneeType: assignee.assigneeType,
    assignedUserId: assignee.assignedUserId,
    assignedRoleCode: assignee.assignedRoleCode,
  });
}

export function mapAssigneeTargetsFromRow(
  targets: Array<{
    userId: string | null;
    roleCode: string | null;
    user?: { id: string; fullName: string } | null;
  }>,
): {
  userIds: string[];
  roleCodes: string[];
  users: Array<{ id: string; fullName: string }>;
  roles: Array<{ code: string }>;
} {
  const users: Array<{ id: string; fullName: string }> = [];
  const roles: Array<{ code: string }> = [];
  const userIds: string[] = [];
  const roleCodes: string[] = [];
  for (const t of targets) {
    if (t.userId && t.user) {
      userIds.push(t.userId);
      users.push({ id: t.user.id, fullName: t.user.fullName });
    } else if (t.roleCode) {
      roleCodes.push(t.roleCode);
      roles.push({ code: t.roleCode });
    }
  }
  return { userIds, roleCodes, users, roles };
}

export function formatAssigneeLabel(row: {
  assigneeType?: string | null;
  assignedUser?: { fullName: string } | null;
  assignedRoleCode?: string | null;
  assignees?: {
    users?: Array<{ fullName: string }>;
    roles?: Array<{ code: string }>;
  };
}): string {
  const users = row.assignees?.users ?? [];
  const roles = row.assignees?.roles ?? [];
  const parts: string[] = [];
  if (users.length > 0) parts.push(users.map((u) => u.fullName).join(", "));
  if (roles.length > 0) parts.push(roles.map((r) => `Vai trò: ${r.code}`).join(", "));
  if (parts.length > 0) return parts.join(" · ");
  if (row.assigneeType === "user" && row.assignedUser?.fullName) {
    return row.assignedUser.fullName;
  }
  if (row.assigneeType === "role" && row.assignedRoleCode) {
    return `Vai trò: ${row.assignedRoleCode}`;
  }
  return "—";
}

export function viewerMatchesAssignees(
  viewer: { userId: string; roleCode: string | null },
  assignees: { userIds: string[]; roleCodes: string[] },
): boolean {
  if (assignees.userIds.includes(viewer.userId)) return true;
  if (viewer.roleCode && assignees.roleCodes.includes(viewer.roleCode)) return true;
  return false;
}
