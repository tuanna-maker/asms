import type { CustomerFeedbackCommentKind } from "@prisma/client";

import { HttpError } from "../../lib/errors/HttpError";
import { prisma } from "../../utils/prisma";

import { canViewAllFeedbacks, viewerMatchesAssignees } from "./assignee";

export type FeedbackCommentViewer = {
  userId: string;
  roleCode: string | null;
};

export type FeedbackForCommentAccess = {
  id: string;
  status: string;
  createdById: string | null;
  assigneeType?: string | null;
  assignedUserId?: string | null;
  assignedRoleCode?: string | null;
  assignees?: { userIds: string[]; roleCodes: string[] };
};

export function canCommentOnFeedback(
  feedback: FeedbackForCommentAccess,
  viewer: FeedbackCommentViewer,
): boolean {
  if (!viewer.userId) return false;
  if (feedback.status === "resolved") {
    return canViewAllFeedbacks(viewer.roleCode);
  }
  if (canViewAllFeedbacks(viewer.roleCode)) return true;
  if (feedback.createdById === viewer.userId) return true;
  if (feedback.assignees) {
    return viewerMatchesAssignees(viewer, feedback.assignees);
  }
  if (feedback.assigneeType === "user" && feedback.assignedUserId === viewer.userId) {
    return true;
  }
  if (
    feedback.assigneeType === "role" &&
    viewer.roleCode &&
    feedback.assignedRoleCode === viewer.roleCode
  ) {
    return true;
  }
  return false;
}

const commentSelect = {
  id: true,
  feedbackId: true,
  kind: true,
  body: true,
  createdAt: true,
  author: { select: { id: true, fullName: true } },
} as const;

export async function listCommentsForFeedback(feedbackId: string) {
  return prisma.customerFeedbackComment.findMany({
    where: { feedbackId },
    orderBy: { createdAt: "desc" },
    select: commentSelect,
  });
}

export async function createCommentService(
  feedbackId: string,
  viewer: FeedbackCommentViewer,
  input: { kind: CustomerFeedbackCommentKind; body: string },
) {
  const feedback = await prisma.customerFeedback.findFirst({
    where: { id: feedbackId, deletedAt: null },
    select: {
      id: true,
      status: true,
      createdById: true,
      assigneeType: true,
      assignedUserId: true,
      assignedRoleCode: true,
      assigneeTargets: {
        select: { userId: true, roleCode: true },
      },
    },
  });
  if (!feedback) throw new HttpError(404, "Không tìm thấy phản ánh");

  const assignees = {
    userIds: feedback.assigneeTargets.map((t) => t.userId).filter(Boolean) as string[],
    roleCodes: feedback.assigneeTargets.map((t) => t.roleCode).filter(Boolean) as string[],
  };

  if (
    !canCommentOnFeedback(
      {
        id: feedback.id,
        status: feedback.status,
        createdById: feedback.createdById,
        assigneeType: feedback.assigneeType,
        assignedUserId: feedback.assignedUserId,
        assignedRoleCode: feedback.assignedRoleCode,
        assignees,
      },
      viewer,
    )
  ) {
    throw new HttpError(403, "Bạn không có quyền ghi cập nhật trên phản ánh này");
  }

  const body = input.body.trim();
  if (!body) throw new HttpError(400, "Nội dung cập nhật không được để trống");

  return prisma.customerFeedbackComment.create({
    data: {
      feedbackId: feedback.id,
      authorId: viewer.userId,
      kind: input.kind,
      body,
    },
    select: commentSelect,
  });
}
