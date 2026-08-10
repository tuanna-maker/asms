import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiSuccess } from "@/lib/api-types";
import { qk } from "@/lib/query-keys";
import { parseFieldSchema, type FieldDef } from "@/lib/workflow-field-schema";

export type WorkflowModuleKey = "handover" | "warranty" | "training" | "coaching" | "contract" | "product";
export type WorkflowEntityModuleKey = "handover" | "warranty" | "training" | "coaching" | "contract" | "product";

export type PersonRef = { id: string; fullName: string } | null;

export type WorkflowStepItem = {
  id: string;
  workflowId: string;
  order: number;
  name: string;
  actionCode: string;
  roleCode: string;
  assigneeIds: string[];
  slaHours: number | null;
  description: string | null;
  phaseCode: string;
  requireDocument: boolean;
  fieldSchema?: FieldDef[] | null;
  createdAt: string;
  updatedAt: string;
};

export type WorkflowListItem = {
  id: string;
  code: string;
  name: string;
  moduleKey: WorkflowModuleKey;
  description: string | null;
  isActive: boolean;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: PersonRef;
  updatedBy: PersonRef;
  stepCount: number;
  totalSlaHours: number;
};

export type WorkflowDetail = {
  id: string;
  code: string;
  name: string;
  moduleKey: WorkflowModuleKey;
  description: string | null;
  isActive: boolean;
  isSystem: boolean;
  entityFieldSchema?: FieldDef[] | null;
  createdAt: string;
  updatedAt: string;
  createdBy: PersonRef;
  updatedBy: PersonRef;
  steps: WorkflowStepItem[];
};

/** Snapshot tiến độ (dùng cho danh sách bàn giao / bảo hành khi có workflowInstanceId). */
export type WorkflowInstanceListSnapshot = {
  instanceId: string;
  workflowId: string;
  moduleKey?: string;
  workflowCode: string;
  workflowName: string;
  status: string;
  currentStepIndex: number;
  totalSteps: number;
  currentStepName: string | null;
  currentStepRoleCode: string | null;
  currentStepAssigneeIds?: string[];
  steps: Array<{
    id: string;
    order: number;
    name: string;
    actionCode: string;
    roleCode: string;
    slaHours: number | null;
    assigneeIds?: string[];
  }>;
};

export type CreateWorkflowPayload = {
  code?: string;
  name: string;
  moduleKey: WorkflowModuleKey;
  description?: string | null;
  isActive?: boolean;
};

export type UpdateWorkflowPayload = Partial<CreateWorkflowPayload> & {
  entityFieldSchema?: FieldDef[] | null;
};

export type UpsertStepPayload = {
  name: string;
  actionCode: string;
  roleCode: string;
  assigneeIds?: string[];
  slaHours?: number | null;
  description?: string | null;
  phaseCode?: string;
  requireDocument?: boolean;
  fieldSchema?: FieldDef[] | null;
};

export type WorkflowInstanceDocument = {
  id: string;
  instanceId: string;
  stepId: string | null;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  uploadedById: string | null;
  uploadedAt: string;
  uploadedBy: PersonRef;
};

export function useWorkflowsList(moduleKey?: WorkflowModuleKey, opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: qk.workflows.list(moduleKey),
    enabled: opts?.enabled !== false,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (moduleKey) params.set("moduleKey", moduleKey);
      const res = await api.get<ApiSuccess<WorkflowListItem[]>>(
        `/api/v1/workflows${params.toString() ? `?${params.toString()}` : ""}`,
      );
      return res.data.data ?? [];
    },
  });
}

export function useWorkflowDetail(id: string | null | undefined, opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: qk.workflows.detail(id ?? ""),
    enabled: Boolean(id) && opts?.enabled !== false,
    queryFn: async () => {
      const res = await api.get<ApiSuccess<WorkflowDetail>>(
        `/api/v1/workflows/${encodeURIComponent(id as string)}`,
      );
      const data = res.data.data;
      if (!data) return data;
      return {
        ...data,
        entityFieldSchema: parseFieldSchema(data.entityFieldSchema),
        steps: data.steps.map((s) => ({
          ...s,
          fieldSchema: parseFieldSchema(s.fieldSchema),
        })),
      };
    },
  });
}

export function useCreateWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateWorkflowPayload) =>
      api.post<ApiSuccess<WorkflowDetail>>("/api/v1/workflows", payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.workflows.all });
    },
  });
}

