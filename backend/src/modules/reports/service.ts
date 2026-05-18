import type { Prisma } from "@prisma/client";

import { prisma } from "../../utils/prisma";

export type ReportDateFilters = Partial<Record<"year" | "from" | "to" | "customerId", string>>;

function getYearRange(year?: string) {
  if (!year) return null;
  const y = Number(year);
  if (!Number.isFinite(y) || y < 1970 || y > 2100) return null;
  const start = new Date(`${y}-01-01T00:00:00.000Z`);
  const end = new Date(`${y}-12-31T23:59:59.999Z`);
  return { start, end };
}

/** Ưu tiên from/to; không có thì suy từ year. */
export function resolveDateRange(filters: ReportDateFilters): { start: Date; end: Date } | null {
  if (filters.from || filters.to) {
    const start = filters.from ? new Date(filters.from.includes("T") ? filters.from : `${filters.from}T00:00:00.000Z`) : new Date("1970-01-01T00:00:00.000Z");
    const end = filters.to
      ? new Date(filters.to.includes("T") ? filters.to : `${filters.to}T23:59:59.999Z`)
      : new Date();
    return { start, end };
  }
  return getYearRange(filters.year);
}

function groupByStatus<T extends string>(rows: { status: T }[]) {
  const map: Record<string, number> = {};
  for (const r of rows) map[r.status] = (map[r.status] ?? 0) + 1;
  return map;
}

function groupByType(rows: { type: string }[]) {
  const map: Record<string, number> = {};
  for (const r of rows) map[r.type] = (map[r.type] ?? 0) + 1;
  return map;
}

function buildMonthlyTrend(args: {
  contracts: { startDate: Date }[];
  handovers: { startDate: Date }[];
  warranties: { createdAt: Date }[];
  products?: { updatedAt: Date; status: string }[];
  trainings?: { startDate: Date }[];
}) {
  const buckets = Array.from({ length: 12 }, (_, i) => ({
    month: `T${i + 1}`,
    contracts: 0,
    complaints: 0,
    handovers: 0,
    production: 0,
    training: 0,
  }));

  for (const r of args.contracts) {
    const m = new Date(r.startDate).getMonth();
    if (m >= 0 && m < 12 && buckets[m]) buckets[m].contracts += 1;
  }
  for (const r of args.handovers) {
    const m = new Date(r.startDate).getMonth();
    if (m >= 0 && m < 12 && buckets[m]) buckets[m].handovers += 1;
  }
  for (const r of args.warranties) {
    const m = new Date(r.createdAt).getMonth();
    if (m >= 0 && m < 12 && buckets[m]) buckets[m].complaints += 1;
  }
  for (const r of args.products ?? []) {
    if (r.status !== "produced") continue;
    const m = new Date(r.updatedAt).getMonth();
    if (m >= 0 && m < 12 && buckets[m]) buckets[m].production += 1;
  }
  for (const r of args.trainings ?? []) {
    const m = new Date(r.startDate).getMonth();
    if (m >= 0 && m < 12 && buckets[m]) buckets[m].training += 1;
  }

  return buckets;
}

function buildPakdMaterials(
  materials: Array<{ warehouse: string; quantity: number; available: number; expiresAt: Date | null }>,
  now: Date,
) {
  const pakdBuckets = new Map<
    string,
    { name: string; warehouse: string; total: number; remaining: number; expiresAt: Date | null }
  >();
  let valid = 0;
  let expired = 0;
  for (const m of materials) {
    const key = m.warehouse || "Kho chung";
    const prev = pakdBuckets.get(key) ?? {
      name: key,
      warehouse: key,
      total: 0,
      remaining: 0,
      expiresAt: m.expiresAt,
    };
    prev.total += m.quantity;
    prev.remaining += m.available;
    if (m.expiresAt && (!prev.expiresAt || m.expiresAt < prev.expiresAt)) {
      prev.expiresAt = m.expiresAt;
    }
    pakdBuckets.set(key, prev);
    if (!m.expiresAt || m.expiresAt > now) valid += 1;
    else expired += 1;
  }
  const items = Array.from(pakdBuckets.values())
    .map((p) => ({
      name: p.name,
      warehouse: p.warehouse,
      total: p.total,
      remaining: p.remaining,
      expiresAt: p.expiresAt?.toISOString() ?? null,
    }))
    .sort((a, b) => b.total - a.total);
  return { total: materials.length, valid, expired, items };
}

