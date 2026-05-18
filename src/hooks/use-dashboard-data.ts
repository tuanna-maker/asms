import { useMemo } from "react";

import { useContractsList } from "@/hooks/use-contracts-api";
import { useHandoversList, type HandoverListItem } from "@/hooks/use-handovers-api";
import { useTrainingCoursesQuery } from "@/hooks/use-training";
import { useMaterialsList, type MaterialListRow } from "@/hooks/use-materials-api";
import { useWarrantiesList, type WarrantyListRow } from "@/hooks/use-warranties-api";
import { useProductsList, type ProductListItem } from "@/hooks/use-products-api";
import {
  useDashboardSummary,
  useReports,
  type DashboardSummaryApi,
} from "@/hooks/use-reports-api";
import type { ReportFilters } from "@/lib/report-filters";

import type { ComplaintRow, ContractRow, HandoverRow, ProductRow, TrainingRow } from "@/data/tableData";
import { emptyDashboardData, type DashboardData, type PakdSummary } from "@/data/dashboardData";

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

const INSPECTION_STATUSES = new Set([
  "inspection_submitted",
  "inspecting",
  "inspection_passed",
  "decision_approved",
]);

function mapProductRow(row: ProductListItem): ProductRow {
  let status: ProductRow["status"] = "producing";
  if (row.status === "equipped" || row.status === "equip_decided") status = "equipped";
  else if (row.status === "stopped" || INSPECTION_STATUSES.has(row.status)) status = "inspecting";
  else if (row.status === "produced") status = "inspecting";
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

function normalizePakd(raw: DashboardSummaryApi["pakd"]): PakdSummary {
  const materials = raw.materials ?? {
    total: raw.total ?? 0,
    valid: raw.valid ?? 0,
    expired: raw.expired ?? 0,
    items: raw.items ?? [],
  };
  const research = raw.research ?? { total: 0, valid: 0, expired: 0, items: [] };
  return {
    materials,
    research,
    total: materials.total,
    valid: materials.valid,
    expired: materials.expired,
    items: materials.items,
  };
}

function buildDashboardFromSummary(
  summary: DashboardSummaryApi,
  reportsTrend:
    | Array<{
        month: string;
        contracts: number;
        complaints: number;
        handovers: number;
        production?: number;
        training?: number;
      }>
    | undefined,
  completedThisMonth: number,
): DashboardData {
  const pp = summary.productProgress;
  const productTotal =
    pp.quantity.producing +
    pp.quantity.produced +
    pp.inspection.submitted +
    pp.inspection.inspecting +
    pp.inspection.passed +
    pp.decisionApproved +
    pp.equipped +
    pp.equipDecided;

  const customerProducts = summary.customerCare.customerBreakdown.map((c) => ({
    name: c.name,
    products: c.productsDelivered,
  }));
  const customerRevenue = summary.customerCare.customerBreakdown.map((c) => ({
    name: c.name,
    revenue: Math.round(c.revenue / 1_000_000),
  }));

  const trend = (reportsTrend ?? []).map((m) => ({
    month: m.month,
    sanXuat: Number(m.production ?? 0),
    hopDong: Number(m.contracts ?? 0),
    banGiao: Number(m.handovers ?? 0),
    huanLuyen: Number(m.training ?? 0),
  }));

  return {
    productProgress: summary.productProgress,
    contractProgress: summary.contractProgress,
    complaintProgress: summary.complaintProgress,
    handoverProgress: summary.handoverProgress,
    trainingProgress: summary.trainingProgress,
    customerCare: summary.customerCare,
    pakd: normalizePakd(summary.pakd),
    stats: {
      totalProducts: productTotal,
      activeContracts: summary.contractProgress.active,
      pendingComplaints: summary.complaintProgress.processing,
      completedThisMonth,
    },
    product: {
      total: productTotal,
      producing: pp.quantity.producing,
      inspecting:
        pp.quantity.produced +
        pp.inspection.submitted +
        pp.inspection.inspecting +
        pp.inspection.passed +
        pp.decisionApproved,
      equipped: pp.equipped + pp.equipDecided,
    },
    contract: {
      total: summary.contractProgress.total,
      active: summary.contractProgress.active,
      completed: summary.contractProgress.completedOnTime + summary.contractProgress.completedLate,
      onTime: summary.contractProgress.completedOnTime,
      late: summary.contractProgress.completedLate,
    },
    handover: {
      total: summary.handoverProgress.total,
      active: summary.handoverProgress.active,
      completed: summary.handoverProgress.completedOnTime + summary.handoverProgress.completedLate,
      onTime: summary.handoverProgress.completedOnTime,
      late: summary.handoverProgress.completedLate,
    },
    training: {
      total: summary.trainingProgress.totalBatches,
      active: summary.trainingProgress.active,
      completed: summary.trainingProgress.completedOnTime + summary.trainingProgress.completedLate,
      onTime: summary.trainingProgress.completedOnTime,
      late: summary.trainingProgress.completedLate,
    },
    complaint: {
      total: summary.complaintProgress.total,
      warranty: summary.complaintProgress.warranty,
      repair: summary.complaintProgress.repair,
      processing: summary.complaintProgress.processing,
      done: summary.complaintProgress.completedOnTime + summary.complaintProgress.completedLate,
      onTime: summary.complaintProgress.completedOnTime,
      late: summary.complaintProgress.completedLate,
    },
    customerProducts,
    customerRevenue,
    trend,
  };
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

export function useDashboardData(filters: ReportFilters): UseDashboardDataResult {
  const contractsQ = useContractsList();
  const handoversQ = useHandoversList();
  const trainingsQ = useTrainingCoursesQuery();
  const materialsQ = useMaterialsList();
  const warrantiesQ = useWarrantiesList();
  const productsQ = useProductsList();
  const summaryQ = useDashboardSummary(filters);
  const reportsQ = useReports(filters);

  const result = useMemo<UseDashboardDataResult>(() => {
    const apiContracts = (contractsQ.data ?? []).filter(isApiContractRow) as ApiContractRow[];
    const apiHandovers = (handoversQ.data ?? []) as HandoverListItem[];
    const apiTrainings = (trainingsQ.data ?? []) as unknown as TrainingApiRow[];
    const apiMaterials = (materialsQ.data ?? []) as MaterialListRow[];
    const apiWarranties = (warrantiesQ.data ?? []) as WarrantyListRow[];
    const apiProducts = (productsQ.data ?? []) as ProductListItem[];

    const completedThisMonth =
      apiContracts.filter((c) => (c.status === "completed" || c.status === "liquidated") && isThisMonth(c.endDate)).length +
      apiHandovers.filter((h) => h.status === "completed" && isThisMonth(h.completedAt ?? h.dueDate)).length +
      apiTrainings.filter((t) => t.status === "completed" && isThisMonth(t.endDate)).length;

    const data: DashboardData = summaryQ.data
      ? buildDashboardFromSummary(summaryQ.data, reportsQ.data?.trends?.monthly, completedThisMonth)
      : { ...emptyDashboardData, stats: { ...emptyDashboardData.stats, completedThisMonth } };

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
        summaryQ.isLoading ||
        reportsQ.isLoading,
      isError:
        contractsQ.isError ||
        handoversQ.isError ||
        trainingsQ.isError ||
        materialsQ.isError ||
        warrantiesQ.isError ||
        productsQ.isError ||
        summaryQ.isError ||
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
    summaryQ.data,
    summaryQ.isLoading,
    summaryQ.isError,
    reportsQ.data,
    reportsQ.isLoading,
    reportsQ.isError,
  ]);

  return result;
}
