import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiSuccess } from "@/lib/api-types";
import type { ApiResearchProjectDetail, ApiResearchProjectListRow } from "@/lib/research-project-mapper";
import { qk } from "@/lib/query-keys";

export type ResearchProjectCreatePayload = {
  code: string;
  name: string;
  department?: string;
  fundingSource?: string;
  startDate: string;
  endDate: string;
  description?: string;
  managerId?: string;
};

export type ResearchProjectUpdatePayload = Partial<ResearchProjectCreatePayload> & {
  status?: "planning" | "active" | "completed" | "suspended";
  progress?: number;
  budget?: number;
  budgetSpent?: number;
};

export function useResearchProjectsList() {
  return useQuery({
    queryKey: qk.researchProjects.all,
    queryFn: async () => {
      const res = await api.get<ApiSuccess<ApiResearchProjectListRow[]>>("/api/v1/research-projects");
      return res.data.data ?? [];
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useResearchProjectDetail(id: string | undefined) {
  return useQuery({
    queryKey: qk.researchProjects.detail(id ?? ""),
    queryFn: async () => {
      const res = await api.get<ApiSuccess<ApiResearchProjectDetail>>(
        `/api/v1/research-projects/${encodeURIComponent(id!)}`
      );
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateResearchProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ResearchProjectCreatePayload) => api.post("/api/v1/research-projects", payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.researchProjects.all });
    },
  });
}

export function useUpdateResearchProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: ResearchProjectUpdatePayload }) =>
      api.put(`/api/v1/research-projects/${encodeURIComponent(id)}`, payload),
    onSuccess: (_d, v) => {
      void qc.invalidateQueries({ queryKey: qk.researchProjects.all });
      void qc.invalidateQueries({ queryKey: qk.researchProjects.detail(v.id) });
    },
  });
}

export function useDeleteResearchProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/api/v1/research-projects/${encodeURIComponent(id)}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.researchProjects.all });
    },
  });
}
