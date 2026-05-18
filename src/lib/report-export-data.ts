import type { ExportSheet } from "@/lib/report-export";
import { CONTRACT_STATUS_LABELS, WARRANTY_TYPE_LABELS, type ReportFilters } from "@/lib/report-filters";
import type {
  FeedbackByCustomerItem,
  FeedbackByProductLineItem,
  ProductLineReportItem,
  ReportsApi,
} from "@/hooks/use-reports-api";
import type { MaterialDefectItem } from "@/hooks/use-material-defects";

export type ReportTabId = "customer" | "contract" | "product-line" | "feedback" | "unit";
export type FeedbackSubTab = "customer" | "product-line" | "material";

type ExportContext = {
  tab: ReportTabId;
  feedbackSubTab?: FeedbackSubTab;
  filters: ReportFilters;
  reports?: ReportsApi;
  productLine: ProductLineReportItem[];
  feedbackCustomer: FeedbackByCustomerItem[];
  feedbackProductLine: FeedbackByProductLineItem[];
  materialItems: MaterialDefectItem[];
};

function filterMeta(filters: ReportFilters) {
  const period =
    filters.from || filters.to
      ? `${filters.from ?? "…"} → ${filters.to ?? "…"}`
      : `Năm ${filters.year ?? "—"}`;
  return [{ "Bộ lọc": period }];
}

export function buildExportSheets(ctx: ExportContext): ExportSheet[] {
  const meta = filterMeta(ctx.filters);

  switch (ctx.tab) {
    case "customer": {
      const ticketMap = new Map(ctx.feedbackCustomer.map((f) => [f.name, f.tickets]));
      const rows =
        ctx.reports?.customer_breakdown?.map((c) => ({
          "Khách hàng": c.name,
          "Số HĐ": c.contracts,
          "Giá trị (triệu)": c.value,
          "Phiếu BH/SC": ticketMap.get(c.name) ?? 0,
        })) ?? [];
      return [{ name: "Theo KH", rows: [...meta, ...rows] }];
    }
    case "contract": {
      const rows =
        ctx.reports?.contracts_list?.map((c) => ({
          Mã: c.code,
          "Tên HĐ": c.title,
          "Khách hàng": c.customerName,
          "Trạng thái": CONTRACT_STATUS_LABELS[c.status] ?? c.status,
          "Giá trị": c.value,
          "Tiến độ %": c.progress,
        })) ?? [];
      return [{ name: "Theo HĐ", rows: [...meta, ...rows] }];
    }
    case "product-line": {
      const rows = ctx.productLine.map((r) => ({
        "Dòng SP": r.category,
        "Sản xuất": r.produced,
        "Đã giao": r.delivered,
        "Phiếu BH/SC": r.warrantyCount,
      }));
      return [{ name: "Dong SP", rows: [...meta, ...rows] }];
    }
    case "feedback": {
      if (ctx.feedbackSubTab === "product-line") {
        const rows = ctx.feedbackProductLine.map((r) => ({
          "Dòng SP": r.category,
          "Tổng phiếu": r.tickets,
          "Phân loại": Object.entries(r.byType)
            .map(([t, n]) => `${WARRANTY_TYPE_LABELS[t] ?? t}: ${n}`)
            .join("; "),
        }));
        return [{ name: "PA dong SP", rows: [...meta, ...rows] }];
      }
      if (ctx.feedbackSubTab === "material") {
        const rows = ctx.materialItems.map((r) => ({
          Mã: r.code,
          Tên: r.name,
          Loại: r.type,
          "Lỗi ước tính": r.defects,
          "SP ảnh hưởng": r.affectedProducts,
        }));
        return [{ name: "PA vat tu", rows: [...meta, ...rows] }];
      }
      const rows = ctx.feedbackCustomer.map((r) => ({
        "Khách hàng": r.name,
        "Tổng phiếu": r.tickets,
        "Phân loại": Object.entries(r.byType)
          .map(([t, n]) => `${WARRANTY_TYPE_LABELS[t] ?? t}: ${n}`)
          .join("; "),
      }));
      return [{ name: "PA khach hang", rows: [...meta, ...rows] }];
    }
    case "unit": {
      const rows =
        ctx.reports?.unit_performance?.map((u) => ({
          "Vai trò": u.unit,
          "Nhiệm vụ": u.tasks,
          "Hoàn thành": u.completed,
          "Đúng hạn": u.onTime,
          "Hài lòng %": u.satisfaction,
        })) ?? [];
      return [{ name: "Don vi", rows: [...meta, ...rows] }];
    }
    default:
      return [{ name: "Bao cao", rows: meta }];
  }
}
