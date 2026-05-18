import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeedbackByCustomerView } from "@/components/reports/FeedbackByCustomerView";
import { FeedbackByMaterialView } from "@/components/reports/FeedbackByMaterialView";
import { FeedbackByProductLineView } from "@/components/reports/FeedbackByProductLineView";
import type { FeedbackByCustomerItem, FeedbackByProductLineItem } from "@/hooks/use-reports-api";
import type { MaterialDefectItem } from "@/hooks/use-material-defects";

type Props = {
  feedbackCustomer: FeedbackByCustomerItem[];
  feedbackProductLine: FeedbackByProductLineItem[];
  materialItems: MaterialDefectItem[];
  totalWarranties: number;
  loadingCustomer?: boolean;
  loadingProductLine?: boolean;
  loadingMaterial?: boolean;
  subTab?: string;
  onSubTabChange?: (v: string) => void;
};

export function FeedbackReportTab({
  feedbackCustomer,
  feedbackProductLine,
  materialItems,
  totalWarranties,
  loadingCustomer,
  loadingProductLine,
  loadingMaterial,
  subTab = "customer",
  onSubTabChange,
}: Props) {
  return (
    <Tabs value={subTab} onValueChange={onSubTabChange} className="flex min-h-0 flex-1 flex-col">
      <TabsList className="mb-4 w-full justify-start">
        <TabsTrigger value="customer">Theo khách hàng</TabsTrigger>
        <TabsTrigger value="product-line">Theo dòng sản phẩm</TabsTrigger>
        <TabsTrigger value="material">Chủng loại vật tư/LK</TabsTrigger>
      </TabsList>
      <div className="relative min-h-[420px] flex-1">
        <TabsContent value="customer" className="absolute inset-0 mt-0 overflow-y-auto data-[state=inactive]:hidden">
          <FeedbackByCustomerView items={feedbackCustomer} isLoading={loadingCustomer} />
        </TabsContent>
        <TabsContent value="product-line" className="absolute inset-0 mt-0 overflow-y-auto data-[state=inactive]:hidden">
          <FeedbackByProductLineView items={feedbackProductLine} isLoading={loadingProductLine} />
        </TabsContent>
        <TabsContent value="material" className="absolute inset-0 mt-0 overflow-y-auto data-[state=inactive]:hidden">
          <FeedbackByMaterialView
            items={materialItems}
            totalWarranties={totalWarranties}
            isLoading={loadingMaterial}
          />
        </TabsContent>
      </div>
    </Tabs>
  );
}
