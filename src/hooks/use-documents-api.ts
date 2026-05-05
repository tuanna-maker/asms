import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiSuccess } from "@/lib/api-types";
import { qk } from "@/lib/query-keys";

export type DocumentPayload = {
  ownerId?: string;
  customerId?: string;
  contractId?: string;
  productId?: string;
  projectId?: string;
  trainingCourseId?: string;
  name: string;
  category: "contract" | "technical" | "policy" | "training" | "report" | "other";
  fileType: "pdf" | "doc" | "xls" | "img" | "other";
  tags?: string[];
  description?: string;
  fileSize?: string;
  fileUrl?: string;
};

export function useDocumentsList() {
  return useQuery({
    queryKey: qk.documents.all,
    queryFn: async () => {
      const res = await api.get<ApiSuccess<unknown[]>>("/api/v1/documents");
      return res.data.data ?? [];
    },
  });
}

export function useCreateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: DocumentPayload) => api.post("/api/v1/documents", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.documents.all }),
  });
}

export function useUpdateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<DocumentPayload> }) =>
      api.put(`/api/v1/documents/${id}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.documents.all }),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/api/v1/documents/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.documents.all }),
  });
}
