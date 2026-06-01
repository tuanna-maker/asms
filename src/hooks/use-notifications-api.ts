import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { ApiSuccess } from "@/lib/api-types";
import { qk } from "@/lib/query-keys";

export type NotificationItem = {
  id: string;
  key: string;
  title: string;
  message: string | null;
  link: string | null;
  refType: string | null;
  refId: string | null;
  readAt: string | null;
  createdAt: string;
};

function normalizeNotificationLink(link: string | null): string | null {
  if (!link) return null;
  const trimmed = link.trim();
  if (!trimmed) return null;

  // Backward-compatible route aliases for old notifications stored in DB.
  if (trimmed === "/huan-luyen" || trimmed.startsWith("/huan-luyen/")) {
    return trimmed.replace("/huan-luyen", "/dao-tao");
  }

  return trimmed;
}

function buildDetailLinkByRef(item: NotificationItem): string | null {
  if (!item.refId) return null;
  const refId = encodeURIComponent(item.refId);
  switch (item.refType) {
    case "customer_feedback":
      return `/phan-anh/${refId}`;
    case "training_course":
      return `/dao-tao/${refId}`;
    case "contract":
      return `/hop-dong?view=${refId}`;
    case "material":
      return `/vat-tu?view=${refId}`;
    case "warranty":
      return `/bao-hanh?view=${refId}`;
    default:
      return null;
  }
}

function normalizeNotificationItem(item: NotificationItem): NotificationItem {
  const preferredLink = buildDetailLinkByRef(item) ?? item.link;
  return {
    ...item,
    link: normalizeNotificationLink(preferredLink),
  };
}

const DEFAULT_POLL_MS = 60_000;
const FAST_POLL_MS = 15_000;

export function useNotifications(
  enabled = true,
  scope: "all" | "unread" = "all",
  options?: { refetchInterval?: number | false },
) {
  return useQuery({
    queryKey: qk.notifications.list(scope),
    enabled,
    queryFn: async () => {
      const params = scope === "unread" ? { unread: "1" } : {};
      const res = await api.get<ApiSuccess<NotificationItem[]>>("/api/v1/notifications", {
        params: { ...params, limit: 50 },
      });
      return (res.data.data ?? []).map(normalizeNotificationItem);
    },
    refetchInterval: options?.refetchInterval ?? DEFAULT_POLL_MS,
  });
}

export function useUnreadNotificationsCount(
  enabled = true,
  options?: { refetchInterval?: number | false },
) {
  return useQuery({
    queryKey: qk.notifications.unreadCount,
    enabled,
    queryFn: async () => {
      const res = await api.get<ApiSuccess<{ count: number }>>("/api/v1/notifications/unread-count");
      return res.data.data?.count ?? 0;
    },
    refetchInterval: options?.refetchInterval ?? DEFAULT_POLL_MS,
  });
}

export { DEFAULT_POLL_MS, FAST_POLL_MS };

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      api.post(`/api/v1/notifications/${encodeURIComponent(id)}/read`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.notifications.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => api.post(`/api/v1/notifications/read-all`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.notifications.all });
    },
  });
}
