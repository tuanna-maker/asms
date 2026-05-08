import { useMemo } from "react";

import { useContractsList } from "@/hooks/use-contracts-api";
import { useHandoversList, type HandoverListItem } from "@/hooks/use-handovers-api";
import { useTrainingCoursesQuery } from "@/hooks/use-training";
import { useMaterialsList, type MaterialListRow } from "@/hooks/use-materials-api";
import { useWarrantiesList, type WarrantyListRow } from "@/hooks/use-warranties-api";
import { useProductsList, type ProductListItem } from "@/hooks/use-products-api";
import { useReportsByYear, type ReportsApi } from "@/hooks/use-reports-api";

import type { ComplaintRow, ContractRow, HandoverRow, ProductRow, TrainingRow } from "@/data/tableData";
import type { DashboardData } from "@/data/dashboardData";

type ApiContractRow = {
  id?: string;
  code: string;
  title: string;
  value: string | number;
  startDate: string;
  endDate: string;
  status: "draft" | "active" | "completed" | "late" | "liquidated";
  progress: number;
  customer?: { id: string; code: string; name: string } | null;
};

function isApiContractRow(row: unknown): row is ApiContractRow {
  return typeof row === "object" && row !== null && "code" in row;
}

function formatVnDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function isThisMonth(iso: string | null | undefined) {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

function mapContractRow(row: ApiContractRow): ContractRow {
  const status: ContractRow["status"] =
    row.status === "completed" || row.status === "liquidated"
      ? "completed"
      : row.status === "late"
        ? "late"
        : "active";
  const v = Number(row.value ?? 0);
  return {
    id: row.code,
    name: row.title,
    customer: row.customer?.name ?? "—",
    value: Number.isFinite(v) ? v : 0,
    startDate: formatVnDate(row.startDate),
    endDate: formatVnDate(row.endDate),
    status,
    progress: Math.round(Number(row.progress ?? 0)),
  };
}

function mapHandoverRow(row: HandoverListItem): HandoverRow {
  const isLate = row.status === "late";
  const status: HandoverRow["status"] = row.status === "completed" ? "completed" : "active";
  return {
    id: row.code,
    contract: row.contract?.code ?? "—",
    customer: row.customer?.name ?? "—",
    products: Number(row.products ?? 0),
    date: formatVnDate(row.completedAt ?? row.dueDate ?? row.startDate),
    status,
    isLate,
  };
}

type TrainingApiRow = {
  id: string;
  code?: string;
  title: string;
  startDate: string;
  endDate: string;
  status: string;
  customer?: { name?: string | null; code?: string | null } | null;
  contract?: { code?: string | null } | null;
};

function mapTrainingRow(row: TrainingApiRow): TrainingRow {
  const status: TrainingRow["status"] = row.status === "completed" ? "completed" : "active";
  return {
    id: row.code ?? row.id,
    contract: row.contract?.code ?? "—",
    customer: row.customer?.name ?? row.customer?.code ?? "—",
    topic: row.title,
    date: formatVnDate(row.startDate),
    status,
    isLate: false,
  };
}

function mapProductRow(row: ProductListItem): ProductRow {
  const status: ProductRow["status"] =
    row.status === "equipped" ? "equipped" : row.status === "stopped" ? "inspecting" : "producing";
  return {
    id: row.code,
    name: row.name,
    category: row.category || "—",
    customer: "—",
    status,
    quantity: Number(row.totalProduced ?? 0),
    deliveryDate: "—",
  };
}

function mapWarrantyRow(row: WarrantyListRow): ComplaintRow {
  const status: ComplaintRow["status"] = row.status === "completed" ? "done" : "processing";
  const type: ComplaintRow["type"] = row.type === "warranty" ? "warranty" : "repair";
  return {
    id: row.code,
    customer: row.customer?.name ?? "—",
    product: row.product?.name ?? "—",
    type,
    description: row.issue,
    status,
    createdDate: formatVnDate(row.createdAt),
    resolvedDate: row.status === "completed" ? formatVnDate(row.createdAt) : null,
    isLate: row.status === "cancelled",
  };
}

function buildPakdFromMaterials(materials: MaterialListRow[]): DashboardData["pakd"] {
  const buckets = new Map<string, { name: string; total: number; remaining: number }>();
  for (const m of materials) {
    const key = m.warehouse || "Kho chung";
    const prev = buckets.get(key) ?? { name: key, total: 0, remaining: 0 };
    prev.total += Number(m.quantity ?? 0);
    prev.remaining += Number(m.available ?? 0);
    buckets.set(key, prev);
  }
  return Array.from(buckets.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);
}

export type UseDashboardDataResult = {
  data: DashboardData;
  liveContracts: ContractRow[];
  liveHandovers: HandoverRow[];
  liveTrainings: TrainingRow[];
  liveProducts: ProductRow[];
  liveWarranties: ComplaintRow[];
  liveMaterials: MaterialListRow[];
  isLoading: boolean;
  isError: boolean;
};

export function useDashboardData(year: string): UseDashboardDataResult {
  const contractsQ = useContractsList();
  const handoversQ = useHandoversList();
  const trainingsQ = useTrainingCoursesQuery();
  const materialsQ = useMaterialsList();
  const warrantiesQ = useWarrantiesList();
  const productsQ = useProductsList();
  const reportsQ = useReportsByYear(year);

  const result = useMemo<UseDashboardDataResult>(() => {
    const apiContracts = (contractsQ.data ?? []).filter(isApiContractRow) as ApiContractRow[];
    const apiHandovers = (handoversQ.data ?? []) as HandoverListItem[];
    const apiTrainings = (trainingsQ.data ?? []) as unknown as TrainingApiRow[];
    const apiMaterials = (materialsQ.data ?? []) as MaterialListRow[];
    const apiWarranties = (warrantiesQ.data ?? []) as WarrantyListRow[];
    const apiProducts = (productsQ.data ?? []) as ProductListItem[];
    const apiReports = (reportsQ.data ?? null) as ReportsApi | null;

    const contractActive = apiContracts.filter((c) => c.status === "active" || c.status === "draft").length;
    const contractCompleted = apiContracts.filter((c) => c.status === "completed" || c.status === "liquidated").length;
    const contractLate = apiContracts.filter((c) => c.status === "late").length;
    const contractTotal = apiContracts.length;

    const handoverActive = apiHandovers.filter((h) => h.status === "pending" || h.status === "active").length;
    const handoverCompleted = apiHandovers.filter((h) => h.status === "completed").length;
    const handoverLate = apiHandovers.filter((h) => h.status === "late").length;

    const trainingOngoing = apiTrainings.filter((t) => t.status === "ongoing").length;
    const trainingPlanned = apiTrainings.filter((t) => t.status === "planned").length;
    const trainingCompleted = apiTrainings.filter((t) => t.status === "completed").length;
    const trainingCancelled = apiTrainings.filter((t) => t.status === "cancelled").length;

    const productProducing = apiProducts.filter((p) => p.status === "producing" || p.status === "developing").length;
    const productEquipped = apiProducts.filter((p) => p.status === "equipped").length;
    const productStopped = apiProducts.filter((p) => p.status === "stopped").length;

    const warrantyOpen = apiWarranties.filter((w) => w.status === "open").length;
    const warrantyProcessing = apiWarranties.filter((w) => w.status === "processing").length;
    const warrantyDone = apiWarranties.filter((w) => w.status === "completed").length;
    const warrantyCancelled = apiWarranties.filter((w) => w.status === "cancelled").length;
    const warrantyByType = (() => {
      const map: Record<string, number> = { warranty: 0, repair: 0, maintenance: 0 };
      for (const w of apiWarranties) map[w.type] = (map[w.type] ?? 0) + 1;
      return map;
    })();

    const completedThisMonth =
      apiContracts.filter((c) => (c.status === "completed" || c.status === "liquidated") && isThisMonth(c.endDate)).length +
      apiHandovers.filter((h) => h.status === "completed" && isThisMonth(h.completedAt ?? h.dueDate)).length +
      apiTrainings.filter((t) => t.status === "completed" && isThisMonth(t.endDate)).length;

    const customerProducts = (apiReports?.customer_breakdown ?? []).map((c) => ({
      name: c.name,
      products: Math.round(Number(c.contracts ?? 0)),
    }));
    const customerRevenue = (apiReports?.customer_breakdown ?? []).map((c) => ({
      name: c.name,
      revenue: Math.round(Number(c.value ?? 0) / 1_000_000),
    }));

    const trend = (apiReports?.trends?.monthly ?? []).map((m) => ({
      month: m.month,
      sanXuat: 0,
      hopDong: Number(m.contracts ?? 0),
      banGiao: Number(m.handovers ?? 0),
      huanLuyen: 0,
    }));

    const data: DashboardData = {
      stats: {
        totalProducts: apiProducts.length,
        activeContracts: contractActive,
        pendingComplaints: warrantyOpen + warrantyProcessing,
        completedThisMonth,
      },
      product: {
        total: apiProducts.length,
        producing: productProducing,
        inspecting: productStopped,
        equipped: productEquipped,
      },
      contract: {
        total: contractTotal,
        active: contractActive,
        completed: contractCompleted,
        onTime: contractCompleted,
        late: contractLate,
      },
      handover: {
        total: apiHandovers.length,
        active: handoverActive,
        completed: handoverCompleted,
        onTime: handoverCompleted,
        late: handoverLate,
      },
      training: {
        total: apiTrainings.length,
        active: trainingOngoing + trainingPlanned,
        completed: trainingCompleted,
        onTime: trainingCompleted,
        late: trainingCancelled,
      },
      complaint: {
        total: apiWarranties.length,
        warranty: warrantyByType.warranty ?? 0,
        repair: (warrantyByType.repair ?? 0) + (warrantyByType.maintenance ?? 0),
        processing: warrantyOpen + warrantyProcessing,
        done: warrantyDone,
        onTime: warrantyDone,
        late: warrantyCancelled,
      },
      pakd: buildPakdFromMaterials(apiMaterials),
      customerProducts,
      customerRevenue,
      trend,
    };

    return {
      data,
      liveContracts: apiContracts.map(mapContractRow),
      liveHandovers: apiHandovers.map(mapHandoverRow),
      liveTrainings: apiTrainings.map(mapTrainingRow),
      liveProducts: apiProducts.map(mapProductRow),
      liveWarranties: apiWarranties.map(mapWarrantyRow),
      liveMaterials: apiMaterials,
      isLoading:
        contractsQ.isLoading ||
        handoversQ.isLoading ||
        trainingsQ.isLoading ||
        materialsQ.isLoading ||
        warrantiesQ.isLoading ||
        productsQ.isLoading ||
        reportsQ.isLoading,
      isError:
        contractsQ.isError ||
        handoversQ.isError ||
        trainingsQ.isError ||
        materialsQ.isError ||
        warrantiesQ.isError ||
        productsQ.isError ||
        reportsQ.isError,
    };
  }, [
    contractsQ.data,
    contractsQ.isLoading,
    contractsQ.isError,
    handoversQ.data,
    handoversQ.isLoading,
    handoversQ.isError,
    trainingsQ.data,
    trainingsQ.isLoading,
    trainingsQ.isError,
    materialsQ.data,
    materialsQ.isLoading,
    materialsQ.isError,
    warrantiesQ.data,
    warrantiesQ.isLoading,
    warrantiesQ.isError,
    productsQ.data,
    productsQ.isLoading,
    productsQ.isError,
    reportsQ.data,
    reportsQ.isLoading,
    reportsQ.isError,
  ]);

  return result;
}
