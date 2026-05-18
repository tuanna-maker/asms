import { HttpError } from "../../lib/errors/HttpError";
import { prisma } from "../../utils/prisma";

export type NotificationItem = {
  id: string;
  key: string;
  title: string;
  message: string | null;
  link: string | null;
  refType: string | null;
  refId: string | null;
  readAt: Date | null;
  createdAt: Date;
};

export async function listNotificationsService(
  userId: string,
  filters: { unread?: boolean; limit?: number },
): Promise<NotificationItem[]> {
  const limit = Math.min(200, Math.max(1, filters.limit ?? 50));
  const rows = await prisma.notification.findMany({
    where: {
      userId,
      ...(filters.unread ? { readAt: null } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows;
}

export async function unreadCountService(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

export async function markReadService(userId: string, id: string): Promise<{ id: string }> {
  const row = await prisma.notification.findUnique({ where: { id } });
  if (!row || row.userId !== userId) throw new HttpError(404, "Không tìm thấy thông báo");
  if (!row.readAt) {
    await prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  }
  return { id };
}

export async function markAllReadService(userId: string): Promise<{ count: number }> {
  const res = await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
  return { count: res.count };
}

/** Tạo thông báo cho 1 user, idempotent theo (key, refType, refId). */
export async function createNotificationForUser(input: {
  userId: string;
  key: string;
  title: string;
  message?: string | null;
  link?: string | null;
  refType?: string | null;
  refId?: string | null;
}): Promise<void> {
  const existing = await prisma.notification.findFirst({
    where: {
      userId: input.userId,
      key: input.key,
      refType: input.refType ?? null,
      refId: input.refId ?? null,
    },
    select: { id: true },
  });
  if (existing) {
    await prisma.notification.update({
      where: { id: existing.id },
      data: {
        title: input.title,
        message: input.message ?? null,
        link: input.link ?? null,
      },
    });
    return;
  }
  await prisma.notification.create({
    data: {
      userId: input.userId,
      key: input.key,
      title: input.title,
      message: input.message ?? null,
      link: input.link ?? null,
      refType: input.refType ?? null,
      refId: input.refId ?? null,
    },
  });
}

/**
 * Tạo thông báo cho mọi user đang bật `key` trong UserNotificationPreference.
 * Bỏ qua user đã tắt.
 */
export async function notifyByPreference(input: {
  key: string;
  title: string;
  message?: string | null;
  link?: string | null;
  refType?: string | null;
  refId?: string | null;
}): Promise<void> {
  const prefs = await prisma.userNotificationPreference.findMany({
    where: { key: input.key, enabled: true, user: { deletedAt: null } },
    select: { userId: true },
  });
  for (const p of prefs) {
    await createNotificationForUser({ ...input, userId: p.userId });
  }
}
