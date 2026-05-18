import type { Prisma } from "@prisma/client";

import { prisma } from "../../utils/prisma";

export type AuditLogFilters = {
  actorId?: string;
  entity?: string;
  entityId?: string;
  action?: string;
  search?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

export type AuditLogListResult = {
  rows: Array<{
    id: string;
    actorId: string | null;
    actorRole: string | null;
    actorName: string | null;
    actorEmail: string | null;
    action: string;
    entity: string;
    entityId: string | null;
    summary: string | null;
    payload: Prisma.JsonValue;
    ip: string | null;
    userAgent: string | null;
    createdAt: Date;
  }>;
  total: number;
  page: number;
  pageSize: number;
};

export async function listAuditLogsService(filters: AuditLogFilters): Promise<AuditLogListResult> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(200, Math.max(1, filters.pageSize ?? 50));

  const where: Prisma.AuditLogWhereInput = {};
  if (filters.actorId) where.actorId = filters.actorId;
  if (filters.entity) where.entity = filters.entity;
  if (filters.entityId) where.entityId = filters.entityId;
  if (filters.action) where.action = filters.action;
  if (filters.search) {
    const s = filters.search.trim();
    if (s.length > 0) {
      where.OR = [
        { summary: { contains: s, mode: "insensitive" } },
        { entity: { contains: s, mode: "insensitive" } },
        { action: { contains: s, mode: "insensitive" } },
      ];
    }
  }
  if (filters.from || filters.to) {
    const range: Prisma.DateTimeFilter = {};
    if (filters.from) {
      const d = new Date(filters.from);
      if (!Number.isNaN(d.getTime())) range.gte = d;
    }
    if (filters.to) {
      const d = new Date(filters.to);
      if (!Number.isNaN(d.getTime())) range.lte = d;
    }
    if (Object.keys(range).length > 0) where.createdAt = range;
  }

  const [total, raw] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const actorIds = Array.from(new Set(raw.map((row) => row.actorId).filter(Boolean) as string[]));
  const actors = actorIds.length
    ? await prisma.user.findMany({
        where: { id: { in: actorIds } },
        select: { id: true, fullName: true, email: true },
      })
    : [];
  const actorById = new Map(actors.map((u) => [u.id, u]));

  const rows = raw.map((row) => {
    const actor = row.actorId ? actorById.get(row.actorId) : undefined;
    return {
      id: row.id,
      actorId: row.actorId,
      actorRole: row.actorRole,
      actorName: actor?.fullName ?? null,
      actorEmail: actor?.email ?? null,
      action: row.action,
      entity: row.entity,
      entityId: row.entityId,
      summary: row.summary,
      payload: row.payload,
      ip: row.ip,
      userAgent: row.userAgent,
      createdAt: row.createdAt,
    };
  });

  return { rows, total, page, pageSize };
}
