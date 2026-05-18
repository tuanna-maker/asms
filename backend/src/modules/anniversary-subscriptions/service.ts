import { HttpError } from "../../lib/errors/HttpError";
import { prisma } from "../../utils/prisma";

export async function listSubscriptionsForUser(
  userId: string,
  anniversaryIds: string[],
): Promise<string[]> {
  if (anniversaryIds.length === 0) return [];
  const rows = await prisma.anniversarySubscription.findMany({
    where: {
      userId,
      anniversaryId: { in: anniversaryIds },
    },
    select: { anniversaryId: true },
  });
  return rows.map((r) => r.anniversaryId);
}

export async function subscribeAnniversaryService(userId: string, anniversaryId: string) {
  const anniversary = await prisma.customerAnniversary.findUnique({
    where: { id: anniversaryId },
    select: { id: true },
  });
  if (!anniversary) throw new HttpError(404, "Không tìm thấy ngày kỷ niệm");

  await prisma.anniversarySubscription.upsert({
    where: {
      userId_anniversaryId: { userId, anniversaryId },
    },
    create: { userId, anniversaryId },
    update: {},
  });

  return { anniversaryId, subscribed: true };
}

export async function unsubscribeAnniversaryService(userId: string, anniversaryId: string) {
  await prisma.anniversarySubscription.deleteMany({
    where: { userId, anniversaryId },
  });
  return { anniversaryId, subscribed: false };
}
