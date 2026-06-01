import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiSuccess } from "@/lib/api-types";
import { qk } from "@/lib/query-keys";

export type LinkageOptionContract = {
  id: string;
  code: string;
  title: string;
};

export type LinkageOptionProduct = {
  id: string;
  code: string;
  name: string;
  contractIds: string[];
};

export type LinkageOptionMaterial = {
  id: string;
  code: string;
  name: string;
  productIds: string[];
  contractIds: string[];
};

export type LinkageOptionsData = {
  contracts: LinkageOptionContract[];
  products: LinkageOptionProduct[];
  materials: LinkageOptionMaterial[];
};

export type FeedbackLinkageOptionsScope = "full" | "filtered";

export function useFeedbackLinkageOptions(
  customerId: string | null,
  selection: {
    contractId: string | null;
    productIds: string[];
    materialIds: string[];
  },
  enabled = true,
  options?: { scope?: FeedbackLinkageOptionsScope },
) {
  const scope = options?.scope ?? "filtered";
  const { contractId, productIds, materialIds } = selection;
  const applyFilters = scope === "filtered";

  return useQuery({
    queryKey: [
      ...qk.customerFeedbacks.all,
      "linkage-options",
      scope,
      customerId ?? "",
      applyFilters ? contractId ?? "" : "",
      applyFilters ? productIds.join(",") : "",
      applyFilters ? materialIds.join(",") : "",
    ],
    enabled: enabled && Boolean(customerId),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("customerId", customerId!);
      if (applyFilters && contractId) params.set("contractId", contractId);
      if (applyFilters) {
        for (const id of productIds) params.append("productIds", id);
        for (const id of materialIds) params.append("materialIds", id);
      }
      const res = await api.get<ApiSuccess<LinkageOptionsData>>(
        `/api/v1/customer-feedbacks/linkage-options?${params.toString()}`,
      );
      return res.data.data ?? { contracts: [], products: [], materials: [] };
    },
  });
}