function buildPakdResearch(
  projects: Array<{
    id: string;
    code: string;
    name: string;
    budget: unknown;
    budgetSpent: unknown;
    endDate: Date;
    status: string;
  }>,
  now: Date,
) {
  let valid = 0;
  let expired = 0;
  const items = projects.map((p) => {
    const budget = Number(p.budget ?? 0);
    const spent = Number(p.budgetSpent ?? 0);
    const remaining = Math.max(0, budget - spent);
    const isExpired =
      p.endDate <= now || p.status === "completed" || p.status === "suspended";
    if (isExpired) expired += 1;
    else valid += 1;
    return {
      id: p.id,
      code: p.code,
      name: p.name,
      budget,
      remaining,
      expiresAt: p.endDate.toISOString(),
    };
  });
  return { total: projects.length, valid, expired, items };
}

function buildContractsByCustomer(rows: Array<{ value: unknown; customer: { name: string; code: string } | null }>) {
  const map = new Map<string, { name: string; contracts: number; value: number }>();
  for (const row of rows) {
    const key = row.customer?.code ?? "UNKNOWN";
    const name = row.customer?.name ?? "Không xác định";
    const amount = Number(row.value ?? 0);
    const prev = map.get(key) ?? { name, contracts: 0, value: 0 };
    prev.contracts += 1;
    prev.value += Number.isFinite(amount) ? amount : 0;
    map.set(key, prev);
  }
  return Array.from(map.values()).sort((a, b) => b.contracts - a.contracts || b.value - a.value);
}

function buildUnitPerformance(
  rows: Array<{
    status: string;
    deadline: Date | null;
    completedAt: Date | null;
    assignee: { role: { code: string } | null } | null;
  }>,
) {
  const map = new Map<string, { unit: string; tasks: number; completed: number; onTime: number; satisfaction: number }>();

  for (const row of rows) {
    const roleCode = row.assignee?.role?.code ?? "unknown";
    const unit =
      roleCode === "admin"
        ? "Đơn vị Quản trị"
        : roleCode === "manager"
          ? "Đơn vị Quản lý"
          : roleCode === "technician"
            ? "Đơn vị Kỹ thuật"
            : roleCode === "viewer"
              ? "Đơn vị Giám sát"
              : roleCode === "sales"
                ? "Đơn vị Kinh doanh"
                : "Đơn vị chưa gán";

    const current = map.get(roleCode) ?? { unit, tasks: 0, completed: 0, onTime: 0, satisfaction: 0 };
    current.tasks += 1;
    if (row.status === "completed") {
      current.completed += 1;
      if (row.deadline && row.completedAt && row.completedAt.getTime() <= row.deadline.getTime()) {
        current.onTime += 1;
      }
    }
    map.set(roleCode, current);
  }

  const result = Array.from(map.values()).map((u) => {
    const completionRatio = u.tasks > 0 ? u.completed / u.tasks : 0;
    const onTimeRatio = u.completed > 0 ? u.onTime / u.completed : 0;
    const satisfaction = Math.round((completionRatio * 0.6 + onTimeRatio * 0.4) * 100);
    return { ...u, satisfaction };
  });

  return result.sort((a, b) => b.tasks - a.tasks);
}

