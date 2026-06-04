import { useEffect, useMemo, useRef, useState } from "react";
import { GitBranch, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api-errors";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DynamicStepFormFields } from "@/components/workflow/DynamicStepFormFields";
import { WorkflowInstancePanel } from "@/components/workflow/WorkflowInstancePanel";
import {
  useAttachWorkflow,
  useInstanceForEntity,
  useWorkflowDetail,
  useWorkflowsList,
} from "@/hooks/use-workflows-api";
import {
  productStepTabLabel,
  initProductStepPayloads,
  type ProductStepPayloadRecord,
} from "@/lib/product-step-payload";
import { resolveInitialWorkflowStepTabId } from "@/lib/workflow-step-tab";
import { workflowStepTabTriggerClass } from "@/components/workflow/WorkflowStepSegments";

type WorkflowSnapshot = {
  instanceId: string;
  workflowId: string;
  workflowName: string;
  currentStepIndex: number;
  totalSteps: number;
  steps: Array<{ id: string }>;
};

type Props = {
  open: boolean;
  productDbId: string | null;
  isCreateMode: boolean;
  detailWorkflow: WorkflowSnapshot | null | undefined;
  detailStepPayloads?: ProductStepPayloadRecord;
  selectedWorkflowId: string;
  onSelectedWorkflowIdChange: (id: string) => void;
  stepPayloads: ProductStepPayloadRecord;
  onStepPayloadsChange: (next: ProductStepPayloadRecord) => void;
};

export function ProductWorkflowSection({
  open,
  productDbId,
  isCreateMode,
  detailWorkflow,
  detailStepPayloads,
  selectedWorkflowId,
  onSelectedWorkflowIdChange,
  stepPayloads,
  onStepPayloadsChange,
}: Props) {
  const attachWf = useAttachWorkflow();
  const [formTab, setFormTab] = useState("");
  const [pendingSwitchId, setPendingSwitchId] = useState<string | null>(null);
  const autoAttachAttempted = useRef(false);

  const { data: productWorkflows = [] } = useWorkflowsList("product", { enabled: open });
  const { data: liveInstance } = useInstanceForEntity("product", productDbId, {
    enabled: Boolean(productDbId) && open && !isCreateMode,
  });

  const workflowIdForDetail =
    selectedWorkflowId ||
    liveInstance?.workflowId ||
    detailWorkflow?.workflowId ||
    null;

  const { data: workflowDetail, isFetching: workflowDetailLoading } = useWorkflowDetail(
    workflowIdForDetail,
    { enabled: open && !!workflowIdForDetail },
  );

  const workflowEditHref = workflowIdForDetail
    ? `/quy-trinh/product/${workflowIdForDetail}`
    : null;

  const stepsForTabs = useMemo(() => {
    if (!workflowDetail?.steps?.length) return [];
    return [...workflowDetail.steps].sort((a, b) => a.order - b.order);
  }, [workflowDetail?.steps]);

  const workflowOptions = useMemo(
    () =>
      productWorkflows.filter(
        (w) =>
          w.isActive ||
          w.id === selectedWorkflowId ||
          w.id === liveInstance?.workflowId,
      ),
    [productWorkflows, selectedWorkflowId, liveInstance?.workflowId],
  );

  const hasWorkflowSelected = Boolean(workflowIdForDetail);
  const workflowReady = hasWorkflowSelected && !workflowDetailLoading && Boolean(workflowDetail);
  const showDynamicTabs = workflowReady && stepsForTabs.length > 0;

  useEffect(() => {
    if (!open || !isCreateMode || selectedWorkflowId) return;
    const def =
      productWorkflows.find((w) => w.code === "WF_PRODUCT_DEFAULT") ??
      productWorkflows.find((w) => w.isActive);
    if (def) onSelectedWorkflowIdChange(def.id);
  }, [open, isCreateMode, productWorkflows, selectedWorkflowId, onSelectedWorkflowIdChange]);

  useEffect(() => {
    if (!open || !stepsForTabs.length) return;
    if (detailStepPayloads && Object.keys(detailStepPayloads).length > 0) {
      onStepPayloadsChange(initProductStepPayloads(stepsForTabs, detailStepPayloads));
    } else if (isCreateMode && selectedWorkflowId) {
      onStepPayloadsChange(initProductStepPayloads(stepsForTabs));
    }
  }, [open, detailStepPayloads, stepsForTabs, isCreateMode, selectedWorkflowId, onStepPayloadsChange]);

  useEffect(() => {
    if (!open || !stepsForTabs.length) return;
    const tabId = resolveInitialWorkflowStepTabId(stepsForTabs, {
      liveCurrentStepId: liveInstance?.currentStepId,
      snapshot: detailWorkflow ?? null,
    });
    if (tabId) setFormTab(tabId);
  }, [open, stepsForTabs, liveInstance?.currentStepId, detailWorkflow]);

  useEffect(() => {
    if (!open) autoAttachAttempted.current = false;
  }, [open, productDbId]);

  // Đã chọn quy trình nhưng SP chưa có instance (chỉ tạo mẫu ở màn Quy trình) → gắn tự động
  useEffect(() => {
    if (
      !open ||
      isCreateMode ||
      !productDbId ||
      !selectedWorkflowId ||
      liveInstance ||
      attachWf.isPending ||
      autoAttachAttempted.current ||
      detailWorkflow?.instanceId
    ) {
      return;
    }
    autoAttachAttempted.current = true;
    void attachWf
      .mutateAsync({
        moduleKey: "product",
        entityId: productDbId,
        workflowId: selectedWorkflowId,
      })
      .catch(() => {
        autoAttachAttempted.current = false;
      });
  }, [
    open,
    isCreateMode,
    productDbId,
    selectedWorkflowId,
    liveInstance,
    attachWf,
    detailWorkflow?.instanceId,
  ]);

  const handleWorkflowSelect = (workflowId: string) => {
    if (isCreateMode) {
      if (workflowId !== selectedWorkflowId) {
        onStepPayloadsChange({});
        toast.message("Đã đổi quy trình — nội dung các bước được làm mới.");
      }
      onSelectedWorkflowIdChange(workflowId);
      return;
    }
    if (!productDbId) return;
    if (workflowId === liveInstance?.workflowId) {
      onSelectedWorkflowIdChange(workflowId);
      return;
    }
    // Chưa có instance trên SP — gắn quy trình ngay (không chỉ tạo mẫu ở màn Quy trình)
    if (!liveInstance) {
      void (async () => {
        try {
          await attachWf.mutateAsync({
            moduleKey: "product",
            entityId: productDbId,
            workflowId,
          });
          onSelectedWorkflowIdChange(workflowId);
          toast.success("Đã áp dụng quy trình cho sản phẩm");
        } catch (e) {
          toast.error(getApiErrorMessage(e, "Không áp dụng được quy trình"));
        }
      })();
      return;
    }
    setPendingSwitchId(workflowId);
  };

  const confirmSwitch = async () => {
    if (!productDbId || !pendingSwitchId) return;
    try {
      await attachWf.mutateAsync({
        moduleKey: "product",
        entityId: productDbId,
        workflowId: pendingSwitchId,
      });
      toast.success("Đã áp dụng quy trình mới");
      setPendingSwitchId(null);
      onSelectedWorkflowIdChange(pendingSwitchId);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Không áp dụng được quy trình"));
    }
  };

  const patchStepPayload = (stepId: string, key: string, value: unknown) => {
    onStepPayloadsChange({
      ...stepPayloads,
      [stepId]: { ...(stepPayloads[stepId] ?? {}), [key]: value },
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5 max-w-3xl">
        <Label>Quy trình sản phẩm</Label>
        <Select
          value={selectedWorkflowId || undefined}
          onValueChange={handleWorkflowSelect}
          disabled={attachWf.isPending}
        >
          <SelectTrigger>
            <GitBranch className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
            <SelectValue placeholder="Chọn quy trình sản phẩm" />
          </SelectTrigger>
          <SelectContent>
            {workflowOptions.map((wf) => (
              <SelectItem key={wf.id} value={wf.id}>
                {wf.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {workflowDetailLoading ? (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" /> Đang tải các bước…
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          Trạng thái sản phẩm tự chuyển khi duyệt bước quy trình.
        </p>
      </div>

      {!hasWorkflowSelected ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Chọn quy trình sản phẩm để hiển thị các bước.
        </div>
      ) : workflowDetailLoading ? (
        <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground py-12">
          <Loader2 className="h-5 w-5 animate-spin" />
          Đang tải các bước từ quy trình…
        </div>
      ) : !showDynamicTabs ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Quy trình chưa có bước hoặc chưa cấu hình trường bước.
        </div>
      ) : (
        <Tabs value={formTab} onValueChange={setFormTab} className="space-y-0">
          <div className="border-b border-border overflow-x-auto">
            <TabsList className="h-11 w-max min-w-full bg-transparent p-0 gap-1">
              {stepsForTabs.map((step) => (
                <TabsTrigger key={step.id} value={step.id} className={workflowStepTabTriggerClass}>
                  {productStepTabLabel(step.order, step.name)}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          {stepsForTabs.map((step) => (
            <TabsContent
              key={step.id}
              value={step.id}
              className="mt-0 py-4 space-y-4 focus-visible:outline-none data-[state=inactive]:hidden"
            >
              <DynamicStepFormFields
                fieldSchema={step.fieldSchema}
                values={stepPayloads[step.id] ?? {}}
                onChange={(key, value) => patchStepPayload(step.id, key, value)}
                stepDescription={step.description}
                workflowEditHref={workflowEditHref}
              />
              {productDbId && !isCreateMode ? (
                <WorkflowInstancePanel
                  moduleKey="product"
                  entityId={productDbId}
                  focusStepId={step.id}
                  compact
                />
              ) : null}
            </TabsContent>
          ))}
        </Tabs>
      )}

      <AlertDialog open={Boolean(pendingSwitchId)} onOpenChange={(o) => !o && setPendingSwitchId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Áp dụng quy trình khác?</AlertDialogTitle>
            <AlertDialogDescription>
              Tiến trình hiện tại sẽ đóng và tạo lại từ bước đầu theo quy trình mới. Bạn có chắc?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={attachWf.isPending}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmSwitch();
              }}
              disabled={attachWf.isPending}
            >
              {attachWf.isPending ? "Đang áp dụng…" : "Áp dụng"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
