import { BarChart3, Building2, FileText, Package, TrendingDown, TrendingUp, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContractReportTab } from "@/components/reports/ContractReportTab";
import { CustomerReportTab } from "@/components/reports/CustomerReportTab";
import { FeedbackReportTab } from "@/components/reports/FeedbackReportTab";
import { ProductLineReportTab } from "@/components/reports/ProductLineReportTab";
import { ReportsFilterBar } from "@/components/reports/ReportsFilterBar";
import { UnitPerformanceTab } from "@/components/reports/UnitPerformanceTab";
import type { ReportFilters } from "@/lib/report-filters";
import type {
  FeedbackByCustomerItem,
  FeedbackByProductLineItem,
  ProductLineReportItem,
  ReportsApi,
} from "@/hooks/use-reports-api";
import type { MaterialDefectItem } from "@/hooks/use-material-defects";

export type MainReportTab = "customer" | "contract" | "product-line" | "feedback" | "unit";

type Props = {
  draftFilters: ReportFilters;
  onDraftFiltersChange: (f: ReportFilters) => void;
  onApplyFilters: () => void;
  activeTab: MainReportTab;
  onActiveTabChange: (tab: MainReportTab) => void;
  feedbackSubTab: string;
  onFeedbackSubTabChange: (v: string) => void;
  reports?: ReportsApi;
  productLine: ProductLineReportItem[];
  feedbackCustomer: FeedbackByCustomerItem[];
  feedbackProductLine: FeedbackByProductLineItem[];
  materialItems: MaterialDefectItem[];
  materialTotalWarranties: number;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onExportExcel?: () => void;
  onExportPdf?: () => void;
};

export function ReportsPageShell({
  draftFilters,
  onDraftFiltersChange,
  onApplyFilters,
  activeTab,
  onActiveTabChange,
  feedbackSubTab,
  onFeedbackSubTabChange,
  reports,
  productLine,
  feedbackCustomer,
  feedbackProductLine,
  materialItems,
  materialTotalWarranties,
  isLoading,
  isError,
  errorMessage,
  onExportExcel,
  onExportPdf,
}: Props) {
  const contractsTotal = reports?.contracts.total ?? 0;
  const deliveredTotal = reports?.products.deliveredTotal ?? 0;
  const warrantiesTotal = reports?.warranties.total ?? 0;
  const customersTotal = reports?.customers.total ?? 0;
  const delta = reports?.summary_delta;

  return (
    <div id="report-print-area" className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-5 w-5 text-primary" />
        <span className="font-semibold text-card-foreground">Báo cáo & Thống kê</span>
      </div>

      <ReportsFilterBar
        draft={draftFilters}
        onDraftChange={onDraftFiltersChange}
        onApply={onApplyFilters}
        onExportExcel={onExportExcel}
        onExportPdf={onExportPdf}
      />

      {isLoading ? (
        <div className="rounded-xl border border-border/50 bg-card p-4 text-sm text-muted-foreground">
          Đang tải dữ liệu báo cáo...
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {errorMessage ?? "Không tải được dữ liệu báo cáo."}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={<FileText className="h-6 w-6" />}
          label="Tổng HĐ"
          value={contractsTotal}
          delta={delta?.contractsPct}
          positiveGood
        />
        <SummaryCard
          icon={<Package className="h-6 w-6" />}
          label="SP đã giao"
          value={deliveredTotal}
          delta={delta?.deliveredPct}
          positiveGood
        />
        <SummaryCard
          icon={<Users className="h-6 w-6" />}
          label="Phiếu BH/SC"
          value={warrantiesTotal}
          delta={delta?.warrantiesPct}
          positiveGood={false}
        />
        <div className="flex items-center gap-4 rounded-xl border border-border/50 bg-card p-4 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Khách hàng</p>
            <p className="text-2xl font-bold text-card-foreground">{customersTotal}</p>
          </div>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => onActiveTabChange(v as MainReportTab)}
        className="flex min-h-[520px] flex-col"
      >
        <TabsList className="w-full flex-wrap justify-start">
          <TabsTrigger value="customer">Theo khách hàng</TabsTrigger>
          <TabsTrigger value="contract">Theo hợp đồng</TabsTrigger>
          <TabsTrigger value="product-line">Theo dòng sản phẩm</TabsTrigger>
          <TabsTrigger value="feedback">Phản ánh</TabsTrigger>
          <TabsTrigger value="unit">Đơn vị thực hiện</TabsTrigger>
        </TabsList>

        <div className="relative mt-4 min-h-[480px] flex-1">
          <TabsContent value="customer" className="absolute inset-0 mt-0 overflow-y-auto data-[state=inactive]:hidden">
            <CustomerReportTab reports={reports} feedback={feedbackCustomer} isLoading={isLoading} />
          </TabsContent>
          <TabsContent value="contract" className="absolute inset-0 mt-0 overflow-y-auto data-[state=inactive]:hidden">
            <ContractReportTab reports={reports} isLoading={isLoading} />
          </TabsContent>
          <TabsContent value="product-line" className="absolute inset-0 mt-0 overflow-y-auto data-[state=inactive]:hidden">
            <ProductLineReportTab items={productLine} isLoading={isLoading} />
          </TabsContent>
          <TabsContent value="feedback" className="absolute inset-0 mt-0 flex flex-col overflow-hidden data-[state=inactive]:hidden">
            <FeedbackReportTab
              feedbackCustomer={feedbackCustomer}
              feedbackProductLine={feedbackProductLine}
              materialItems={materialItems}
              totalWarranties={materialTotalWarranties}
              loadingCustomer={isLoading}
              loadingProductLine={isLoading}
              loadingMaterial={isLoading}
              subTab={feedbackSubTab}
              onSubTabChange={onFeedbackSubTabChange}
            />
          </TabsContent>
          <TabsContent value="unit" className="absolute inset-0 mt-0 overflow-y-auto data-[state=inactive]:hidden">
            <UnitPerformanceTab reports={reports} isLoading={isLoading} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  delta,
  positiveGood,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  delta?: number;
  positiveGood: boolean;
}) {
  const pct = delta ?? 0;
  const isUp = pct >= 0;
  const good = positiveGood ? isUp : !isUp;
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border/50 bg-card p-4 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="flex items-center gap-2">
          <p className="text-2xl font-bold text-card-foreground">{value}</p>
          {delta !== undefined ? (
            <span className={`flex items-center text-xs ${good ? "text-success" : "text-destructive"}`}>
              {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(pct)}%
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
