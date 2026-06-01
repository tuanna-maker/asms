import type { Prisma } from "@prisma/client";

import { HttpError } from "../../lib/errors/HttpError";
import { prisma } from "../../utils/prisma";
import { resolveDateRange, type ReportDateFilters } from "../reports/service";

import { buildFeedbackAccessFilter } from "./assignee";
import { parseLinkageItemsJson } from "./linkage-items";
import type { FeedbackLinkageItem } from "./linkage-types";

export type FeedbackAnalyticsFilters = ReportDateFilters & {
  contractId?: string;
  status?: string;
  limit?: number;
};

export type FeedbackAnalyticsRow = {
  id: string;
  customerId: string;
  status: string;
  feedbackAt: Date;
  slaDueAt: Date | null;
  source: string;
  severity: string;
  linkageItems: unknown;
  customer?: { id: string; code: string; name: string } | null;
};

const OPEN_STATUSES = new Set(["new", "assigned", "in_progress", "pending_close", "reopened"]);

function isOpenStatus(status: string) {
  return OPEN_STATUSES.has(status);
}

function isOverdue(row: FeedbackAnalyticsRow, now: Date) {
  if (!row.slaDueAt || row.status === "resolved") return false;
  return row.slaDueAt.getTime() < now.getTime() && isOpenStatus(row.status);
}

function monthKey(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export async function buildAnalyticsWhere(
  filters: FeedbackAnalyticsFilters,
  viewer: { userId: string; roleCode: string | null },
): Promise<Prisma.CustomerFeedbackWhereInput> {
  const access = await buildFeedbackAccessFilter(viewer);
  const and: Prisma.CustomerFeedbackWhereInput[] = [{ deletedAt: null }];
  if (access.OR?.length) and.push(access);

  const range = resolveDateRange(filters);
  if (range) and.push({ feedbackAt: { gte: range.start, lte: range.end } });
  if (filters.customerId?.trim()) and.push({ customerId: filters.customerId.trim() });
  if (filters.contractId?.trim()) and.push({ contractId: filters.contractId.trim() });
  if (filters.status?.trim()) {
    and.push({ status: filters.status.trim() as "new" | "assigned" | "in_progress" | "pending_close" | "resolved" | "reopened" });
  }

  return { AND: and };
}

async function loadAnalyticsRows(where: Prisma.CustomerFeedbackWhereInput): Promise<FeedbackAnalyticsRow[]> {
  return prisma.customerFeedback.findMany({
    where,
    select: {
      id: true,
      customerId: true,
      status: true,
      feedbackAt: true,
      slaDueAt: true,
      source: true,
      severity: true,
      linkageItems: true,
      customer: { select: { id: true, code: true, name: true } },
    },
  });
}

export function aggregateFeedbackOverview(rows: FeedbackAnalyticsRow[], now = new Date()) {
  const byStatus: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};
  const byMonth: Record<string, number> = {};
  let overdue = 0;
  let withLinkage = 0;

  for (const row of rows) {
    byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;
    bySource[row.source] = (bySource[row.source] ?? 0) + 1;
    bySeverity[row.severity] = (bySeverity[row.severity] ?? 0) + 1;
    const mk = monthKey(row.feedbackAt);
    byMonth[mk] = (byMonth[mk] ?? 0) + 1;
    if (isOverdue(row, now)) overdue += 1;
    const lines = parseLinkageItemsJson(row.linkageItems as never);
    if (lines.length > 0) withLinkage += 1;
  }

  const monthly = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));

  const total = rows.length;
  const openCount = rows.filter((r) => isOpenStatus(r.status)).length;
  const resolvedCount = rows.filter((r) => r.status === "resolved").length;

  return {
    total,
    openCount,
    resolvedCount,
    overdue,
    withLinkage,
    linkageRate: total > 0 ? Math.round((withLinkage / total) * 1000) / 10 : 0,
    byStatus,
    bySource,
    bySeverity,
    monthly,
  };
}

export type FeedbackStatsByCustomerItem = {
  customerId: string;
  code: string;
  name: string;
  ticketCount: number;
  linkageLineCount: number;
  openCount: number;
  resolvedCount: number;
};

