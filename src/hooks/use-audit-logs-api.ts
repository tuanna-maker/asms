import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { ApiSuccess } from "@/lib/api-types";
import { qk } from "@/lib/query-keys";

export type AuditLogItem = {
  id: string;
  actorId: string | null;
  actorRole: string | null;
  actorName: string | null;
  actorEmail: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  summary: string | null;
  payload: unknown;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
};

export type AuditLogListResponse = {
  rows: AuditLogItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type AuditLogFilters = {
  search?: string;
  entity?: string;
  entityId?: string;
  action?: string;
  actorId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

export function useAuditLogs(filters: AuditLogFilters, enabled = true) {
  const key = JSON.stringify({
    search: filters.search ?? "",
    entity: filters.entity ?? "",
    entityId: filters.entityId ?? "",
    action: filters.action ?? "",
    actorId: filters.actorId ?? "",
    from: filters.from ?? "",
    to: filters.to ?? "",
    page: filters.page ?? 1,
    pageSize: filters.pageSize ?? 50,
  });
  return useQuery({
    queryKey: qk.auditLogs.list(key),
    enabled,
    queryFn: async () => {
      const params: Record<string, string | number> = {};
      if (filters.search) params.search = filters.search;
      if (filters.entity) params.entity = filters.entity;
      if (filters.entityId) params.entityId = filters.entityId;
      if (filters.action) params.action = filters.action;
      if (filters.actorId) params.actorId = filters.actorId;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      params.page = filters.page ?? 1;
      params.pageSize = filters.pageSize ?? 50;
      const res = await api.get<ApiSuccess<AuditLogListResponse>>("/api/v1/audit-logs", { params });
      return res.data.data ?? { rows: [], total: 0, page: 1, pageSize: 50 };
    },
  });
}
