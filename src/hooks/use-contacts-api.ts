import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiSuccess } from "@/lib/api-types";
import { qk } from "@/lib/query-keys";

export type ContactRow = {
  id: string;
  customerId: string;
  fullName: string;
  title: string | null;
  phone: string | null;
  email: string | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
  customer: { id: string; code: string; name: string };
};

export type ContactPayload = {
  customerId: string;
  fullName: string;
  title?: string;
  phone?: string;
  email?: string;
  isPrimary?: boolean;
};

export function useContactsList(customerId?: string) {
  return useQuery({
    queryKey: qk.contacts.list(customerId),
    queryFn: async () => {
      const params = customerId ? `?customerId=${encodeURIComponent(customerId)}` : "";
      const res = await api.get<ApiSuccess<ContactRow[]>>(`/api/v1/contacts${params}`);
      return res.data.data ?? [];
    },
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ContactPayload) => api.post("/api/v1/contacts", payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.contacts.all });
    },
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<ContactPayload> }) =>
      api.put(`/api/v1/contacts/${id}`, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.contacts.all });
    },
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/api/v1/contacts/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.contacts.all });
    },
  });
}