export function aggregateByCustomer(rows: FeedbackAnalyticsRow[], limit = 50): FeedbackStatsByCustomerItem[] {
  const map = new Map<string, FeedbackStatsByCustomerItem>();

  for (const row of rows) {
    const cid = row.customerId;
    const customer = row.customer;
    const prev =
      map.get(cid) ??
      ({
        customerId: cid,
        code: customer?.code ?? "",
        name: customer?.name ?? "Không xác định",
        ticketCount: 0,
        linkageLineCount: 0,
        openCount: 0,
        resolvedCount: 0,
      } satisfies FeedbackStatsByCustomerItem);

    prev.ticketCount += 1;
    if (isOpenStatus(row.status)) prev.openCount += 1;
    if (row.status === "resolved") prev.resolvedCount += 1;
    prev.linkageLineCount += parseLinkageItemsJson(row.linkageItems as never).length;
    map.set(cid, prev);
  }

  return [...map.values()].sort((a, b) => b.ticketCount - a.ticketCount).slice(0, limit);
}

export type FeedbackStatsMaterialRef = {
  materialId: string;
  code: string;
  name: string;
  count: number;
};

export type FeedbackStatsByProductItem = {
  productId: string;
  code: string;
  name: string;
  linkageLineCount: number;
  ticketCount: number;
  materials: FeedbackStatsMaterialRef[];
};

export function aggregateByProduct(rows: FeedbackAnalyticsRow[], limit = 50): FeedbackStatsByProductItem[] {
  const map = new Map<
    string,
    {
      productId: string;
      code: string;
      name: string;
      linkageLineCount: number;
      feedbackIds: Set<string>;
      materials: Map<string, FeedbackStatsMaterialRef>;
    }
  >();

  for (const row of rows) {
    const lines = parseLinkageItemsJson(row.linkageItems as never);
    for (const line of lines) {
      let bucket = map.get(line.productId);
      if (!bucket) {
        bucket = {
          productId: line.productId,
          code: line.productCode,
          name: line.productName,
          linkageLineCount: 0,
          feedbackIds: new Set<string>(),
          materials: new Map<string, FeedbackStatsMaterialRef>(),
        };
        map.set(line.productId, bucket);
      }
      bucket.linkageLineCount += 1;
      bucket.feedbackIds.add(row.id);
      if (line.materialId) {
        const mid = line.materialId;
        const mprev = bucket.materials.get(mid) ?? {
          materialId: mid,
          code: line.materialCode ?? mid,
          name: line.materialName ?? "",
          count: 0,
        };
        mprev.count += 1;
        bucket.materials.set(mid, mprev);
      }
    }
  }

  return [...map.values()]
    .map((p) => ({
      productId: p.productId,
      code: p.code,
      name: p.name,
      linkageLineCount: p.linkageLineCount,
      ticketCount: p.feedbackIds.size,
      materials: [...p.materials.values()].sort((a, b) => b.count - a.count),
    }))
    .sort((a, b) => b.linkageLineCount - a.linkageLineCount)
    .slice(0, limit);
}

export type FeedbackStatsByMaterialItem = {
  materialId: string;
  code: string;
  name: string;
  linkageLineCount: number;
  ticketCount: number;
  productCount: number;
  customerCount: number;
};

export function aggregateByMaterial(rows: FeedbackAnalyticsRow[], limit = 50): FeedbackStatsByMaterialItem[] {
  const map = new Map<
    string,
    {
      materialId: string;
      code: string;
      name: string;
      linkageLineCount: number;
      feedbackIds: Set<string>;
      productIds: Set<string>;
      customerIds: Set<string>;
    }
  >();

  for (const row of rows) {
    const lines = parseLinkageItemsJson(row.linkageItems as never);
    for (const line of lines) {
      if (!line.materialId) continue;
      const mid = line.materialId;
      let bucket = map.get(mid);
      if (!bucket) {
        bucket = {
          materialId: mid,
          code: line.materialCode ?? mid,
          name: line.materialName ?? "",
          linkageLineCount: 0,
          feedbackIds: new Set<string>(),
          productIds: new Set<string>(),
          customerIds: new Set<string>(),
        };
        map.set(mid, bucket);
      }
      bucket.linkageLineCount += 1;
      bucket.feedbackIds.add(row.id);
      bucket.productIds.add(line.productId);
      bucket.customerIds.add(row.customerId);
    }
  }

  return [...map.values()]
    .map((m) => ({
      materialId: m.materialId,
      code: m.code,
      name: m.name,
      linkageLineCount: m.linkageLineCount,
      ticketCount: m.feedbackIds.size,
      productCount: m.productIds.size,
      customerCount: m.customerIds.size,
    }))
    .sort((a, b) => b.linkageLineCount - a.linkageLineCount)
    .slice(0, limit);
}

async function loadFilteredRows(
  filters: FeedbackAnalyticsFilters,
  viewer: { userId: string; roleCode: string | null },
) {
  const where = await buildAnalyticsWhere(filters, viewer);
  return loadAnalyticsRows(where);
}

