import { createNotificationForUser } from "../notifications/service";
import { isNotificationEnabledForUser } from "../notification-preferences/service";
import { prisma } from "../../utils/prisma";
import { resolveRecipientUserIdsForUnits } from "./routing";

export async function scanFeedbackSlaOverdue(now: Date = new Date()): Promise<number> {
  const rows = await prisma.customerFeedback.findMany({
    where: {
      deletedAt: null,
      status: { notIn: ["resolved"] },
      slaDueAt: { lt: now },
    },
    select: {
      id: true,
      title: true,
      assignments: { select: { unitId: true } },
    },
    take: 200,
  });

  let notified = 0;
  for (const fb of rows) {
    const unitIds = [...new Set(fb.assignments.map((a) => a.unitId))];
    const userIds = await resolveRecipientUserIdsForUnits(unitIds);
    for (const userId of userIds) {
      const enabled = await isNotificationEnabledForUser(userId, "feedback_unit_reminder");
      if (!enabled) continue;
      await createNotificationForUser({
        userId,
        key: "feedback_unit_reminder",
        title: `Phản ánh quá hạn: ${fb.title}`,
        message: "Vui lòng cập nhật tiến độ xử lý",
        link: "/phan-anh",
        refType: "customer_feedback",
        refId: fb.id,
      });
      notified += 1;
    }
  }
  return notified;
}
