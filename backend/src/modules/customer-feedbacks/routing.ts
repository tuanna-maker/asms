import { prisma } from "../../utils/prisma";

export type ResolvedUnit = {
  id: string;
  code: string;
  name: string;
};

/** Resolve đơn vị xử lý từ danh sách productId (ưu tiên rule theo productId, sau đó category). */
export async function resolveUnitsFromProductIds(productIds: string[]): Promise<ResolvedUnit[]> {
  const uniqueIds = [...new Set(productIds.filter(Boolean))];
  if (uniqueIds.length === 0) return [];

  const products = await prisma.product.findMany({
    where: { id: { in: uniqueIds }, deletedAt: null },
    select: { id: true, category: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const rules = await prisma.feedbackProductRoutingRule.findMany({
    where: { deletedAt: null, unit: { deletedAt: null, isActive: true } },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    select: {
      productId: true,
      productCategory: true,
      unit: { select: { id: true, code: true, name: true } },
    },
  });

  const unitMap = new Map<string, ResolvedUnit>();

  for (const pid of uniqueIds) {
    const product = productMap.get(pid);
    if (!product) continue;

    const byProduct = rules.find((r) => r.productId === pid);
    const byCategory =
      !byProduct && product.category
        ? rules.find((r) => r.productCategory === product.category && !r.productId)
        : undefined;
    const match = byProduct ?? byCategory;
    if (match?.unit) {
      unitMap.set(match.unit.id, match.unit);
    }
  }

  return [...unitMap.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export async function resolveRecipientUserIdsForUnits(unitIds: string[]): Promise<string[]> {
  if (unitIds.length === 0) return [];

  const units = await prisma.feedbackExecutionUnit.findMany({
    where: { id: { in: unitIds }, deletedAt: null, isActive: true },
    select: { roleCodes: true, notifyUserIds: true },
  });

  const roleCodes = new Set<string>();
  const explicitIds = new Set<string>();
  for (const u of units) {
    u.roleCodes.forEach((c) => roleCodes.add(c));
    u.notifyUserIds.forEach((id) => explicitIds.add(id));
  }

  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      role: { select: { code: true } },
    },
  });

  const ids = new Set<string>();
  for (const user of users) {
    if (explicitIds.has(user.id)) ids.add(user.id);
    else if (user.role && roleCodes.has(user.role.code)) ids.add(user.id);
  }
  return [...ids];
}

/** Đơn vị mà user hiện tại thuộc (theo role hoặc notify list). */
export async function resolveUnitIdsForUser(userId: string, roleCode: string | null): Promise<string[]> {
  const units = await prisma.feedbackExecutionUnit.findMany({
    where: { deletedAt: null, isActive: true },
    select: { id: true, roleCodes: true, notifyUserIds: true },
  });
  return units
    .filter(
      (u) =>
        u.notifyUserIds.includes(userId) ||
        (roleCode != null && u.roleCodes.includes(roleCode)),
    )
    .map((u) => u.id);
}

export function computeSlaDueAt(
  severity: "low" | "medium" | "high",
  from: Date = new Date(),
): Date {
  const hours = severity === "high" ? 24 : severity === "low" ? 120 : 72;
  return new Date(from.getTime() + hours * 60 * 60 * 1000);
}
