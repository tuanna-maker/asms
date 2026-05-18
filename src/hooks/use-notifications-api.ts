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

export function useNotifications(enabled = true, scope: "all" | "unread" = "all") {
  return useQuery({
    queryKey: qk.notifications.list(scope),
    enabled,
    queryFn: async () => {
      const params = scope === "unread" ? { unread: "1" } : {};
      const res = await api.get<ApiSuccess<NotificationItem[]>>("/api/v1/notifications", { params });
      return res.data.data ?? [];
    },
    refetchInterval: 60_000,
  });
}

export function useUnreadNotificationsCount(enabled = true) {
  return useQuery({
    queryKey: qk.notifications.unreadCount,
    enabled,
    queryFn: async () => {
      const res = await api.get<ApiSuccess<{ count: number }>>("/api/v1/notifications/unread-count");
      return res.data.data?.count ?? 0;
    },
    refetchInterval: 60_000,
  });
}

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