export async function getMaterialDefectsService(filters: ReportDateFilters & { limit?: number }) {
  const range = resolveDateRange(filters);
  const where: Prisma.WarrantyWhereInput = { deletedAt: null, productId: { not: null } };
  if (range) where.createdAt = { gte: range.start, lte: range.end };

  const warranties = await prisma.warranty.findMany({
    where,
    select: { productId: true },
  });

  const productCounts = new Map<string, number>();
  for (const w of warranties) {
    if (!w.productId) continue;
    productCounts.set(w.productId, (productCounts.get(w.productId) ?? 0) + 1);
  }
  const productIds = Array.from(productCounts.keys());
  if (productIds.length === 0) {
    return { items: [], totalWarranties: warranties.length };
  }

  const boms = await prisma.productBom.findMany({
    where: { productId: { in: productIds } },
    select: {
      productId: true,
      quantity: true,
      material: { select: { id: true, code: true, name: true, type: true, unit: true } },
    },
  });

  const materialMap = new Map<
    string,
    { id: string; code: string; name: string; type: string; unit: string; defects: number; estimateQty: number; productIds: Set<string> }
  >();
  for (const bom of boms) {
    const incidents = productCounts.get(bom.productId) ?? 0;
    if (incidents === 0) continue;
    const key = bom.material.id;
    const prev = materialMap.get(key) ?? {
      id: bom.material.id,
      code: bom.material.code,
      name: bom.material.name,
      type: bom.material.type as unknown as string,
      unit: bom.material.unit,
      defects: 0,
      estimateQty: 0,
      productIds: new Set<string>(),
    };
    prev.defects += incidents;
    prev.estimateQty += incidents * bom.quantity;
    prev.productIds.add(bom.productId);
    materialMap.set(key, prev);
  }

  const items = Array.from(materialMap.values())
    .map((m) => ({
      id: m.id,
      code: m.code,
      name: m.name,
      type: m.type,
      unit: m.unit,
      defects: m.defects,
      estimateQty: m.estimateQty,
      affectedProducts: m.productIds.size,
    }))
    .sort((a, b) => b.defects - a.defects);

  const limit = filters.limit && filters.limit > 0 ? filters.limit : items.length;
  return { items: items.slice(0, limit), totalWarranties: warranties.length };
}

