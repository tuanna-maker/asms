import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ReportsPageShell, type MainReportTab } from "@/components/reports/ReportsPageShell";
import {
  useReports,
  useReportsByProductLine,
  useReportsFeedbackByCustomer,
  useReportsFeedbackByProductLine,
} from "@/hooks/use-reports-api";
import { useMaterialDefects } from "@/hooks/use-material-defects";
import { buildExportSheets, type FeedbackSubTab } from "@/lib/report-export-data";
import { exportSheetsToExcel, printReportArea } from "@/lib/report-export";
import { parseReportFiltersFromSearch, type ReportFilters } from "@/lib/report-filters";

const Reports = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const appliedFilters = useMemo(() => parseReportFiltersFromSearch(searchParams), [searchParams]);
  const [draftFilters, setDraftFilters] = useState<ReportFilters>(appliedFilters);
  const [activeTab, setActiveTab] = useState<MainReportTab>(
    (searchParams.get("tab") as MainReportTab) || "customer",
  );
  const [feedbackSubTab, setFeedbackSubTab] = useState(
    searchParams.get("feedbackTab") ?? "customer",
  );

  useEffect(() => {
    setDraftFilters(appliedFilters);
  }, [appliedFilters]);

  const { data: reports, isLoading, isError, error } = useReports(appliedFilters);
  const { data: productLine = [] } = useReportsByProductLine(appliedFilters);
  const { data: feedbackCustomer = [] } = useReportsFeedbackByCustomer(appliedFilters);
  const { data: feedbackProductLine = [] } = useReportsFeedbackByProductLine(appliedFilters);
  const { data: materialData } = useMaterialDefects({ ...appliedFilters, limit: 50 });
  const materialItems = materialData?.items ?? [];
  const materialTotalWarranties = materialData?.totalWarranties ?? 0;

  const applyFilters = useCallback(() => {
    const next = new URLSearchParams();
    if (draftFilters.year) next.set("year", draftFilters.year);
    if (draftFilters.from) next.set("from", draftFilters.from);
    if (draftFilters.to) next.set("to", draftFilters.to);
    if (activeTab) next.set("tab", activeTab);
    if (feedbackSubTab) next.set("feedbackTab", feedbackSubTab);
    setSearchParams(next);
  }, [draftFilters, activeTab, feedbackSubTab, setSearchParams]);

  const handleTabChange = (tab: MainReportTab) => {
    setActiveTab(tab);
    const next = new URLSearchParams(searchParams);
    next.set("tab", tab);
    setSearchParams(next);
  };

  const handleFeedbackSubTab = (v: string) => {
    setFeedbackSubTab(v);
    const next = new URLSearchParams(searchParams);
    next.set("feedbackTab", v);
    setSearchParams(next);
  };

  const exportContext = useMemo(
    () => ({
      tab: activeTab,
      feedbackSubTab: feedbackSubTab as FeedbackSubTab,
      filters: appliedFilters,
      reports,
      productLine,
      feedbackCustomer,
      feedbackProductLine,
      materialItems,
    }),
    [
      activeTab,
      feedbackSubTab,
      appliedFilters,
      reports,
      productLine,
      feedbackCustomer,
      feedbackProductLine,
      materialItems,
    ],
  );

  const handleExportExcel = () => {
    const sheets = buildExportSheets(exportContext);
    const label =
      appliedFilters.from || appliedFilters.to
        ? `${appliedFilters.from ?? ""}_${appliedFilters.to ?? ""}`
        : appliedFilters.year ?? "bao-cao";
    exportSheetsToExcel(sheets, `bao-cao-${activeTab}-${label}`);
  };

  const handleExportPdf = () => {
    printReportArea("report-print-area");
  };

  const loadError = error instanceof Error ? error.message : "Không tải được dữ liệu báo cáo.";

  return (
    <ReportsPageShell
      draftFilters={draftFilters}
      onDraftFiltersChange={setDraftFilters}
      onApplyFilters={applyFilters}
      activeTab={activeTab}
      onActiveTabChange={handleTabChange}
      feedbackSubTab={feedbackSubTab}
      onFeedbackSubTabChange={handleFeedbackSubTab}
      reports={reports}
      productLine={productLine}
      feedbackCustomer={feedbackCustomer}
      feedbackProductLine={feedbackProductLine}
      materialItems={materialItems}
      materialTotalWarranties={materialTotalWarranties}
      isLoading={isLoading}
      isError={isError}
      errorMessage={loadError}
      onExportExcel={handleExportExcel}
      onExportPdf={handleExportPdf}
    />
  );
};

export default Reports;
