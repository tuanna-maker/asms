import { createNotificationForUser } from "../notifications/service";
import { isNotificationEnabledForUser } from "../notification-preferences/service";
import { prisma } from "../../utils/prisma";

import { buildFeedbackAccessFilter, canViewAllFeedbacks } from "./assignee";

/** Đảm bảo ticket phản ánh đang mở có thông báo trong chuông (thay banner). */
export async function syncPendingFeedbackNotificationsForUser(
  userId: string,
  roleCode: string | null,
): Promise<void> {
  if (canViewAllFeedbacks(roleCode)) return;

  const access = await buildFeedbackAccessFilter({ userId, roleCode });
  if (!access.OR?.length) return;

  const openRows = await prisma.customerFeedback.findMany({
    where: {
      deletedAt: null,
      status: { notIn: ["resolved"] },
      OR: access.OR,
    },
    select: { id: true, title: true },
    orderBy: { feedbackAt: "desc" },
    take: 30,
  });

  for (const fb of openRows) {
    const enabled = await isNotificationEnabledForUser(userId, "feedback_assigned");
    if (!enabled) continue;

    const existing = await prisma.notification.findFirst({
      where: {
        userId,
        key: "feedback_assigned",
        refType: "customer_feedback",
        refId: fb.id,
      },
      select: { id: true },
    });
    if (existing) continue;

    await createNotificationForUser({
      userId,
      key: "feedback_assigned",
      title: `Phản ánh cần xử lý: ${fb.title}`,
      message: "Vui lòng cập nhật tiến độ xử lý",
      link: `/phan-anh/${fb.id}`,
      refType: "customer_feedback",
      refId: fb.id,
    }).catch(() => undefined);
  }
}
