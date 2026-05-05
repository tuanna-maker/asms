import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiSuccess } from "@/lib/api-types";
import { qk } from "@/lib/query-keys";

export type CustomerPayload = {
  code?: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
};

export function useCustomersList() {
  return useQuery({
    queryKey: qk.customers.all,
    queryFn: async () => {
      const res = await api.get<ApiSuccess<unknown[]>>("/api/v1/customers");
      return res.data.data ?? [];
    },
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CustomerPayload) => api.post("/api/v1/customers", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.customers.all }),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<CustomerPayload> }) =>
      api.put(`/api/v1/customers/${id}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.customers.all }),
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/api/v1/customers/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.customers.all });
      void qc.invalidateQueries({ queryKey: qk.contacts.all });
      void qc.invalidateQueries({ queryKey: qk.crmActivities.all });
    },
  });
}
