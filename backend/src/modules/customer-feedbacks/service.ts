import type { Prisma } from "@prisma/client";

import { notifyByPreference } from "../notifications/service";
import { HttpError } from "../../lib/errors/HttpError";
import { prisma } from "../../utils/prisma";

import type { z } from "zod";

import {
  createCustomerFeedbackSchema,
  listCustomerFeedbacksQuerySchema,
} from "./schema";
import { enrichAndValidateLinkageItems, parseLinkageItemsJson } from "./linkage-items";
import type { FeedbackLinkageItem } from "./linkage-types";
import { intakeToJson, parseIntakeJson } from "./intake";
import {
  appendTimelineEvent,
  closeFeedbackService,
  completeRepairAndCloseFeedbackService,
  computeSlaDueAt,
  createAssignmentsForFeedback,
  getCustomerFeedbackDetailWithRelations,
  reopenFeedbackService,
  requestCloseFeedbackService,
  updateAssignmentService,
} from "./workflow";
import { resolveUnitIdsForUser, resolveUnitsFromProductIds } from "./routing";
import {
  buildAssigneeVisibilityFilter,
  canViewAllFeedbacks,
  validateAndNormalizeAssignees,
  resolveUserIdsForAssignees,
  applyLegacyAssigneeColumns,
  replaceFeedbackAssigneeTargets,
  mapAssigneeTargetsFromRow,
  type FeedbackAssigneeInput,
  type FeedbackAssigneesInput,
  type NormalizedAssignees,
} from "./assignee";
import { notifyFeedbackUsers } from "./workflow";
import { canCommentOnFeedback, createCommentService } from "./comments";

async function resolveCustomerId(idOrCode: string) {
  const customer = await prisma.customer.findFirst({
    where: { deletedAt: null, OR: [{ id: idOrCode }, { code: idOrCode }] },
    select: { id: true },
  });
  if (!customer) throw new HttpError(404, "Không tìm thấy khách hàng");
  return customer.id;
}

async function resolveContractId(idOrCode: string) {
  const contract = await prisma.contract.findFirst({
    where: { deletedAt: null, OR: [{ id: idOrCode }, { code: idOrCode }] },
    select: { id: true, customerId: true },
  });
  if (!contract) throw new HttpError(404, "Không tìm thấy hợp đồng");
  return contract;
}

async function resolveWarrantyId(idOrCode: string) {
  const warranty = await prisma.warranty.findFirst({
    where: { deletedAt: null, OR: [{ id: idOrCode }, { code: idOrCode }] },
    select: { id: true, customerId: true },
  });
  if (!warranty) throw new HttpError(404, "Không tìm thấy bảo hành");
  return warranty;
}

async function resolveCustomerFeedbackId(id: string) {
  const row = await prisma.customerFeedback.findFirst({
    where: { id, deletedAt: null },
    select: { id: true },
  });
  if (!row) throw new HttpError(404, "Không tìm thấy phản ánh");
  return row.id;
}

const listSelect = {
  id: true,
  customerId: true,
  contractId: true,
  warrantyId: true,
  title: true,
  content: true,
  severity: true,
  assigneeType: true,
  assignedUserId: true,
  assignedRoleCode: true,
  status: true,
  source: true,
  intake: true,
  feedbackAt: true,
  slaDueAt: true,
  closedAt: true,
  createdById: true,
  closedById: true,
  createdAt: true,
  updatedAt: true,
  customer: { select: { id: true, code: true, name: true } },
  contract: { select: { id: true, code: true, title: true } },
  warranty: { select: { id: true, code: true, issue: true } },
  createdBy: { select: { id: true, fullName: true } },
  closedBy: { select: { id: true, fullName: true } },
  assignedUser: { select: { id: true, fullName: true } },
  assigneeTargets: {
    select: {
      userId: true,
      roleCode: true,
      user: { select: { id: true, fullName: true } },
    },
  },
  linkageItems: true,
  assignments: {
    select: {
      id: true,
      feedbackId: true,
      unitId: true,
      status: true,
      responseNote: true,
      unit: { select: { id: true, code: true, name: true } },
    },
  },
} as const;

const timelineSelect = {
  select: {
    id: true,
    feedbackId: true,
    event: true,
    message: true,
    actorId: true,
    createdAt: true,
    actor: { select: { id: true, fullName: true } },
  },
  orderBy: { createdAt: "asc" as const },
};

