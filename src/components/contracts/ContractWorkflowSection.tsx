import { useEffect, useMemo, useState } from "react";
import { GitBranch, Loader2 } from "lucide-react";
import { toast } from "sonner";
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
  contractStepTabLabel,
  initContractStepPayloads,
  type ContractStepPayloadRecord,
} from "@/lib/contract-step-payload";
import { progressFromWorkflowSteps } from "@/lib/contract-workflow-progress";
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
  contractDbId: string | null;
  isCreateMode: boolean;
  detailWorkflow: WorkflowSnapshot | null | undefined;
  detailStepPayloads?: ContractStepPayloadRecord;
  detailWorkflowId?: string | null;
  selectedWorkflowId: string;
  onSelectedWorkflowIdChange: (id: string) => void;
  stepPayloads: ContractStepPayloadRecord;
  onStepPayloadsChange: (next: ContractStepPayloadRecord) => void;
  onProgressHintChange?: (percent: number) => void;
};

function getApiErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null) {
    const maybe = error as { response?: { data?: { message?: string } }; message?: string };
    if (maybe.response?.data?.message) return maybe.response.data.message;
    if (maybe.message) return maybe.message;
  }
  return fallback;
}

export function ContractWorkflowSection({
  open,
  contractDbId,
  isCreateMode,
  detailWorkflow,
  detailStepPayloads,
  detailWorkflowId,
  selectedWorkflowId,
  onSelectedWorkflowIdChange,
  stepPayloads,
  onStepPayloadsChange,
  onProgressHintChange,
}: Props) {
  const attachWf = useAttachWorkflow();
  const [formTab, setFormTab] = useState("");
  const [pendingSwitchId, setPendingSwitchId] = useState<string | null>(null);

  const { data: contractWorkflows = [] } = useWorkflowsList("contract", { enabled: open });
  const { data: liveInstance } = useInstanceForEntity("contract", contractDbId, {
    enabled: Boolean(contractDbId) && open && !isCreateMode,
  });

  const workflowIdForDetail =
    selectedWorkflowId ||
    liveInstance?.workflowId ||
    detailWorkflow?.workflowId ||
    detailWorkflowId ||
    null;

  const { data: workflowDetail, isFetching: workflowDetailLoading } = useWorkflowDetail(
    workflowIdForDetail,
    { enabled: open && !!workflowIdForDetail },
  );

  const workflowEditHref = workflowIdForDetail
    ? `/quy-trinh/contract/${workflowIdForDetail}`
    : null;

  const stepsForTabs = useMemo(() => {
    if (!workflowDetail?.steps?.length) return [];
    return [...workflowDetail.steps].sort((a, b) => a.order - b.order);
  }, [workflowDetail?.steps]);

  const workflowOptions = useMemo(
    () =>
      contractWorkflows.filter(
        (w) =>
          w.isActive ||
          w.id === selectedWorkflowId ||
          w.id === liveInstance?.workflowId ||
          w.id === detailWorkflowId,
      ),
    [contractWorkflows, selectedWorkflowId, liveInstance?.workflowId, detailWorkflowId],
  );

  const hasWorkflowSelected = Boolean(workflowIdForDetail);
  const workflowReady = hasWorkflowSelected && !workflowDetailLoading && Boolean(workflowDetail);
  const showDynamicTabs = workflowReady && stepsForTabs.length > 0;

  const progressHint = useMemo(() => {
    if (liveInstance?.workflow?.steps?.length) {
      const total = liveInstance.workflow.steps.length;
      const idx = liveInstance.currentStepId
        ? liveInstance.workflow.steps.findIndex((s) => s.id === liveInstance.currentStepId) + 1
        : 1;
      return progressFromWorkflowSteps(Math.max(1, idx), total);
    }
    if (detailWorkflow?.totalSteps) {
      return progressFromWorkflowSteps(
        detailWorkflow.currentStepIndex || 1,
        detailWorkflow.totalSteps,
      );
    }
    if (stepsForTabs.length > 0) {
      return progressFromWorkflowSteps(1, stepsForTabs.length);
    }
    return 0;
  }, [liveInstance, detailWorkflow, stepsForTabs.length]);

  useEffect(() => {
    onProgressHintChange?.(progressHint);
  }, [progressHint, onProgressHintChange]);

  useEffect(() => {
    if (!open || !isCreateMode || selectedWorkflowId) return;
    const def =
      contractWorkflows.find((w) => w.code === "WF_CONTRACT_DEFAULT") ??
      contractWorkflows.find((w) => w.isActive);
    if (def) onSelectedWorkflowIdChange(def.id);
  }, [open, isCreateMode, contractWorkflows, selectedWorkflowId, onSelectedWorkflowIdChange]);

  useEffect(() => {
    if (!open || !stepsForTabs.length) return;
    if (detailStepPayloads && Object.keys(detailStepPayloads).length > 0) {
      onStepPayloadsChange(initContractStepPayloads(stepsForTabs, detailStepPayloads));
    } else if (isCreateMode && selectedWorkflowId) {
      onStepPayloadsChange(initContractStepPayloads(stepsForTabs));
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

  const handleWorkflowSelect = (workflowId: string) => {
    if (isCreateMode) {
      if (workflowId !== selectedWorkflowId) {
        onStepPayloadsChange({});
        toast.message("Đã đổi quy trình — nội dung các bước được làm mới.");
      }
      onSelectedWorkflowIdChange(workflowId);
      return;
    }
    if (!contractDbId || workflowId === liveInstance?.workflowId) return;
    setPendingSwitchId(workflowId);
  };

  const confirmSwitch = async () => {
    if (!contractDbId || !pendingSwitchId) return;
    try {
      await attachWf.mutateAsync({
        moduleKey: "contract",
        entityId: contractDbId,
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
    <div className="flex min-h-0 flex-1 flex-col space-y-4">
      <div className="space-y-1.5 max-w-2xl">
        <Label>Quy trình tổng hợp</Label>
        <Select
          value={selectedWorkflowId || undefined}
          onValueChange={handleWorkflowSelect}
          disabled={attachWf.isPending}
        >
          <SelectTrigger>
            <GitBranch className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
            <SelectValue placeholder="Chọn quy trình hợp đồng" />
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
          Tiến độ công việc tự tính theo bước quy trình ({progressHint}% — bước hiện tại trên tổng số bước).
        </p>
      </div>

      {!hasWorkflowSelected ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Chọn quy trình tổng hợp để hiển thị các bước công việc.
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
        <Tabs
          value={formTab}
          onValueChange={setFormTab}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="shrink-0 border-b border-border overflow-x-auto">
            <TabsList className="h-11 w-max min-w-full bg-transparent p-0 gap-1">
              {stepsForTabs.map((step) => (
                <TabsTrigger key={step.id} value={step.id} className={workflowStepTabTriggerClass}>
                  {contractStepTabLabel(step.order, step.name)}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <div className="relative min-h-0 flex-1">
            {stepsForTabs.map((step) => (
              <TabsContent
                key={step.id}
                value={step.id}
                className="absolute inset-0 mt-0 overflow-y-auto py-4 space-y-4 data-[state=inactive]:hidden"
              >
                <DynamicStepFormFields
                  fieldSchema={step.fieldSchema}
                  values={stepPayloads[step.id] ?? {}}
                  onChange={(key, value) => patchStepPayload(step.id, key, value)}
                  stepDescription={step.description}
                  workflowEditHref={workflowEditHref}
                />
                {contractDbId && !isCreateMode ? (
                  <WorkflowInstancePanel
                    moduleKey="contract"
                    entityId={contractDbId}
                    focusStepId={step.id}
                    compact
                  />
                ) : null}
              </TabsContent>
            ))}
          </div>
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
