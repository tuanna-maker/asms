import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiSuccess } from "@/lib/api-types";
import { qk } from "@/lib/query-keys";

export type NotificationPrefKey = "contract_expiry" | "new_ticket" | "task_late" | "material_low";

export type NotificationPreferenceItem = {
  key: NotificationPrefKey;
  enabled: boolean;
};

export function useNotificationPreferences(enabled = true) {
  return useQuery({
    queryKey: qk.notificationPrefs,
    enabled,
    queryFn: async () => {
      const res = await api.get<ApiSuccess<NotificationPreferenceItem[]>>("/api/v1/notification-preferences");
      return res.data.data ?? [];
    },
  });
}

export function useUpdateNotificationPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (preferences: NotificationPreferenceItem[]) =>
      api.put("/api/v1/notification-preferences", { preferences }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.notificationPrefs }),
  });
}