const commentsSelect = {
  select: {
    id: true,
    feedbackId: true,
    kind: true,
    body: true,
    createdAt: true,
    author: { select: { id: true, fullName: true } },
  },
  orderBy: { createdAt: "desc" as const },
};

function mapFeedbackRow<T extends { linkageItems: unknown; intake?: unknown; assigneeTargets?: Array<{
  userId: string | null;
  roleCode: string | null;
  user?: { id: string; fullName: string } | null;
}> }>(
  row: T,
): Omit<T, "linkageItems" | "intake" | "assigneeTargets"> & {
  linkageItems: FeedbackLinkageItem[];
  intake: ReturnType<typeof parseIntakeJson>;
  assignees: ReturnType<typeof mapAssigneeTargetsFromRow>;
} {
  const { assigneeTargets, ...rest } = row;
  const assignees = mapAssigneeTargetsFromRow(assigneeTargets ?? []);
  return {
    ...(rest as Omit<T, "linkageItems" | "intake" | "assigneeTargets">),
    linkageItems: parseLinkageItemsJson(row.linkageItems as never),
    intake: parseIntakeJson(row.intake as never),
    assignees,
  };
}

function assigneesChanged(
  before: { userIds: string[]; roleCodes: string[] },
  after: { userIds: string[]; roleCodes: string[] },
): boolean {
  const sortJoin = (ids: string[]) => [...ids].sort().join("\0");
  return (
    sortJoin(before.userIds) !== sortJoin(after.userIds) ||
    sortJoin(before.roleCodes) !== sortJoin(after.roleCodes)
  );
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function extractProductIds(items: FeedbackLinkageItem[]): string[] {
  return [...new Set(items.map((i) => i.productId).filter(Boolean))];
}

export async function listCustomerFeedbacksService(
  filters: z.infer<typeof listCustomerFeedbacksQuerySchema>,
  viewer?: { userId: string; roleCode: string | null },
) {
  const and: Prisma.CustomerFeedbackWhereInput[] = [{ deletedAt: null }];

  if (filters.customerId) {
    and.push({ customerId: await resolveCustomerId(filters.customerId) });
  }
  if (filters.contractId) {
    const contract = await resolveContractId(filters.contractId);
    and.push({ contractId: contract.id });
  }
  if (filters.warrantyId) {
    const warranty = await resolveWarrantyId(filters.warrantyId);
    and.push({ warrantyId: warranty.id });
  }
  if (filters.status) and.push({ status: filters.status });

  if (filters.unitId) {
    and.push({ assignments: { some: { unitId: filters.unitId } } });
  }

  if (viewer && !canViewAllFeedbacks(viewer.roleCode)) {
    and.push(buildAssigneeVisibilityFilter(viewer));
  }

  if (filters.myUnits && viewer) {
    const unitIds = await resolveUnitIdsForUser(viewer.userId, viewer.roleCode);
    if (unitIds.length === 0) {
      return [];
    }
    and.push({ assignments: { some: { unitId: { in: unitIds } } } });
  }

  if (filters.feedbackFrom || filters.feedbackTo) {
    const feedbackAt: Prisma.DateTimeFilter = {};
    if (filters.feedbackFrom) feedbackAt.gte = startOfDay(filters.feedbackFrom);
    if (filters.feedbackTo) feedbackAt.lte = endOfDay(filters.feedbackTo);
    and.push({ feedbackAt });
  }

  const search = filters.search?.trim();
  if (search) {
    and.push({
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
        { customer: { code: { contains: search, mode: "insensitive" } } },
      ],
    });
  }

  const rows = await prisma.customerFeedback.findMany({
    where: { AND: and },
    orderBy: { feedbackAt: "desc" },
    select: listSelect,
  });
  return rows.map(mapFeedbackRow);
}

async function assertFeedbackVisible(
  feedbackId: string,
  viewer?: { userId: string; roleCode: string | null },
) {
  if (!viewer?.userId || canViewAllFeedbacks(viewer.roleCode)) return;
  const access = buildAssigneeVisibilityFilter(viewer);
  const row = await prisma.customerFeedback.findFirst({
    where: { id: feedbackId, deletedAt: null, ...access },
    select: { id: true },
  });
  if (!row) throw new HttpError(403, "Bạn không có quyền xem phản ánh này");
}

