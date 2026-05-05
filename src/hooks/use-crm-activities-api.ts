import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiSuccess } from "@/lib/api-types";
import { qk } from "@/lib/query-keys";

export type CrmActivityRow = {
  id: string;
  customerId: string;
  type: "call" | "email" | "meeting" | "note";
  title: string;
  status: "scheduled" | "done";
  activityAt: string;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  customer: { id: string; code: string; name: string };
  createdBy: { id: string; fullName: string } | null;
};

export type CrmActivityPayload = {
  customerId: string;
  type: "call" | "email" | "meeting" | "note";
  title: string;
  status: "scheduled" | "done";
  activityAt: string;
};

export function useCrmActivitiesList(customerId?: string) {
  return useQuery({
    queryKey: qk.crmActivities.list(customerId),
    queryFn: async () => {
      const params = customerId ? `?customerId=${encodeURIComponent(customerId)}` : "";
      const res = await api.get<ApiSuccess<CrmActivityRow[]>>(`/api/v1/crm-activities${params}`);
      return res.data.data ?? [];
    },
  });
}

export function useCreateCrmActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CrmActivityPayload) => api.post("/api/v1/crm-activities", payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.crmActivities.all });
    },
  });
}

export function useUpdateCrmActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<CrmActivityPayload> }) =>
      api.put(`/api/v1/crm-activities/${id}`, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.crmActivities.all });
    },
  });
}

export function useDeleteCrmActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/api/v1/crm-activities/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.crmActivities.all });
    },
  });
}
