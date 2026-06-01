import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertCircle, Loader2 } from "lucide-react";
import { FeedbackCustomerStatsSheet } from "@/components/feedback/stats/FeedbackCustomerStatsSheet";
import { FeedbackStatsPeriodBar } from "@/components/feedback/stats/FeedbackStatsPeriodBar";
import { FeedbackModuleNav } from "@/components/feedback/FeedbackModuleNav";
import {
  FeedbackStatisticsTab,
  type FeedbackStatsSubTab,
} from "@/components/feedback/FeedbackStatisticsTab";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  useFeedbackCustomerStatsDetail,
  useFeedbackStatsCatalog,
  useFeedbackStatsCustomerList,
  type FeedbackStatsByCustomerItem,
} from "@/hooks/use-feedback-analytics-api";
import {
  buildFeedbackStatsSearchParams,
  parseFeedbackStatsFromSearch,
  type FeedbackStatsPeriod,
} from "@/lib/feedback-analytics-filters";

const FeedbackStatistics = () => {
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { period, tab, filters } = useMemo(
    () => parseFeedbackStatsFromSearch(searchParams),
    [searchParams],
  );

  const [sheetCustomerId, setSheetCustomerId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (searchParams.toString()) return;
    setSearchParams(buildFeedbackStatsSearchParams(period, tab), { replace: true });
  }, [searchParams, setSearchParams, period, tab]);

  const customerQ = useFeedbackStatsCustomerList(filters, isAuthenticated && tab === "customer");
  const catalogQ = useFeedbackStatsCatalog(filters, isAuthenticated && tab === "catalog");
  const detailQ = useFeedbackCustomerStatsDetail(
    sheetCustomerId,
    filters,
    isAuthenticated && sheetOpen && Boolean(sheetCustomerId),
  );

  const isLoading = tab === "customer" ? customerQ.isLoading || customerQ.isFetching : catalogQ.isLoading;
  const isError = tab === "customer" ? customerQ.isError : catalogQ.isError;
  const error = tab === "customer" ? customerQ.error : catalogQ.error;

  const refetch = useCallback(() => {
    if (tab === "customer") void customerQ.refetch();
    else void catalogQ.refetch();
  }, [tab, customerQ, catalogQ]);

  const setPeriod = (nextPeriod: FeedbackStatsPeriod) => {
    const next = buildFeedbackStatsSearchParams(nextPeriod, tab);
    setSearchParams(next);
  };

  const handleSubTabChange = (nextTab: FeedbackStatsSubTab) => {
    const next = buildFeedbackStatsSearchParams(period, nextTab);
    setSearchParams(next);
  };

  const handleCustomerRowClick = (row: FeedbackStatsByCustomerItem) => {
    setSheetCustomerId(row.customerId);
    setSheetOpen(true);
  };

  const handleSheetOpenChange = (open: boolean) => {
    setSheetOpen(open);
    if (!open) setSheetCustomerId(null);
  };

  const errorMessage =
    error instanceof Error ? error.message : isError ? "Không tải được dữ liệu thống kê." : null;

  return (
    <div className="space-y-6">
      <FeedbackModuleNav />
      <div>
        <h2 className="text-lg font-semibold">Thống kê khiếu nại</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Theo khách hàng, sản phẩm và vật tư từ ticket phản ánh và liên kết HĐ/SP/VT trong kỳ đã chọn.
        </p>
      </div>

      <FeedbackStatsPeriodBar value={period} onChange={setPeriod} />

      {isError ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {errorMessage}
          </span>
          <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
            Thử lại
          </Button>
        </div>
      ) : null}

      {isLoading && !isError ? (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang tải thống kê…
        </p>
      ) : null}

      <FeedbackStatisticsTab
        byCustomer={customerQ.data ?? []}
        products={catalogQ.products}
        materials={catalogQ.materials}
        loadingCustomer={customerQ.isLoading || customerQ.isFetching}
        loadingCatalog={catalogQ.isLoading}
        subTab={tab}
        onSubTabChange={handleSubTabChange}
        onCustomerRowClick={handleCustomerRowClick}
      />

      <FeedbackCustomerStatsSheet
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        data={detailQ.data}
        isLoading={detailQ.isLoading || detailQ.isFetching}
        isError={detailQ.isError}
        onRetry={() => void detailQ.refetch()}
      />
    </div>
  );
};

export default FeedbackStatistics;