export async function getCustomerFeedbackDetailService(
  id: string,
  viewer?: { userId: string; roleCode: string | null },
) {
  const resolvedId = await resolveCustomerFeedbackId(id);
  await assertFeedbackVisible(resolvedId, viewer);
  const row = await prisma.customerFeedback.findFirst({
    where: { id: resolvedId, deletedAt: null },
    select: {
      ...listSelect,
      timeline: timelineSelect,
      comments: commentsSelect,
    },
  });
  if (!row) throw new HttpError(404, "Không tìm thấy phản ánh");
  const mapped = mapFeedbackRow(row);
  const { comments } = row;
  return {
    ...mapped,
    comments,
    canComment: viewer
      ? canCommentOnFeedback(
          {
            id: row.id,
            status: row.status,
            createdById: row.createdById,
            assigneeType: row.assigneeType,
            assignedUserId: row.assignedUserId,
            assignedRoleCode: row.assignedRoleCode,
            assignees: mapped.assignees,
          },
          viewer,
        )
      : false,
  };
}

export async function createFeedbackCommentService(
  feedbackId: string,
  viewer: { userId: string; roleCode: string | null },
  input: { kind: "issue" | "fix"; body: string },
) {
  await createCommentService(feedbackId, viewer, input);
  return getCustomerFeedbackDetailService(feedbackId, viewer);
}

export async function previewRoutingService(productIds: string[]) {
  const units = await resolveUnitsFromProductIds(productIds);
  return { units };
}

export async function getFeedbackAssignmentSummaryService(
  userId: string,
  roleCode: string | null,
) {
  const visibility = buildAssigneeVisibilityFilter({ userId, roleCode });
  const openWhere: Prisma.CustomerFeedbackWhereInput = {
    deletedAt: null,
    status: { notIn: ["resolved"] },
    ...(visibility.OR ? visibility : {}),
  };

  const now = new Date();
  const [pendingAssignments, overdueFeedbacks] = await Promise.all([
    prisma.customerFeedback.count({ where: openWhere }),
    prisma.customerFeedback.count({
      where: { ...openWhere, slaDueAt: { lt: now } },
    }),
  ]);

  return { pendingAssignments, overdueFeedbacks };
}

export async function createCustomerFeedbackService(
  payload: z.infer<typeof createCustomerFeedbackSchema> & { createdById: string | null },
  viewer?: { userId: string; roleCode: string | null },
) {
  const customerId = await resolveCustomerId(payload.customerId);

  let contractId: string | null = null;
  if (payload.contractId) {
    const contract = await resolveContractId(payload.contractId);
    if (contract.customerId !== customerId) {
      throw new HttpError(400, "Hợp đồng không thuộc khách hàng này");
    }
    contractId = contract.id;
  }

  const linkageInputs = (payload.linkageItems ?? []).map((item) => {
    const normalized: { productId: string; materialId?: string | null } = { productId: item.productId };
    if (item.materialId !== undefined) normalized.materialId = item.materialId;
    return normalized;
  });
  const linkageItems = await enrichAndValidateLinkageItems(
    customerId,
    contractId,
    linkageInputs,
  );

  const assignees = await validateAndNormalizeAssignees(
    (payload.assignees ?? payload.assignee ?? null) as
      | FeedbackAssigneesInput
      | FeedbackAssigneeInput
      | null,
  );
  const slaDueAt = computeSlaDueAt("medium", payload.feedbackAt);
  const intake = payload.intake ?? {};

  const row = await prisma.customerFeedback.create({
    data: {
      customerId,
      contractId,
      warrantyId: null,
      title: payload.title,
      content: payload.content,
      severity: "medium",
      assigneeType: assignees.assigneeType,
      assignedUserId: assignees.assignedUserId,
      assignedRoleCode: assignees.assignedRoleCode,
      status: "new",
      source: payload.source,
      intake: intakeToJson(intake),
      feedbackAt: payload.feedbackAt,
      slaDueAt,
      linkageItems: linkageItems as unknown as Prisma.InputJsonValue,
      createdById: payload.createdById,
    },
    select: listSelect,
  });

  await replaceFeedbackAssigneeTargets(row.id, assignees);

  await appendTimelineEvent({
    feedbackId: row.id,
    event: "created",
    message: "Tạo phản ánh",
    actorId: payload.createdById,
  });

  const productIds = extractProductIds(linkageItems);
  await createAssignmentsForFeedback(row.id, productIds, payload.createdById);

  const assigneeUserIds = await resolveUserIdsForAssignees(assignees);
  if (assigneeUserIds.length > 0) {
    const notifyInput: Parameters<typeof notifyFeedbackUsers>[1] = {
      key: "feedback_assigned",
      title: `Phản ánh được phân công: ${row.title}`,
      feedbackId: row.id,
    };
    if (row.customer?.name) notifyInput.message = `Khách hàng ${row.customer.name}`;
    await notifyFeedbackUsers(assigneeUserIds, notifyInput);
  }

  const prefInput: Parameters<typeof notifyByPreference>[0] = {
    key: "feedback_new",
    title: `Phản ánh mới: ${row.title}`,
    link: `/phan-anh/${row.id}`,
    refType: "customer_feedback",
    refId: row.id,
  };
  if (row.customer?.name) prefInput.message = `Khách hàng ${row.customer.name}`;
  await notifyByPreference(prefInput).catch((e) => {
    // eslint-disable-next-line no-console
    console.error("[notify] feedback_new failed", e);
  });

  return getCustomerFeedbackDetailService(row.id, viewer);
}

