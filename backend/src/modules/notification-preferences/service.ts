import { prisma } from "../../utils/prisma";

export const NOTIFICATION_PREF_KEYS = [
  "contract_expiry",
  "contract_execution_sla",
  "new_ticket",
  "feedback_new",
  "task_late",
  "material_low",
  "warranty_expiry",
  "training_upcoming",
  "repair_scheduled",
  "customer_anniversary",
] as const;

export type NotificationPrefKey = (typeof NOTIFICATION_PREF_KEYS)[number];

export async function listNotificationPreferencesForUser(userId: string) {
  const rows = await prisma.userNotificationPreference.findMany({
    where: { userId },
    select: { key: true, enabled: true },
  });
  const map = new Map(rows.map((r) => [r.key, r.enabled]));
  return NOTIFICATION_PREF_KEYS.map((key) => ({ key, enabled: map.get(key) ?? true }));
}

export async function upsertNotificationPreferencesForUser(
  userId: string,
  preferences: Array<{ key: NotificationPrefKey; enabled: boolean }>
) {
  await prisma.$transaction(
    preferences.map((p) =>
      prisma.userNotificationPreference.upsert({
        where: {
          userId_key: {
            userId,
            key: p.key,
          },
        },
        create: {
          userId,
          key: p.key,
          enabled: p.enabled,
        },
        update: {
          enabled: p.enabled,
        },
      })
    )
  );
  return listNotificationPreferencesForUser(userId);
}

/** User nhận thông báo broadcast nếu chưa tắt (không có dòng pref = bật). */
export async function resolveRecipientUserIds(key: string): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      notificationPreferences: { where: { key }, select: { enabled: true } },
    },
  });
  return users
    .filter((u) => {
      const pref = u.notificationPreferences[0];
      return pref === undefined || pref.enabled;
    })
    .map((u) => u.id);
}

export async function isNotificationEnabledForUser(userId: string, key: string): Promise<boolean> {
  const pref = await prisma.userNotificationPreference.findUnique({
    where: { userId_key: { userId, key } },
    select: { enabled: true },
  });
  return pref === null || pref.enabled;
}

export async function ensureNotificationPreferencesForUser(userId: string): Promise<void> {
  await prisma.$transaction(
    NOTIFICATION_PREF_KEYS.map((key) =>
      prisma.userNotificationPreference.upsert({
        where: { userId_key: { userId, key } },
        create: { userId, key, enabled: true },
        update: {},
      }),
    ),
  );
}

export async function ensureNotificationPreferencesForAllUsers(): Promise<void> {
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: { id: true },
  });
  for (const u of users) {
    await ensureNotificationPreferencesForUser(u.id);
  }
}
