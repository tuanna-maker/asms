import { prisma } from "../../utils/prisma";

export const NOTIFICATION_PREF_KEYS = [
  "contract_expiry",
  "new_ticket",
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