export async function updateCustomerFeedbackService(
  id: string,
  payload: Record<string, unknown>,
  viewer?: { userId: string; roleCode: string | null },
) {
  const resolvedId = await resolveCustomerFeedbackId(id);

  const existing = await prisma.customerFeedback.findFirst({
    where: { id: resolvedId, deletedAt: null },
    select: {
      customerId: true,
      createdById: true,
      status: true,
      assigneeType: true,
      assignedUserId: true,
      assignedRoleCode: true,
      title: true,
      customer: { select: { name: true } },
      assigneeTargets: { select: { userId: true, roleCode: true } },
    },
  });
  if (!existing) throw new HttpError(404, "Không tìm thấy phản ánh");

  const isAdmin = viewer?.roleCode === "admin" || viewer?.roleCode === "manager";
  const isCreator = viewer?.userId === existing.createdById;
  if (!isAdmin && !isCreator) {
    throw new HttpError(403, "Chỉ người tạo hoặc quản lý mới sửa phản ánh");
  }
  if (!isAdmin && !["new", "assigned"].includes(existing.status)) {
    throw new HttpError(400, "Không thể sửa phản ánh đang xử lý");
  }

  const data: Prisma.CustomerFeedbackUpdateInput = {};

  let customerId = existing.customerId;
  if (payload.customerId !== undefined && typeof payload.customerId === "string") {
    customerId = await resolveCustomerId(payload.customerId);
    data.customer = { connect: { id: customerId } };
  }

  if (payload.contractId !== undefined) {
    if (payload.contractId === null || payload.contractId === "") {
      data.contract = { disconnect: true };
    } else if (typeof payload.contractId === "string") {
      const contract = await resolveContractId(payload.contractId);
      if (contract.customerId !== customerId) {
        throw new HttpError(400, "Hợp đồng không thuộc khách hàng này");
      }
      data.contract = { connect: { id: contract.id } };
    }
  }

  let resolvedContractId: string | null;
  if (payload.contractId !== undefined) {
    resolvedContractId =
      payload.contractId === null || payload.contractId === "" ? null : (await resolveContractId(payload.contractId as string)).id;
  } else {
    const current = await prisma.customerFeedback.findFirst({
      where: { id: resolvedId },
      select: { contractId: true },
    });
    resolvedContractId = current?.contractId ?? null;
  }

  if (payload.linkageItems !== undefined) {
    const inputs = (Array.isArray(payload.linkageItems) ? payload.linkageItems : []).map((item) => {
      const normalized: { productId: string; materialId?: string | null } = { productId: item.productId };
      if (item.materialId !== undefined) normalized.materialId = item.materialId;
      return normalized;
    });
    const enriched = await enrichAndValidateLinkageItems(
      customerId,
      resolvedContractId ?? null,
      inputs,
    );
    data.linkageItems = enriched as unknown as Prisma.InputJsonValue;
    if (enriched.length > 0 && resolvedContractId == null) {
      throw new HttpError(400, "Vui lòng chọn hợp đồng khi gắn sản phẩm/vật tư");
    }
  }

  if (payload.title !== undefined) data.title = payload.title as string;
  if (payload.content !== undefined) data.content = payload.content as string;
  if (payload.source !== undefined) data.source = payload.source as "external" | "internal";

  let assigneeChanged = false;
  let newAssignees: NormalizedAssignees | null = null;
  if (payload.assignees !== undefined || payload.assignee !== undefined) {
    const input =
      payload.assignees !== undefined
        ? payload.assignees
        : payload.assignee === null
          ? null
          : (payload.assignee as FeedbackAssigneeInput);
    newAssignees = await validateAndNormalizeAssignees(input as never);
    const before = {
      userIds: existing.assigneeTargets.map((t) => t.userId).filter(Boolean) as string[],
      roleCodes: existing.assigneeTargets.map((t) => t.roleCode).filter(Boolean) as string[],
    };
    assigneeChanged = assigneesChanged(before, newAssignees);
    applyLegacyAssigneeColumns(data, newAssignees);
  }
  if (payload.intake !== undefined) data.intake = intakeToJson(payload.intake as never);
  if (payload.feedbackAt !== undefined) {
    data.feedbackAt =
      payload.feedbackAt instanceof Date
        ? payload.feedbackAt
        : new Date(payload.feedbackAt as string);
  }

  if (Object.keys(data).length === 0) {
    return getCustomerFeedbackDetailService(resolvedId, viewer);
  }

  await prisma.customerFeedback.update({ where: { id: resolvedId }, data });

  if (assigneeChanged && newAssignees) {
    await replaceFeedbackAssigneeTargets(resolvedId, newAssignees);
    const assigneeUserIds = await resolveUserIdsForAssignees(newAssignees);
    if (assigneeUserIds.length > 0) {
      const notifyInput: Parameters<typeof notifyFeedbackUsers>[1] = {
        key: "feedback_assigned",
        title: `Phản ánh được phân công: ${existing.title}`,
        feedbackId: resolvedId,
      };
      if (existing.customer?.name) notifyInput.message = `Khách hàng ${existing.customer.name}`;
      await notifyFeedbackUsers(assigneeUserIds, notifyInput);
    }
  }

  return getCustomerFeedbackDetailService(resolvedId, viewer);
}

