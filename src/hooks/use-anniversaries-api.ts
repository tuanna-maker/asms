import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiSuccess } from "@/lib/api-types";
import { qk } from "@/lib/query-keys";

export type AnniversaryType = "traditional_day" | "medal_day" | "leader_birthday" | "other";

export type Anniversary = {
  id: string;
  customerId: string;
  type: AnniversaryType;
  label: string;
  occursAt: string;
  recurringYearly: boolean;
  reminderDays: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: { id: string; code: string; name: string };
  nextOccurrence?: string;
};

export type AnniversaryPayload = {
  customerId: string;
  type?: AnniversaryType;
  label: string;
  occursAt: string;
  recurringYearly?: boolean;
  reminderDays?: number;
  notes?: string | null;
};

const KEY = ["customer-anniversaries"] as const;

export function useAnniversariesList(filters?: { customerId?: string; upcoming?: number }) {
  return useQuery({
    queryKey: [...KEY, filters?.customerId ?? "", filters?.upcoming ?? ""],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.customerId) params.set("customerId", filters.customerId);
      if (filters?.upcoming != null) params.set("upcoming", String(filters.upcoming));
      const qs = params.toString();
      const res = await api.get<ApiSuccess<Anniversary[]>>(
        qs ? `/api/v1/customer-anniversaries?${qs}` : `/api/v1/customer-anniversaries`,
      );
      return res.data.data ?? [];
    },
  });
}

export function useCreateAnniversary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AnniversaryPayload) =>
      api.post<ApiSuccess<Anniversary>>(`/api/v1/customer-anniversaries`, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
      void qc.invalidateQueries({ queryKey: qk.customers.all });
    },
  });
}

export function useUpdateAnniversary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<AnniversaryPayload> }) =>
      api.put<ApiSuccess<Anniversary>>(
        `/api/v1/customer-anniversaries/${encodeURIComponent(id)}`,
        payload,
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
      void qc.invalidateQueries({ queryKey: qk.customers.all });
    },
  });
}

export function useDeleteAnniversary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      api.delete<ApiSuccess<{ id: string }>>(
        `/api/v1/customer-anniversaries/${encodeURIComponent(id)}`,
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
      void qc.invalidateQueries({ queryKey: qk.customers.all });
    },
  });
}