export function useUpdateWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateWorkflowPayload }) =>
      api.put<ApiSuccess<WorkflowDetail>>(`/api/v1/workflows/${encodeURIComponent(id)}`, payload),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: qk.workflows.all });
      void qc.invalidateQueries({ queryKey: qk.workflows.detail(vars.id) });
    },
  });
}

export function useDeleteWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      api.delete<ApiSuccess<{ id: string }>>(`/api/v1/workflows/${encodeURIComponent(id)}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.workflows.all });
    },
  });
}

export function useAddStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ workflowId, payload }: { workflowId: string; payload: UpsertStepPayload }) =>
      api.post<ApiSuccess<WorkflowStepItem>>(
        `/api/v1/workflows/${encodeURIComponent(workflowId)}/steps`,
        payload,
      ),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: qk.workflows.detail(vars.workflowId) });
      void qc.invalidateQueries({ queryKey: qk.workflows.all });
    },
  });
}

export function useUpdateStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      workflowId,
      stepId,
      payload,
    }: {
      workflowId: string;
      stepId: string;
      payload: Partial<UpsertStepPayload>;
    }) =>
      api.put<ApiSuccess<WorkflowStepItem>>(
        `/api/v1/workflows/${encodeURIComponent(workflowId)}/steps/${encodeURIComponent(stepId)}`,
        payload,
      ),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: qk.workflows.detail(vars.workflowId) });
      void qc.invalidateQueries({ queryKey: qk.workflows.all });
      void qc.invalidateQueries({ queryKey: ["workflow-instance"] });
    },
  });
}

export function useDeleteStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ workflowId, stepId }: { workflowId: string; stepId: string }) =>
      api.delete<ApiSuccess<{ id: string }>>(
        `/api/v1/workflows/${encodeURIComponent(workflowId)}/steps/${encodeURIComponent(stepId)}`,
      ),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: qk.workflows.detail(vars.workflowId) });
      void qc.invalidateQueries({ queryKey: qk.workflows.all });
      void qc.invalidateQueries({ queryKey: ["workflow-instance"] });
    },
  });
}

export type WorkflowInstance = {
  id: string;
  workflowId: string;
  moduleKey: WorkflowModuleKey;
  entityId: string;
  currentStepId: string | null;
  status: "running" | "completed" | "cancelled";
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  workflow: {
    id: string;
    code: string;
    name: string;
    moduleKey: WorkflowModuleKey;
    isActive: boolean;
    isSystem: boolean;
    steps: Array<{
      id: string;
      order: number;
      name: string;
      actionCode: string;
      roleCode: string;
      assigneeIds: string[];
      slaHours: number | null;
      description: string | null;
      phaseCode: string;
      requireDocument: boolean;
    }>;
  };
  currentStep: {
    id: string;
    order: number;
    name: string;
    actionCode: string;
    roleCode: string;
    assigneeIds: string[];
    slaHours: number | null;
    phaseCode: string;
    requireDocument: boolean;
  } | null;
  logs: Array<{
    id: string;
    stepId: string | null;
    actorId: string | null;
    action: string;
    comment: string | null;
    createdAt: string;
    actor: PersonRef;
    step: { id: string; name: string; order: number } | null;
  }>;
  documents: WorkflowInstanceDocument[];
};

export function useInstanceForEntity(
  moduleKey: WorkflowEntityModuleKey | null | undefined,
  entityId: string | null | undefined,
  opts?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ["workflow-instance", moduleKey ?? "", entityId ?? ""] as const,
    enabled: Boolean(moduleKey && entityId) && opts?.enabled !== false,
    queryFn: async () => {
      const params = new URLSearchParams({ moduleKey: String(moduleKey), entityId: String(entityId) });
      const res = await api.get<ApiSuccess<WorkflowInstance | null>>(
        `/api/v1/workflows/instances?${params.toString()}`,
      );
      return res.data.data ?? null;
    },
  });
}

export function useAttachWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      moduleKey,
      entityId,
      workflowId,
    }: {
      moduleKey: WorkflowEntityModuleKey;
      entityId: string;
      workflowId: string;
    }) => {
      return api.post<ApiSuccess<WorkflowInstance>>(`/api/v1/workflows/instances/attach`, {
        moduleKey,
        entityId,
        workflowId,
      });
    },
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: ["workflow-instance"] });
      void qc.invalidateQueries({ queryKey: ["handovers"] });
      void qc.invalidateQueries({ queryKey: ["warranties"] });
      void qc.invalidateQueries({ queryKey: ["training-courses"] });
      void qc.invalidateQueries({ queryKey: qk.contracts.all });
      if (variables.moduleKey === "warranty") {
        void qc.invalidateQueries({ queryKey: qk.warranties.detail(variables.entityId) });
      }
      if (variables.moduleKey === "contract") {
        void qc.invalidateQueries({ queryKey: [...qk.contracts.all, "detail", variables.entityId] });
      }
      if (variables.moduleKey === "product") {
        void qc.invalidateQueries({ queryKey: ["products"] });
        void qc.invalidateQueries({ queryKey: ["product-detail", variables.entityId] });
      }
    },
  });
}

export function useAdvanceInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      instanceId,
      action,
      comment,
    }: {
      instanceId: string;
      action: "approve" | "reject" | "skip";
      comment?: string | null;
    }) =>
      api.post<ApiSuccess<WorkflowInstance>>(
        `/api/v1/workflows/instances/${encodeURIComponent(instanceId)}/advance`,
        { action, ...(comment ? { comment } : {}) },
      ),
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: ["workflow-instance"] });
      void qc.invalidateQueries({ queryKey: ["handovers"] });
      void qc.invalidateQueries({ queryKey: ["warranties"] });
      void qc.invalidateQueries({ queryKey: ["training-courses"] });
      const inst = res.data.data;
      if (inst?.moduleKey === "warranty" && inst.entityId) {
        void qc.invalidateQueries({ queryKey: qk.warranties.detail(inst.entityId) });
      }
      if (inst?.moduleKey === "handover" && inst.entityId) {
        void qc.invalidateQueries({ queryKey: qk.handovers.detail(inst.entityId) });
      }
      if ((inst?.moduleKey === "training" || inst?.moduleKey === "coaching") && inst.entityId) {
        void qc.invalidateQueries({ queryKey: qk.training.detail(inst.entityId) });
        void qc.invalidateQueries({ queryKey: ["trainingCourses"] });
        void qc.invalidateQueries({ queryKey: ["trainingCourse", inst.entityId] });
      }
      if (inst?.moduleKey === "contract" && inst.entityId) {
        void qc.invalidateQueries({ queryKey: [...qk.contracts.all, "detail", inst.entityId] });
        void qc.invalidateQueries({ queryKey: qk.contracts.all });
      }
    },
  });
}

export function useReorderSteps() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      workflowId,
      items,
    }: {
      workflowId: string;
      items: Array<{ id: string; order: number }>;
    }) =>
      api.put<ApiSuccess<{ count: number }>>(
        `/api/v1/workflows/${encodeURIComponent(workflowId)}/steps/reorder`,
        { items },
      ),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: qk.workflows.detail(vars.workflowId) });
      void qc.invalidateQueries({ queryKey: qk.workflows.all });
    },
  });
}

// ---- Workflow instance documents ----

export function useInstanceDocuments(instanceId: string | null | undefined) {
  return useQuery({
    queryKey: ["workflow-instance-documents", instanceId ?? ""] as const,
    enabled: Boolean(instanceId),
    queryFn: async () => {
      const res = await api.get<ApiSuccess<WorkflowInstanceDocument[]>>(
        `/api/v1/workflow-instances/${encodeURIComponent(instanceId as string)}/documents`,
      );
      return res.data.data ?? [];
    },
  });
}

export function useUploadInstanceDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      instanceId,
      file,
      stepId,
    }: {
      instanceId: string;
      file: File;
      stepId?: string | null;
    }) => {
      const form = new FormData();
      form.append("file", file);
      if (stepId) form.append("stepId", stepId);
      const res = await api.post<ApiSuccess<WorkflowInstanceDocument>>(
        `/api/v1/workflow-instances/${encodeURIComponent(instanceId)}/documents`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return res.data.data;
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ["workflow-instance-documents", vars.instanceId] });
      void qc.invalidateQueries({ queryKey: ["workflow-instance"] });
    },
  });
}

export function useDeleteInstanceDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ instanceId, documentId }: { instanceId: string; documentId: string }) =>
      api.delete<ApiSuccess<{ id: string }>>(
        `/api/v1/workflow-instances/${encodeURIComponent(instanceId)}/documents/${encodeURIComponent(documentId)}`,
      ),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ["workflow-instance-documents", vars.instanceId] });
      void qc.invalidateQueries({ queryKey: ["workflow-instance"] });
    },
  });
}
