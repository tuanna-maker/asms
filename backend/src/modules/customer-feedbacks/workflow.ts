import type { CustomerFeedbackTimelineEvent } from "@prisma/client";

import { HttpError } from "../../lib/errors/HttpError";
import { createNotificationForUser } from "../notifications/service";
import { isNotificationEnabledForUser } from "../notification-preferences/service";
import { prisma } from "../../utils/prisma";

import {
  computeSlaDueAt,
  resolveRecipientUserIdsForUnits,
  resolveUnitIdsForUser,
  resolveUnitsFromProductIds,
} from "./routing";

export async function appendTimelineEvent(input: {
  feedbackId: string;
  event: CustomerFeedbackTimelineEvent;
  message?: string;
  actorId?: string | null;
}) {
  await prisma.customerFeedbackTimeline.create({
    data: {
      feedbackId: input.feedbackId,
      event: input.event,
      message: input.message ?? null,
      actorId: input.actorId ?? null,
    },
  });
}

export async function notifyFeedbackUsers(
  userIds: string[],
  input: {
    key: string;
    title: string;
    message?: string;
    feedbackId: string;
  },
) {
  const link = `/phan-anh/${input.feedbackId}`;
  for (const userId of userIds) {
    const enabled = await isNotificationEnabledForUser(userId, input.key);
    if (!enabled) continue;
    await createNotificationForUser({
      userId,
      key: input.key,
      title: input.title,
      message: input.message,
      link,
      refType: "customer_feedback",
      refId: input.feedbackId,
    }).catch(() => undefined);
  }
}

export async function createAssignmentsForFeedback(
  feedbackId: string,
  productIds: string[],
  actorId: string | null,
) {
  const units = await resolveUnitsFromProductIds(productIds);
  if (units.length === 0) {
    await prisma.customerFeedback.update({
      where: { id: feedbackId },
      data: { status: "new" },
    });
    return units;
  }

  await prisma.customerFeedbackAssignment.createMany({
    data: units.map((u) => ({
      feedbackId,
      unitId: u.id,
      status: "pending",
    })),
    skipDuplicates: true,
  });

  await prisma.customerFeedback.update({
    where: { id: feedbackId },
    data: { status: "assigned" },
  });

  await appendTimelineEvent({
    feedbackId,
    event: "assigned",
    message: `Giao ${units.map((u) => u.name).join(", ")}`,
    actorId,
  });

  const recipientIds = await resolveRecipientUserIdsForUnits(units.map((u) => u.id));
  await notifyFeedbackUsers(recipientIds, {
    key: "feedback_assigned",
    title: "Phản ánh được giao cho đơn vị của bạn",
    message: units.map((u) => u.name).join(", "),
    feedbackId,
  });

  return units;
}

export async function assertUserCanAccessAssignment(
  userId: string,
  roleCode: string | null,
  assignmentId: string,
) {
  const assignment = await prisma.customerFeedbackAssignment.findUnique({
    where: { id: assignmentId },
    include: { unit: true, feedback: { select: { deletedAt: true } } },
  });
  if (!assignment || assignment.feedback.deletedAt) {
    throw new HttpError(404, "Không tìm thấy phân công");
  }
  const unitIds = await resolveUnitIdsForUser(userId, roleCode);
  const isAdmin = roleCode === "admin" || roleCode === "manager";
  if (!isAdmin && !unitIds.includes(assignment.unitId)) {
    throw new HttpError(403, "Bạn không thuộc đơn vị được giao");
  }
  return assignment;
}

export async function updateAssignmentService(
  assignmentId: string,
  userId: string,
  roleCode: string | null,
  payload: { status?: "pending" | "in_progress" | "done"; responseNote?: string },
) {
  const assignment = await assertUserCanAccessAssignment(userId, roleCode, assignmentId);

  const updated = await prisma.customerFeedbackAssignment.update({
    where: { id: assignmentId },
    data: {
      ...(payload.status !== undefined ? { status: payload.status } : {}),
      ...(payload.responseNote !== undefined ? { responseNote: payload.responseNote } : {}),
      updatedById: userId,
    },
    include: {
      unit: { select: { id: true, code: true, name: true } },
    },
  });

  const feedback = await prisma.customerFeedback.findUnique({
    where: { id: assignment.feedbackId },
    select: { status: true, createdById: true, title: true },
  });

  if (feedback && ["assigned", "new", "reopened"].includes(feedback.status)) {
    await prisma.customerFeedback.update({
      where: { id: assignment.feedbackId },
      data: { status: "in_progress" },
    });
  }

  await appendTimelineEvent({
    feedbackId: assignment.feedbackId,
    event: "unit_updated",
    message: `${updated.unit.name}: ${payload.status ?? updated.status}`,
    actorId: userId,
  });

  if (feedback?.createdById) {
    await notifyFeedbackUsers([feedback.createdById], {
      key: "feedback_pending_close",
      title: `Đơn vị cập nhật: ${feedback.title}`,
      message: updated.unit.name,
      feedbackId: assignment.feedbackId,
    });
  }

  return updated;
}

