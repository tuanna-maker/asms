import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiSuccess } from "@/lib/api-types";
import { qk } from "@/lib/query-keys";

export type DocumentPayload = {
  ownerId?: string;
  customerId?: string;
  contractId?: string;
  productId?: string;
  warrantyId?: string;
  projectId?: string;
  trainingCourseId?: string;
  name: string;
  categoryCode: string;
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

export type UploadDocumentPayload = {
  file: File;
  name: string;
  categoryCode: string;
  fileType: DocumentPayload["fileType"];
  ownerId?: string;
  contractId?: string;
  customerId?: string;
  productId?: string;
  warrantyId?: string;
  projectId?: string;
  trainingCourseId?: string;
  description?: string;
};

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UploadDocumentPayload) => {
      const form = new FormData();
      form.append("file", payload.file);
      form.append("name", payload.name);
      form.append("categoryCode", payload.categoryCode);
      form.append("fileType", payload.fileType);
      if (payload.ownerId) form.append("ownerId", payload.ownerId);
      if (payload.contractId) form.append("contractId", payload.contractId);
      if (payload.customerId) form.append("customerId", payload.customerId);
      if (payload.productId) form.append("productId", payload.productId);
      if (payload.projectId) form.append("projectId", payload.projectId);
      if (payload.trainingCourseId) form.append("trainingCourseId", payload.trainingCourseId);
      if (payload.warrantyId) form.append("warrantyId", payload.warrantyId);
      if (payload.description) form.append("description", payload.description);
      return api.post("/api/v1/documents/upload", form);
    },
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
