import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { ApiSuccess } from "@/lib/api-types";
import { qk } from "@/lib/query-keys";

export function useAnniversarySubscriptions(anniversaryIds: string[], enabled = true) {
  const idsKey = anniversaryIds.slice().sort().join(",");
  return useQuery({
    queryKey: qk.anniversarySubscriptions.list(idsKey),
    enabled: enabled && anniversaryIds.length > 0,
    queryFn: async () => {
      const res = await api.get<ApiSuccess<{ subscribedIds: string[] }>>(
        "/api/v1/anniversary-subscriptions",
        { params: { anniversaryIds: anniversaryIds.join(",") } },
      );
      return new Set(res.data.data?.subscribedIds ?? []);
    },
  });
}

export function useSubscribeAnniversary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (anniversaryId: string) =>
      api.post<ApiSuccess<{ anniversaryId: string; subscribed: boolean }>>(
        "/api/v1/anniversary-subscriptions",
        { anniversaryId },
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.anniversarySubscriptions.all });
    },
  });
}

export function useUnsubscribeAnniversary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (anniversaryId: string) =>
      api.delete<ApiSuccess<{ anniversaryId: string; subscribed: boolean }>>(
        `/api/v1/anniversary-subscriptions/${encodeURIComponent(anniversaryId)}`,
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.anniversarySubscriptions.all });
    },
  });
}