export async function softDeleteCustomerFeedbackService(id: string) {
  const resolvedId = await resolveCustomerFeedbackId(id);
  const now = new Date();
  const n = await prisma.customerFeedback.updateMany({
    where: { id: resolvedId, deletedAt: null },
    data: { deletedAt: now },
  });
  if (n.count === 0) throw new HttpError(404, "Không tìm thấy phản ánh");
  return { id: resolvedId };
}

export async function requestCloseFeedbackServiceWrapped(
  feedbackId: string,
  userId: string,
  roleCode: string | null,
  note?: string,
) {
  await requestCloseFeedbackService(feedbackId, userId, roleCode, note);
  return getCustomerFeedbackDetailService(feedbackId, { userId, roleCode });
}

export async function closeFeedbackServiceWrapped(
  feedbackId: string,
  userId: string,
  roleCode: string | null,
  input: { customerVerified: boolean; note?: string },
) {
  await closeFeedbackService(feedbackId, userId, roleCode, input);
  return getCustomerFeedbackDetailService(feedbackId, { userId, roleCode });
}

export async function completeRepairAndCloseFeedbackServiceWrapped(
  feedbackId: string,
  userId: string,
  roleCode: string | null,
  note?: string,
) {
  await completeRepairAndCloseFeedbackService(feedbackId, userId, roleCode, note);
  return getCustomerFeedbackDetailService(feedbackId, { userId, roleCode });
}

export async function reopenFeedbackServiceWrapped(
  feedbackId: string,
  userId: string,
  roleCode: string | null,
  note?: string,
) {
  await reopenFeedbackService(feedbackId, userId, roleCode, note);
  return getCustomerFeedbackDetailService(feedbackId, { userId, roleCode });
}

export { updateAssignmentService };
