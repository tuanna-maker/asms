import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiSuccess } from "@/lib/api-types";
import { qk } from "@/lib/query-keys";

export type TaskPayload = {
  projectId?: string;
  code?: string;
  title: string;
  description?: string;
  priorityCode?: string;
  status?: "todo" | "in_progress" | "review" | "completed" | "delayed";
  type?: "research" | "report" | "fieldwork" | "admin" | "review";
  assigneeId?: string;
  progress?: number;
  startDate?: string;
  deadline?: string;
};

export type TaskListRow = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  priorityCode: string;
  assignee: { fullName: string } | null;
  startDate: string | null;
  deadline: string | null;
  status: "todo" | "in_progress" | "review" | "completed" | "delayed";
  progress: number;
  projectId?: string | null;
  project?: { code: string } | null;
  type: "research" | "report" | "fieldwork" | "admin" | "review";
};

export function useTasksList() {
  return useQuery({
    queryKey: qk.tasks.all,
    queryFn: async () => {
      const res = await api.get<ApiSuccess<TaskListRow[]>>("/api/v1/tasks");
      return res.data.data ?? [];
    },
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TaskPayload) => api.post("/api/v1/tasks", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.tasks.all }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<TaskPayload> }) =>
      api.put(`/api/v1/tasks/${id}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.tasks.all }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/api/v1/tasks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.tasks.all }),
  });
}