export async function getBadgesService(args: { userId?: string | null }) {
  const now = new Date();

  const [
    overdueHandovers,
    openWarranties,
    lateTasks,
    upcomingTrainings,
    unreadNotifications,
    overdueContracts,
  ] = await Promise.all([
    prisma.handover.count({
      where: {
        deletedAt: null,
        status: { in: ["pending", "active", "late"] },
        dueDate: { lt: now },
      },
    }),
    prisma.warranty.count({
      where: {
        deletedAt: null,
        status: { in: ["open", "processing"] },
      },
    }),
    prisma.task.count({
      where: {
        deletedAt: null,
        status: { in: ["todo", "in_progress", "review", "delayed"] },
        deadline: { lt: now },
      },
    }),
    prisma.trainingCourse.count({
      where: {
        deletedAt: null,
        status: "planned",
        startDate: { gte: now, lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    args.userId
      ? prisma.notification.count({ where: { readAt: null, userId: args.userId } })
      : Promise.resolve(0),
    prisma.contract.count({
      where: {
        deletedAt: null,
        status: "late",
      },
    }),
  ]);

  return {
    overdueHandovers,
    openWarranties,
    lateTasks,
    upcomingTrainings,
    unreadNotifications,
    overdueContracts,
  };
}

function percentChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

export async function getReportsByProductLineService(filters: ReportDateFilters) {
  const range = resolveDateRange(filters);
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    select: { id: true, category: true, totalProduced: true },
  });

  const categoryMap = new Map<string, { category: string; produced: number; delivered: number; warrantyCount: number }>();
  for (const p of products) {
    const cat = p.category?.trim() || "Khác";
    const prev = categoryMap.get(cat) ?? { category: cat, produced: 0, delivered: 0, warrantyCount: 0 };
    prev.produced += p.totalProduced;
    categoryMap.set(cat, prev);
  }

  if (range) {
    const cpRows = await prisma.contractProduct.findMany({
      where: {
        deletedAt: null,
        contract: { deletedAt: null, startDate: { gte: range.start, lte: range.end } },
        product: { deletedAt: null },
      },
      select: { quantity: true, product: { select: { category: true } } },
    });
    for (const row of cpRows) {
      const cat = row.product.category?.trim() || "Khác";
      const prev = categoryMap.get(cat) ?? { category: cat, produced: 0, delivered: 0, warrantyCount: 0 };
      prev.delivered += row.quantity;
      categoryMap.set(cat, prev);
    }

    const warrantyRows = await prisma.warranty.findMany({
      where: {
        deletedAt: null,
        createdAt: { gte: range.start, lte: range.end },
        productId: { not: null },
      },
      select: { product: { select: { category: true } } },
    });
    for (const w of warrantyRows) {
      const cat = w.product?.category?.trim() || "Khác";
      const prev = categoryMap.get(cat) ?? { category: cat, produced: 0, delivered: 0, warrantyCount: 0 };
      prev.warrantyCount += 1;
      categoryMap.set(cat, prev);
    }
  }

  const items = Array.from(categoryMap.values()).sort(
    (a, b) => b.warrantyCount - a.warrantyCount || b.delivered - a.delivered,
  );
  return { items };
}

export async function getReportsFeedbackByCustomerService(filters: ReportDateFilters) {
  const range = resolveDateRange(filters);
  const where: Prisma.WarrantyWhereInput = { deletedAt: null };
  if (range) where.createdAt = { gte: range.start, lte: range.end };

  const rows = await prisma.warranty.findMany({
    where,
    select: {
      type: true,
      customer: { select: { id: true, name: true, code: true } },
    },
  });

  const map = new Map<string, { customerId: string; name: string; tickets: number; byType: Record<string, number> }>();
  for (const r of rows) {
    const id = r.customer?.id ?? "unknown";
    const name = r.customer?.name ?? "Không xác định";
    const prev = map.get(id) ?? { customerId: id, name, tickets: 0, byType: {} };
    prev.tickets += 1;
    const t = r.type as string;
    prev.byType[t] = (prev.byType[t] ?? 0) + 1;
    map.set(id, prev);
  }

  return { items: Array.from(map.values()).sort((a, b) => b.tickets - a.tickets) };
}

export async function getReportsFeedbackByProductLineService(filters: ReportDateFilters) {
  const range = resolveDateRange(filters);
  const where: Prisma.WarrantyWhereInput = { deletedAt: null, productId: { not: null } };
  if (range) where.createdAt = { gte: range.start, lte: range.end };

  const rows = await prisma.warranty.findMany({
    where,
    select: {
      type: true,
      product: { select: { category: true } },
    },
  });

  const map = new Map<string, { category: string; tickets: number; byType: Record<string, number> }>();
  for (const r of rows) {
    const cat = r.product?.category?.trim() || "Khác";
    const prev = map.get(cat) ?? { category: cat, tickets: 0, byType: {} };
    prev.tickets += 1;
    const t = r.type as string;
    prev.byType[t] = (prev.byType[t] ?? 0) + 1;
    map.set(cat, prev);
  }

  return { items: Array.from(map.values()).sort((a, b) => b.tickets - a.tickets) };
}

const DEFAULT_SLA_HOURS = 72;

function isWarrantyOnTime(row: { createdAt: Date; resolvedAt: Date | null; slaHours: number | null }) {
  if (!row.resolvedAt) return false;
  const slaMs = (row.slaHours ?? DEFAULT_SLA_HOURS) * 60 * 60 * 1000;
  return row.resolvedAt.getTime() - row.createdAt.getTime() <= slaMs;
}

function nextAnniversaryDate(occursAt: Date, recurringYearly: boolean, now: Date): Date {
  if (!recurringYearly) return occursAt;
  const next = new Date(occursAt);
  next.setFullYear(now.getFullYear());
  if (next < now) next.setFullYear(now.getFullYear() + 1);
  return next;
}

export async function getDashboardSummaryService(filters: ReportDateFilters) {
  const range = resolveDateRange(filters);
  const now = new Date();
  const customerId = filters.customerId?.trim() || undefined;

  const contractWhere: Prisma.ContractWhereInput = { deletedAt: null };
  if (range) contractWhere.startDate = { gte: range.start, lte: range.end };
  if (customerId) contractWhere.customerId = customerId;

  const handoverWhere: Prisma.HandoverWhereInput = { deletedAt: null };
  if (range) handoverWhere.startDate = { gte: range.start, lte: range.end };
  if (customerId) handoverWhere.customerId = customerId;

  const trainingWhere: Prisma.TrainingCourseWhereInput = { deletedAt: null };
  if (range) trainingWhere.startDate = { gte: range.start, lte: range.end };
  if (customerId) trainingWhere.customerId = customerId;

  const warrantyWhere: Prisma.WarrantyWhereInput = { deletedAt: null };
  if (range) warrantyWhere.createdAt = { gte: range.start, lte: range.end };
  if (customerId) warrantyWhere.customerId = customerId;

  const productWhere: Prisma.ProductWhereInput = { deletedAt: null };

  const customerWhere: Prisma.CustomerWhereInput = { deletedAt: null };
  if (customerId) customerWhere.id = customerId;

  const anniversaryWhere: Prisma.CustomerAnniversaryWhereInput = {};
  if (customerId) anniversaryWhere.customerId = customerId;

  const [
    products,
    contracts,
    handovers,
    trainings,
    warranties,
    customers,
    materials,
    researchProjects,
    anniversaries,
    contractProductsByCustomer,
  ] = await Promise.all([
    prisma.product.findMany({ where: productWhere, select: { status: true } }),
    prisma.contract.findMany({
      where: contractWhere,
      select: { status: true, customerId: true, value: true, endDate: true, updatedAt: true },
    }),
    prisma.handover.findMany({
      where: handoverWhere,
      select: { status: true, completedAt: true, dueDate: true },
    }),
    prisma.trainingCourse.findMany({
      where: trainingWhere,
      select: { status: true, endDate: true, updatedAt: true },
    }),
    prisma.warranty.findMany({
      where: warrantyWhere,
      select: { status: true, type: true, createdAt: true, resolvedAt: true, slaHours: true, customerId: true },
    }),
    prisma.customer.findMany({
      where: customerWhere,
      select: { id: true, name: true, revenueTotal: true, expenseTotal: true },
    }),
    prisma.material.findMany({
      where: { deletedAt: null },
      select: { warehouse: true, quantity: true, available: true, expiresAt: true },
    }),
    prisma.researchProject.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        code: true,
        name: true,
        budget: true,
        budgetSpent: true,
        endDate: true,
        status: true,
      },
    }),
    prisma.customerAnniversary.findMany({
      where: anniversaryWhere,
      select: {
        customerId: true,
        type: true,
        label: true,
        occursAt: true,
        recurringYearly: true,
        customer: { select: { name: true } },
      },
    }),
    prisma.contractProduct.groupBy({
      by: ["contractId"],
      where: {
        deletedAt: null,
        contract: contractWhere,
      },
      _sum: { quantity: true },
    }),
  ]);

  const contractIds = await prisma.contract.findMany({
    where: contractWhere,
    select: { id: true, customerId: true },
  });
  const contractCustomerMap = new Map(contractIds.map((c) => [c.id, c.customerId]));
  const deliveredByCustomer = new Map<string, number>();
  for (const row of contractProductsByCustomer) {
    const customerId = contractCustomerMap.get(row.contractId);
    if (!customerId) continue;
    deliveredByCustomer.set(
      customerId,
      (deliveredByCustomer.get(customerId) ?? 0) + (row._sum.quantity ?? 0),
    );
  }

  const productByStatus = groupByStatus(products);
  const productProgress = {
    quantity: {
      producing: (productByStatus.producing ?? 0) + (productByStatus.developing ?? 0),
      produced: productByStatus.produced ?? 0,
    },
    inspection: {
      submitted: productByStatus.inspection_submitted ?? 0,
      inspecting: productByStatus.inspecting ?? 0,
      passed: productByStatus.inspection_passed ?? 0,
    },
    decisionApproved: productByStatus.decision_approved ?? 0,
    equipped: productByStatus.equipped ?? 0,
    equipDecided: productByStatus.equip_decided ?? 0,
  };

  const contractActive = contracts.filter((c) => c.status === "active" || c.status === "draft").length;
  let contractCompletedOnTime = 0;
  let contractCompletedLate = 0;
  for (const c of contracts) {
    if (c.status === "late") {
      contractCompletedLate += 1;
    } else if (c.status === "completed" || c.status === "liquidated") {
      const endMs = new Date(c.endDate).setHours(23, 59, 59, 999);
      if (c.updatedAt.getTime() > endMs) contractCompletedLate += 1;
      else contractCompletedOnTime += 1;
    }
  }

  const warrantyWarranty = warranties.filter((w) => w.type === "warranty").length;
  const warrantyRepair = warranties.filter((w) => w.type === "repair" || w.type === "maintenance").length;
  const warrantyProcessing = warranties.filter((w) => w.status === "open" || w.status === "processing").length;
  const completedWarranties = warranties.filter((w) => w.status === "completed");
  const warrantyOnTime = completedWarranties.filter((w) => isWarrantyOnTime(w)).length;
  const warrantyLate = completedWarranties.filter((w) => !isWarrantyOnTime(w)).length;

  const handoverActive = handovers.filter((h) => h.status === "pending" || h.status === "active").length;
  let handoverOnTime = 0;
  let handoverLate = 0;
  for (const h of handovers) {
    if (h.status === "late") {
      handoverLate += 1;
    } else if (h.status === "completed") {
      if (h.completedAt && h.completedAt.getTime() > h.dueDate.getTime()) handoverLate += 1;
      else handoverOnTime += 1;
    }
  }

  const trainingActive = trainings.filter((t) => t.status === "planned" || t.status === "ongoing").length;
  let trainingOnTime = 0;
  let trainingLate = 0;
  for (const t of trainings) {
    if (t.status !== "completed") continue;
    const endMs = new Date(t.endDate).setHours(23, 59, 59, 999);
    if (t.updatedAt.getTime() > endMs) trainingLate += 1;
    else trainingOnTime += 1;
  }

  const warrantyByCustomer = new Map<string, { processing: number; onTime: number; late: number }>();
  for (const w of warranties) {
    const cid = w.customerId;
    const prev = warrantyByCustomer.get(cid) ?? { processing: 0, onTime: 0, late: 0 };
    if (w.status === "open" || w.status === "processing") prev.processing += 1;
    else if (w.status === "completed") {
      if (isWarrantyOnTime(w)) prev.onTime += 1;
      else prev.late += 1;
    }
    warrantyByCustomer.set(cid, prev);
  }

  const revenueByCustomer = new Map<string, number>();
  for (const c of contracts) {
    const amount = Number(c.value ?? 0);
    revenueByCustomer.set(c.customerId, (revenueByCustomer.get(c.customerId) ?? 0) + amount);
  }

  const customerBreakdown = customers.map((c) => ({
    id: c.id,
    name: c.name,
    revenue: Number(revenueByCustomer.get(c.id) ?? c.revenueTotal ?? 0),
    expense: Number(c.expenseTotal ?? 0),
    productsDelivered: deliveredByCustomer.get(c.id) ?? 0,
    complaints: warrantyByCustomer.get(c.id) ?? { processing: 0, onTime: 0, late: 0 },
  }));

  const horizonMs = 30 * 24 * 60 * 60 * 1000;
  const upcomingAnniversaries = anniversaries
    .map((a) => {
      const next = nextAnniversaryDate(a.occursAt, a.recurringYearly, now);
      const daysUntil = Math.ceil((next.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      return {
        customerId: a.customerId,
        customerName: a.customer.name,
        type: a.type,
        label: a.label,
        occursAt: next.toISOString(),
        daysUntil,
      };
    })
    .filter((a) => a.daysUntil >= 0 && a.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const pakdMaterials = buildPakdMaterials(materials, now);
  const pakdResearch = buildPakdResearch(researchProjects, now);

  return {
    productProgress,
    contractProgress: {
      total: contracts.length,
      active: contractActive,
      completedOnTime: contractCompletedOnTime,
      completedLate: contractCompletedLate,
    },
    complaintProgress: {
      total: warranties.length,
      warranty: warrantyWarranty,
      repair: warrantyRepair,
      processing: warrantyProcessing,
      completedOnTime: warrantyOnTime,
      completedLate: warrantyLate,
    },
    handoverProgress: {
      total: handovers.length,
      active: handoverActive,
      completedOnTime: handoverOnTime,
      completedLate: handoverLate,
    },
    trainingProgress: {
      totalBatches: trainings.length,
      active: trainingActive,
      completedOnTime: trainingOnTime,
      completedLate: trainingLate,
    },
    customerCare: {
      totalCustomers: customers.length,
      customerBreakdown,
      upcomingAnniversaries,
    },
    pakd: {
      materials: pakdMaterials,
      research: pakdResearch,
      total: pakdMaterials.total,
      valid: pakdMaterials.valid,
      expired: pakdMaterials.expired,
      items: pakdMaterials.items,
    },
    meta: {
      year: filters.year ?? (range ? String(range.start.getUTCFullYear()) : null),
      from: filters.from ?? (range ? range.start.toISOString().slice(0, 10) : null),
      to: filters.to ?? (range ? range.end.toISOString().slice(0, 10) : null),
      customerId: customerId ?? null,
    },
  };
}

export async function getReportsService(filters: ReportDateFilters) {
  const range = resolveDateRange(filters);
  const yearForPrev = filters.year ?? (range ? String(range.start.getUTCFullYear()) : undefined);
  const prevRange = yearForPrev ? getYearRange(String(Number(yearForPrev) - 1)) : null;
  const customerId = filters.customerId?.trim() || undefined;

  const contractWhere: Prisma.ContractWhereInput = { deletedAt: null };
  if (range) contractWhere.startDate = { gte: range.start, lte: range.end };
  if (customerId) contractWhere.customerId = customerId;

  const handoverWhere: Prisma.HandoverWhereInput = { deletedAt: null };
  if (range) handoverWhere.startDate = { gte: range.start, lte: range.end };
  if (customerId) handoverWhere.customerId = customerId;

  const trainingWhere: Prisma.TrainingCourseWhereInput = { deletedAt: null };
  if (range) trainingWhere.startDate = { gte: range.start, lte: range.end };
  if (customerId) trainingWhere.customerId = customerId;

  const warrantyWhere: Prisma.WarrantyWhereInput = { deletedAt: null };
  if (range) warrantyWhere.createdAt = { gte: range.start, lte: range.end };
  if (customerId) warrantyWhere.customerId = customerId;

  const productTrendWhere: Prisma.ProductWhereInput = { deletedAt: null, status: "produced" };
  if (range) productTrendWhere.updatedAt = { gte: range.start, lte: range.end };
  const taskWhere: Prisma.TaskWhereInput = { deletedAt: null };
  if (range) taskWhere.createdAt = { gte: range.start, lte: range.end };
  const prevContractWhere: Prisma.ContractWhereInput = { deletedAt: null };
  if (prevRange) prevContractWhere.startDate = { gte: prevRange.start, lte: prevRange.end };
  const prevWarrantyWhere: Prisma.WarrantyWhereInput = { deletedAt: null };
  if (prevRange) prevWarrantyWhere.createdAt = { gte: prevRange.start, lte: prevRange.end };

  const [contractsRows, handoversRows, trainingRows, warrantyRows, taskRows, productTrendRows, customersTotal, productsDeliveredTotal, prevContractsCount, prevWarrantiesCount, prevProductsDelivered] = await Promise.all([
    prisma.contract.findMany({
      where: contractWhere,
      select: {
        id: true,
        code: true,
        title: true,
        status: true,
        startDate: true,
        value: true,
        progress: true,
        customer: { select: { name: true, code: true } },
      },
    }),
    prisma.handover.findMany({ where: handoverWhere, select: { status: true, startDate: true } }),
    prisma.trainingCourse.findMany({ where: trainingWhere, select: { status: true, startDate: true } }),
    prisma.warranty.findMany({ where: warrantyWhere, select: { status: true, type: true, createdAt: true } }),
    prisma.task.findMany({
      where: taskWhere,
      select: { status: true, deadline: true, completedAt: true, assignee: { select: { role: { select: { code: true } } } } },
    }),
    prisma.product.findMany({
      where: productTrendWhere,
      select: { status: true, updatedAt: true },
    }),
    prisma.customer.count({ where: { deletedAt: null } }),
    prisma.contract.aggregate({
      where: contractWhere,
      _sum: { products: true },
    }),
    prisma.contract.count({ where: prevContractWhere }),
    prisma.warranty.count({ where: prevWarrantyWhere }),
    prisma.contract.aggregate({
      where: prevContractWhere,
      _sum: { products: true },
    }),
  ]);

  const monthly = buildMonthlyTrend({
    contracts: contractsRows.map((r) => ({ startDate: r.startDate })),
    handovers: handoversRows.map((r) => ({ startDate: r.startDate })),
    warranties: warrantyRows.map((r) => ({ createdAt: r.createdAt })),
    products: productTrendRows,
    trainings: trainingRows.map((r) => ({ startDate: r.startDate })),
  });
  const byCustomer = buildContractsByCustomer(contractsRows);
  const unitPerformance = buildUnitPerformance(taskRows as Array<{
    status: string;
    deadline: Date | null;
    completedAt: Date | null;
    assignee: { role: { code: string } | null } | null;
  }>);
  const deliveredCurrent = productsDeliveredTotal._sum.products ?? 0;
  const deliveredPrev = prevProductsDelivered._sum.products ?? 0;

  return {
    contracts: {
      total: contractsRows.length,
      byStatus: groupByStatus(contractsRows),
    },
    products: {
      deliveredTotal: deliveredCurrent,
    },
    handovers: {
      total: handoversRows.length,
      byStatus: groupByStatus(handoversRows as { status: string }[]),
    },
    training_courses: {
      total: trainingRows.length,
      byStatus: groupByStatus(trainingRows),
    },
    warranties: {
      total: warrantyRows.length,
      byStatus: groupByStatus(warrantyRows as { status: string }[]),
      byType: groupByType(warrantyRows as { type: string }[]),
    },
    trends: { monthly },
    customer_breakdown: byCustomer,
    unit_performance: unitPerformance,
    summary_delta: {
      contractsPct: percentChange(contractsRows.length, prevContractsCount),
      deliveredPct: percentChange(deliveredCurrent, deliveredPrev),
      warrantiesPct: percentChange(warrantyRows.length, prevWarrantiesCount),
    },
    meta: {
      year: filters.year ?? (range ? String(range.start.getUTCFullYear()) : null),
      from: filters.from ?? (range ? range.start.toISOString().slice(0, 10) : null),
      to: filters.to ?? (range ? range.end.toISOString().slice(0, 10) : null),
    },
    customers: { total: customersTotal },
    contracts_list: contractsRows.map((c) => ({
      id: c.id,
      code: c.code,
      title: c.title,
      status: c.status,
      value: Number(c.value ?? 0),
      progress: c.progress ?? 0,
      startDate: c.startDate.toISOString(),
      customerName: c.customer?.name ?? "—",
    })),
  };
}

