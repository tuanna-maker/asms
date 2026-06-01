import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiSuccess } from "@/lib/api-types";
import type { FeedbackIntake, FeedbackSource } from "@/lib/customer-feedback-intake";
import { qk } from "@/lib/query-keys";

export type CustomerFeedbackSeverity = "low" | "medium" | "high";
export type FeedbackAssigneeType = "user" | "role";

export type FeedbackAssignee = {
  type: FeedbackAssigneeType;
  userId?: string | null;
  roleCode?: string | null;
};
export type CustomerFeedbackStatus =
  | "new"
  | "assigned"
  | "in_progress"
  | "pending_close"
  | "resolved"
  | "reopened";

export type FeedbackAssignmentStatus = "pending" | "in_progress" | "done";

export type FeedbackLinkageItem = {
  productId: string;
  productCode: string;
  productName: string;
  materialId?: string | null;
  materialCode?: string | null;
  materialName?: string | null;
};

export type FeedbackLinkageInput = {
  productId: string;
  materialId?: string | null;
};

export type FeedbackAssignment = {
  id: string;
  feedbackId: string;
  unitId: string;
  status: FeedbackAssignmentStatus;
  responseNote: string | null;
  unit: { id: string; code: string; name: string };
  updatedBy?: { id: string; fullName: string } | null;
};

export type FeedbackTimelineEvent = {
  id: string;
  event: string;
  message: string | null;
  createdAt: string;
  actor?: { id: string; fullName: string } | null;
};

export type FeedbackCommentKind = "issue" | "fix" | "note";

export type FeedbackComment = {
  id: string;
  feedbackId: string;
  kind: FeedbackCommentKind;
  body: string;
  createdAt: string;
  author: { id: string; fullName: string };
};

export type CustomerFeedbackRow = {
  id: string;
  customerId: string;
  contractId: string | null;
  warrantyId: string | null;
  title: string;
  content: string;
  severity: CustomerFeedbackSeverity;
  assigneeType: FeedbackAssigneeType | null;
  assignedUserId: string | null;
  assignedRoleCode: string | null;
  assignedUser?: { id: string; fullName: string } | null;
  status: CustomerFeedbackStatus;
  source: FeedbackSource;
  intake: FeedbackIntake;
  feedbackAt: string;
  slaDueAt: string | null;
  closedAt: string | null;
  createdById: string | null;
  closedById: string | null;
  createdAt: string;
  updatedAt: string;
  linkageItems: FeedbackLinkageItem[];
  customer: { id: string; code: string; name: string };
  contract: { id: string; code: string; title: string } | null;
  warranty: { id: string; code: string; issue: string } | null;
  createdBy: { id: string; fullName: string } | null;
  closedBy?: { id: string; fullName: string } | null;
  assignments?: FeedbackAssignment[];
  timeline?: FeedbackTimelineEvent[];
  comments?: FeedbackComment[];
  canComment?: boolean;
};

export type CustomerFeedbackPayload = {
  customerId: string;
  contractId?: string | null;
  title: string;
  content: string;
  assignee: FeedbackAssignee;
  source?: FeedbackSource;
  intake?: FeedbackIntake;
  feedbackAt: string;
  linkageItems?: FeedbackLinkageInput[];
};

export type CustomerFeedbackUpdatePayload = Partial<
  Omit<CustomerFeedbackPayload, "customerId">
> & {
  customerId?: string;
};

export type CustomerFeedbackListFilters = {
  customerId?: string;
  contractId?: string;
  warrantyId?: string;
  unitId?: string;
  assignee?: FeedbackAssignee;
  assignedToMe?: boolean;
  status?: CustomerFeedbackStatus;
  search?: string;
  feedbackFrom?: string;
  feedbackTo?: string;
  myUnits?: boolean;
};

function buildListQuery(filters?: CustomerFeedbackListFilters): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  if (filters.customerId) params.set("customerId", filters.customerId);
  if (filters.contractId) params.set("contractId", filters.contractId);
  if (filters.warrantyId) params.set("warrantyId", filters.warrantyId);
  if (filters.unitId) params.set("unitId", filters.unitId);
  if (filters.assignedToMe) params.set("assignedToMe", "true");
  if (filters.status) params.set("status", filters.status);
  if (filters.search?.trim()) params.set("search", filters.search.trim());
  if (filters.feedbackFrom) params.set("feedbackFrom", filters.feedbackFrom);
  if (filters.feedbackTo) params.set("feedbackTo", filters.feedbackTo);
  if (filters.myUnits) params.set("myUnits", "true");
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function listKey(filters?: CustomerFeedbackListFilters): string {
  return JSON.stringify(filters ?? {});
}

