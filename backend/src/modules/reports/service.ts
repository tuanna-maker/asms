import type { Prisma } from "@prisma/client";

import { prisma } from "../../utils/prisma";

function getYearRange(year?: string) {
  if (!year) return null;
  const y = Number(year);
  if (!Number.isFinite(y) || y < 1970 || y > 2100) return null;
  const start = new Date(`${y}-01-01T00:00:00.000Z`);
  const end = new Date(`${y}-12-31T23:59:59.999Z`);
  return { start, end };
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
}) {
  const buckets = Array.from({ length: 12 }, (_, i) => ({
    month: `T${i + 1}`,
    contracts: 0,
    complaints: 0,
    handovers: 0,
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

  return buckets;
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

function percentChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

export async function getReportsService(filters: { year?: string }) {
  const range = getYearRange(filters.year);
  const prevRange = filters.year ? getYearRange(String(Number(filters.year) - 1)) : null;

  const contractWhere: Prisma.ContractWhereInput = { deletedAt: null };
  if (range) contractWhere.startDate = { gte: range.start, lte: range.end };

  const handoverWhere: Prisma.HandoverWhereInput = { deletedAt: null };
  if (range) handoverWhere.startDate = { gte: range.start, lte: range.end };

  const trainingWhere: Prisma.TrainingCourseWhereInput = { deletedAt: null };
  if (range) trainingWhere.startDate = { gte: range.start, lte: range.end };

  const warrantyWhere: Prisma.WarrantyWhereInput = { deletedAt: null };
  if (range) warrantyWhere.createdAt = { gte: range.start, lte: range.end };
  const taskWhere: Prisma.TaskWhereInput = { deletedAt: null };
  if (range) taskWhere.createdAt = { gte: range.start, lte: range.end };
  const prevContractWhere: Prisma.ContractWhereInput = { deletedAt: null };
  if (prevRange) prevContractWhere.startDate = { gte: prevRange.start, lte: prevRange.end };
  const prevWarrantyWhere: Prisma.WarrantyWhereInput = { deletedAt: null };
  if (prevRange) prevWarrantyWhere.createdAt = { gte: prevRange.start, lte: prevRange.end };

  const [contractsRows, handoversRows, trainingRows, warrantyRows, taskRows, customersTotal, productsDeliveredTotal, prevContractsCount, prevWarrantiesCount, prevProductsDelivered] = await Promise.all([
    prisma.contract.findMany({
      where: contractWhere,
      select: { status: true, startDate: true, value: true, customer: { select: { name: true, code: true } } },
    }),
    prisma.handover.findMany({ where: handoverWhere, select: { status: true, startDate: true } }),
    prisma.trainingCourse.findMany({ where: trainingWhere, select: { status: true } }),
    prisma.warranty.findMany({ where: warrantyWhere, select: { status: true, type: true, createdAt: true } }),
    prisma.task.findMany({
      where: taskWhere,
      select: { status: true, deadline: true, completedAt: true, assignee: { select: { role: { select: { code: true } } } } },
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
    meta: { year: filters.year ?? null },
    customers: { total: customersTotal },
  };
}