function resolveLimit(limit?: number) {
  if (limit && limit > 0) return Math.min(limit, 100);
  return 50;
}

export async function getFeedbackAnalyticsOverviewService(
  filters: FeedbackAnalyticsFilters,
  viewer: { userId: string; roleCode: string | null },
) {
  const rows = await loadFilteredRows(filters, viewer);
  return aggregateFeedbackOverview(rows);
}

export async function getFeedbackAnalyticsByCustomerService(
  filters: FeedbackAnalyticsFilters,
  viewer: { userId: string; roleCode: string | null },
) {
  const rows = await loadFilteredRows(filters, viewer);
  return { items: aggregateByCustomer(rows, resolveLimit(filters.limit)) };
}

export async function getFeedbackAnalyticsByProductService(
  filters: FeedbackAnalyticsFilters,
  viewer: { userId: string; roleCode: string | null },
) {
  const rows = await loadFilteredRows(filters, viewer);
  return { items: aggregateByProduct(rows, resolveLimit(filters.limit)) };
}

export async function getFeedbackAnalyticsByMaterialService(
  filters: FeedbackAnalyticsFilters,
  viewer: { userId: string; roleCode: string | null },
) {
  const rows = await loadFilteredRows(filters, viewer);
  return { items: aggregateByMaterial(rows, resolveLimit(filters.limit)) };
}

export type FeedbackCustomerStatsDetailTicket = {
  id: string;
  title: string;
  content: string;
  status: string;
  feedbackAt: string;
  linkageItems: FeedbackLinkageItem[];
};

export type FeedbackCustomerStatsDetail = {
  customer: { id: string; code: string; name: string };
  summary: {
    ticketCount: number;
    openCount: number;
    resolvedCount: number;
    linkageLineCount: number;
  };
  tickets: FeedbackCustomerStatsDetailTicket[];
};

export async function getFeedbackAnalyticsCustomerDetailService(
  customerId: string,
  filters: FeedbackAnalyticsFilters,
  viewer: { userId: string; roleCode: string | null },
): Promise<FeedbackCustomerStatsDetail> {
  const where = await buildAnalyticsWhere({ ...filters, customerId }, viewer);
  const rows = await prisma.customerFeedback.findMany({
    where,
    orderBy: { feedbackAt: "desc" },
    select: {
      id: true,
      title: true,
      content: true,
      status: true,
      feedbackAt: true,
      linkageItems: true,
      customer: { select: { id: true, code: true, name: true } },
    },
  });

  if (rows.length === 0) {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, deletedAt: null },
      select: { id: true, code: true, name: true },
    });
    if (!customer) throw new HttpError(404, "Không tìm thấy khách hàng");
    return {
      customer,
      summary: { ticketCount: 0, openCount: 0, resolvedCount: 0, linkageLineCount: 0 },
      tickets: [],
    };
  }

  let openCount = 0;
  let resolvedCount = 0;
  let linkageLineCount = 0;
  const tickets: FeedbackCustomerStatsDetailTicket[] = rows.map((row) => {
    const linkageItems = parseLinkageItemsJson(row.linkageItems as never);
    linkageLineCount += linkageItems.length;
    if (isOpenStatus(row.status)) openCount += 1;
    if (row.status === "resolved") resolvedCount += 1;
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      status: row.status,
      feedbackAt: row.feedbackAt.toISOString(),
      linkageItems,
    };
  });

  const c = rows[0].customer!;
  return {
    customer: { id: c.id, code: c.code, name: c.name },
    summary: {
      ticketCount: rows.length,
      openCount,
      resolvedCount,
      linkageLineCount,
    },
    tickets,
  };
}

/** @internal test helper */
export function _rowsFromFixtures(
  fixtures: Array<{
    id: string;
    customerId: string;
    status: string;
    feedbackAt: string;
    slaDueAt?: string | null;
    source?: string;
    severity?: string;
    linkageItems?: FeedbackLinkageItem[];
    customer?: { id: string; code: string; name: string };
  }>,
): FeedbackAnalyticsRow[] {
  return fixtures.map((f) => ({
    id: f.id,
    customerId: f.customerId,
    status: f.status,
    feedbackAt: new Date(f.feedbackAt),
    slaDueAt: f.slaDueAt ? new Date(f.slaDueAt) : null,
    source: f.source ?? "external",
    severity: f.severity ?? "medium",
    linkageItems: f.linkageItems ?? [],
    customer: f.customer ?? null,
  }));
}