function hasContextFilter(filters?: CustomerFeedbackListFilters): boolean {
  return Boolean(filters?.customerId || filters?.contractId || filters?.warrantyId || filters.myUnits);
}

export function useCustomerFeedbacksList(filters?: CustomerFeedbackListFilters, enabled = true) {
  return useQuery({
    queryKey: qk.customerFeedbacks.list(listKey(filters)),
    enabled: enabled && hasContextFilter(filters),
    queryFn: async () => {
      const res = await api.get<ApiSuccess<CustomerFeedbackRow[]>>(
        `/api/v1/customer-feedbacks${buildListQuery(filters)}`,
      );
      return res.data.data ?? [];
    },
  });
}

export function useAllCustomerFeedbacksList(
  filters?: CustomerFeedbackListFilters,
  enabled = true,
) {
  return useQuery({
    queryKey: [...qk.customerFeedbacks.all, "all-list", listKey(filters)],
    enabled,
    queryFn: async () => {
      const res = await api.get<ApiSuccess<CustomerFeedbackRow[]>>(
        `/api/v1/customer-feedbacks${buildListQuery(filters)}`,
      );
      return res.data.data ?? [];
    },
  });
}

export function useCustomerFeedbackDetail(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: qk.customerFeedbacks.detail(id ?? ""),
    enabled: enabled && Boolean(id),
    queryFn: async () => {
      const res = await api.get<ApiSuccess<CustomerFeedbackRow>>(
        `/api/v1/customer-feedbacks/${id}`,
      );
      return res.data.data ?? null;
    },
  });
}

export function useCreateCustomerFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CustomerFeedbackPayload) => {
      const res = await api.post<ApiSuccess<CustomerFeedbackRow>>(
        "/api/v1/customer-feedbacks",
        payload,
      );
      return res.data.data!;
    },
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: qk.customerFeedbacks.all });
      if (data?.id) {
        void qc.invalidateQueries({ queryKey: qk.customerFeedbacks.detail(data.id) });
      }
    },
  });
}

export function useUpdateCustomerFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: CustomerFeedbackUpdatePayload }) =>
      api.put(`/api/v1/customer-feedbacks/${id}`, payload),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: qk.customerFeedbacks.all });
      void qc.invalidateQueries({ queryKey: qk.customerFeedbacks.detail(id) });
    },
  });
}

export function useUpdateFeedbackAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      feedbackId,
      assignmentId,
      payload,
    }: {
      feedbackId: string;
      assignmentId: string;
      payload: { status?: FeedbackAssignmentStatus; responseNote?: string | null };
    }) =>
      api.patch(
        `/api/v1/customer-feedbacks/${feedbackId}/assignments/${assignmentId}`,
        payload,
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.customerFeedbacks.all });
    },
  });
}

export function useRequestCloseFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note?: string }) =>
      api.post(`/api/v1/customer-feedbacks/${id}/request-close`, { note }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.customerFeedbacks.all }),
  });
}

export function useCloseFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      customerVerified,
      note,
    }: {
      id: string;
      customerVerified: boolean;
      note?: string;
    }) => api.post(`/api/v1/customer-feedbacks/${id}/close`, { customerVerified, note }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.customerFeedbacks.all }),
  });
}

export function useReopenFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note?: string }) =>
      api.post(`/api/v1/customer-feedbacks/${id}/reopen`, { note }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.customerFeedbacks.all }),
  });
}

export function useDeleteCustomerFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/api/v1/customer-feedbacks/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.customerFeedbacks.all });
    },
  });
}

export function useCreateFeedbackComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      feedbackId,
      kind,
      body,
    }: {
      feedbackId: string;
      kind: "issue" | "fix";
      body: string;
    }) => {
      const res = await api.post<ApiSuccess<CustomerFeedbackRow>>(
        `/api/v1/customer-feedbacks/${feedbackId}/comments`,
        { kind, body },
      );
      return res.data.data!;
    },
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: qk.customerFeedbacks.all });
      if (data?.id) {
        void qc.invalidateQueries({ queryKey: qk.customerFeedbacks.detail(data.id) });
      }
    },
  });
}
