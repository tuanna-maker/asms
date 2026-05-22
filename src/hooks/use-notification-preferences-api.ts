import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiSuccess } from "@/lib/api-types";
import { qk } from "@/lib/query-keys";

export type NotificationPrefKey =
  | "contract_expiry"
  | "contract_execution_sla"
  | "new_ticket"
  | "feedback_new"
  | "task_late"
  | "material_low"
  | "warranty_expiry"
  | "training_upcoming"
  | "repair_scheduled"
  | "customer_anniversary";

export type NotificationPreferenceItem = {
  key: NotificationPrefKey;
  enabled: boolean;
};

export const NOTIFICATION_PREF_LABELS: Record<NotificationPrefKey, { label: string; desc: string }> = {
  contract_expiry: {
    label: "Hợp đồng sắp hết hạn",
    desc: "Thông báo trước khi hết hạn (theo cấu hình máy chủ)",
  },
  contract_execution_sla: {
    label: "Hợp đồng quá SLA thực hiện",
    desc: "Khi hợp đồng quá thời gian SLA và chuyển Chậm tiến độ",
  },
  new_ticket: {
    label: "Phiếu bảo hành mới",
    desc: "Khi có phiếu yêu cầu bảo hành mới",
  },
  feedback_new: {
    label: "Phản ánh khách hàng mới",
    desc: "Khi có phản ánh mới được ghi nhận",
  },
  task_late: {
    label: "Nhiệm vụ trễ (người phụ trách)",
    desc: "Gửi cho người được giao khi nhiệm vụ quá hạn",
  },
  material_low: {
    label: "Vật tư sắp hết",
    desc: "Khi tồn kho xuống dưới ngưỡng",
  },
  warranty_expiry: {
    label: "Bảo hành sắp hết hạn",
    desc: "Nhắc trước khi hết hạn bảo hành hợp đồng",
  },
  training_upcoming: {
    label: "Khoá đào tạo sắp bắt đầu",
    desc: "Nhắc trước ngày bắt đầu khoá planned",
  },
  repair_scheduled: {
    label: "Phiếu BH sắp đến hạn SLA",
    desc: "Nhắc trước hạn xử lý phiếu bảo hành",
  },
  customer_anniversary: {
    label: "Kỷ niệm khách hàng",
    desc: "Nhắc ngày kỷ niệm / sinh nhật doanh nghiệp",
  },
};

export const ALL_NOTIFICATION_PREF_KEYS = Object.keys(
  NOTIFICATION_PREF_LABELS,
) as NotificationPrefKey[];

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
