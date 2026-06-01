import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeedbackStatsCatalogPanel } from "@/components/feedback/stats/FeedbackStatsCatalogPanel";
import { FeedbackStatsCustomerTable } from "@/components/feedback/stats/FeedbackStatsCustomerTable";
import type { FeedbackStatsByCustomerItem } from "@/hooks/use-feedback-analytics-api";
import type {
  FeedbackStatsByMaterialItem,
  FeedbackStatsByProductItem,
} from "@/hooks/use-feedback-analytics-api";
import type { FeedbackStatsSubTab } from "@/lib/feedback-analytics-filters";

export type { FeedbackStatsSubTab };

type Props = {
  byCustomer: FeedbackStatsByCustomerItem[];
  products: FeedbackStatsByProductItem[];
  materials: FeedbackStatsByMaterialItem[];
  loadingCustomer?: boolean;
  loadingCatalog?: boolean;
  subTab?: FeedbackStatsSubTab;
  onSubTabChange?: (v: FeedbackStatsSubTab) => void;
  onCustomerRowClick: (row: FeedbackStatsByCustomerItem) => void;
};

export function FeedbackStatisticsTab({
  byCustomer,
  products,
  materials,
  loadingCustomer,
  loadingCatalog,
  subTab = "customer",
  onSubTabChange,
  onCustomerRowClick,
}: Props) {
  return (
    <Tabs
      value={subTab}
      onValueChange={(v) => onSubTabChange?.(v as FeedbackStatsSubTab)}
      className="flex min-h-0 flex-1 flex-col"
    >
      <TabsList className="mb-4 w-full justify-start">
        <TabsTrigger value="customer">Khách hàng</TabsTrigger>
        <TabsTrigger value="catalog">Sản phẩm & Vật tư</TabsTrigger>
      </TabsList>
      <div className="relative min-h-[420px] flex-1">
        <TabsContent
          value="customer"
          className="absolute inset-0 mt-0 overflow-y-auto data-[state=inactive]:hidden"
        >
          <FeedbackStatsCustomerTable
            items={byCustomer}
            isLoading={loadingCustomer}
            onRowClick={onCustomerRowClick}
          />
        </TabsContent>
        <TabsContent
          value="catalog"
          className="absolute inset-0 mt-0 overflow-y-auto data-[state=inactive]:hidden"
        >
          <FeedbackStatsCatalogPanel
            products={products}
            materials={materials}
            isLoading={loadingCatalog}
          />
        </TabsContent>
      </div>
    </Tabs>
  );
}
