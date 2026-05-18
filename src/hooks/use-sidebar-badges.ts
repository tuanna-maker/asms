import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiSuccess } from "@/lib/api-types";

export type SidebarBadges = {
  overdueHandovers: number;
  openWarranties: number;
  lateTasks: number;
  upcomingTrainings: number;
  unreadNotifications: number;
  overdueContracts: number;
};

const FALLBACK: SidebarBadges = {
  overdueHandovers: 0,
  openWarranties: 0,
  lateTasks: 0,
  upcomingTrainings: 0,
  unreadNotifications: 0,
  overdueContracts: 0,
};

export function useSidebarBadges() {
  return useQuery({
    queryKey: ["reports", "badges"],
    queryFn: async () => {
      const res = await api.get<ApiSuccess<SidebarBadges>>("/api/v1/reports/badges");
      return res.data.data ?? FALLBACK;
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    placeholderData: FALLBACK,
  });
}