export async function assertIsCreatorOrAdmin(
  feedbackId: string,
  userId: string,
  roleCode: string | null,
) {
  const fb = await prisma.customerFeedback.findFirst({
    where: { id: feedbackId, deletedAt: null },
    select: { createdById: true },
  });
  if (!fb) throw new HttpError(404, "Không tìm thấy phản ánh");
  const isAdmin = roleCode === "admin" || roleCode === "manager";
  if (!isAdmin && fb.createdById !== userId) {
    throw new HttpError(403, "Chỉ người tạo mới thực hiện được thao tác này");
  }
  return fb;
}

export async function requestCloseFeedbackService(
  feedbackId: string,
  userId: string,
  roleCode: string | null,
  note?: string,
) {
  await assertIsCreatorOrAdmin(feedbackId, userId, roleCode);
  await prisma.customerFeedback.update({
    where: { id: feedbackId },
    data: { status: "pending_close" },
  });
  await appendTimelineEvent({
    feedbackId,
    event: "pending_close",
    message: note ?? "Người tạo đã liên hệ KH, chờ xác nhận đóng",
    actorId: userId,
  });
}

export async function closeFeedbackService(
  feedbackId: string,
  userId: string,
  roleCode: string | null,
  input: { customerVerified: boolean; note?: string },
) {
  await assertIsCreatorOrAdmin(feedbackId, userId, roleCode);
  const now = new Date();
  await prisma.customerFeedback.update({
    where: { id: feedbackId },
    data: {
      status: "resolved",
      closedAt: now,
      closedById: userId,
    },
  });
  await appendTimelineEvent({
    feedbackId,
    event: "resolved",
    message: input.customerVerified
      ? `Đã xác nhận với KH và đóng. ${input.note ?? ""}`.trim()
      : `Đóng (chưa xác nhận KH). ${input.note ?? ""}`.trim(),
    actorId: userId,
  });
}

export async function reopenFeedbackService(
  feedbackId: string,
  userId: string,
  roleCode: string | null,
  note?: string,
) {
  await assertIsCreatorOrAdmin(feedbackId, userId, roleCode);
  await prisma.customerFeedback.update({
    where: { id: feedbackId },
    data: { status: "reopened", closedAt: null, closedById: null },
  });
  await prisma.customerFeedbackAssignment.updateMany({
    where: { feedbackId },
    data: { status: "in_progress" },
  });
  await appendTimelineEvent({
    feedbackId,
    event: "reopened",
    message: note ?? "Mở lại phản ánh",
    actorId: userId,
  });

  const fb = await prisma.customerFeedback.findUnique({
    where: { id: feedbackId },
    select: { title: true, linkageItems: true },
  });
  const productIds = extractProductIdsFromLinkage(fb?.linkageItems);
  const units = await resolveUnitsFromProductIds(productIds);
  const recipientIds = await resolveRecipientUserIdsForUnits(units.map((u) => u.id));
  await notifyFeedbackUsers(recipientIds, {
    key: "feedback_assigned",
    title: `Phản ánh mở lại: ${fb?.title ?? ""}`,
    feedbackId,
  });

}

function extractProductIdsFromLinkage(linkageItems: unknown): string[] {
  if (!Array.isArray(linkageItems)) return [];
  const ids = new Set<string>();
  for (const raw of linkageItems) {
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      const o = raw as Record<string, unknown>;
      if (typeof o.productId === "string") ids.add(o.productId);
    }
  }
  return [...ids];
}

const detailInclude = {
  assignments: {
    include: {
      unit: { select: { id: true, code: true, name: true } },
      updatedBy: { select: { id: true, fullName: true } },
    },
    orderBy: { createdAt: "asc" as const },
  },
  timeline: {
    include: { actor: { select: { id: true, fullName: true } } },
    orderBy: { createdAt: "asc" as const },
  },
  closedBy: { select: { id: true, fullName: true } },
};

export async function getCustomerFeedbackDetailWithRelations(feedbackId: string) {
  return prisma.customerFeedback.findFirst({
    where: { id: feedbackId, deletedAt: null },
    include: detailInclude,
  });
}

export { computeSlaDueAt };
