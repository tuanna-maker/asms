import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { ApiSuccess } from "@/lib/api-types";
import { qk } from "@/lib/query-keys";

export type SessionItem = {
  id: string;
  userAgent: string | null;
  ip: string | null;
  createdAt: string;
  expiresAt: string;
  lastUsedAt: string | null;
  current: boolean;
};

const REFRESH_TOKEN_KEY = "erp-refresh-token";

function readRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function useSessions(enabled = true) {
  return useQuery({
    queryKey: qk.sessions,
    enabled,
    queryFn: async () => {
      const refreshToken = readRefreshToken();
      if (refreshToken) {
        const res = await api.post<ApiSuccess<SessionItem[]>>(
          "/api/v1/auth/sessions/list",
          { refreshToken },
        );
        return res.data.data ?? [];
      }
      const res = await api.get<ApiSuccess<SessionItem[]>>("/api/v1/auth/sessions");
      return res.data.data ?? [];
    },
  });
}

export function useRevokeSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      api.delete(`/api/v1/auth/sessions/${encodeURIComponent(id)}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.sessions });
    },
  });
}

export function useLogoutAll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const refreshToken = readRefreshToken();
      return api.post("/api/v1/auth/logout-all", { refreshToken });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.sessions });
    },
  });
}
