import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { ApiSuccess } from "@/lib/api-types";
import { qk } from "@/lib/query-keys";

export type SystemSettingItem = {
  key: string;
  value: unknown;
  label: string;
  description: string;
  group: "warranty" | "material" | "contract" | "notification" | "training";
  input: "number" | "channels" | "hour";
  unit?: string;
  min?: number;
  max?: number;
  updatedAt: string | null;
};

export function useSystemSettings(enabled = true) {
  return useQuery({
    queryKey: qk.systemSettings,
    enabled,
    queryFn: async () => {
      const res = await api.get<ApiSuccess<SystemSettingItem[]>>("/api/v1/system-settings");
      return res.data.data ?? [];
    },
  });
}

export function useUpdateSystemSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: Array<{ key: string; value: unknown }>) =>
      api.put("/api/v1/system-settings", { items }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.systemSettings });
    },
  });
}
