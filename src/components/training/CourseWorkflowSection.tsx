import { useEffect, useMemo, useRef, useState } from "react";
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
  type WorkflowEntityModuleKey,
} from "@/hooks/use-workflows-api";
import {
  initTrainingStepPayloads,
  trainingStepTabLabel,
  type TrainingStepPayloadRecord,
} from "@/lib/training-step-payload";
import { resolveInitialWorkflowStepTabId } from "@/lib/workflow-step-tab";
import { workflowStepTabTriggerClass } from "@/components/workflow/WorkflowStepSegments";

type WorkflowSnapshot = {
  instanceId?: string | null;
  workflowId?: string | null;
  workflowName?: string | null;
  currentStepIndex?: number;
  totalSteps?: number;
  currentStepId?: string | null;
  steps?: Array<{ id: string }>;
};

type Props = {
  open: boolean;
  courseId: string | null;
  moduleKey: Extract<WorkflowEntityModuleKey, "training" | "coaching">;
  isCreateMode?: boolean;
  readOnly?: boolean;
  detailWorkflow?: WorkflowSnapshot | null;
  detailStepPayloads?: TrainingStepPayloadRecord;
  selectedWorkflowId: string;
  onSelectedWorkflowIdChange: (id: string) => void;
  stepPayloads: TrainingStepPayloadRecord;
  onStepPayloadsChange: (next: TrainingStepPayloadRecord) => void;
  workflowSelectLabel?: string;
  workflowSelectHint?: string;
};

function getApiErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null) {
    const maybe = error as { response?: { data?: { message?: string } }; message?: string };
    if (maybe.response?.data?.message) return maybe.response.data.message;
    if (maybe.message) return maybe.message;
  }
  return fallback;
}

const DEFAULT_WORKFLOW_CODE: Record<"training" | "coaching", string> = {
  training: "WF_TRAINING_DEFAULT",
  coaching: "WF_COACHING_DEFAULT",
};

export function CourseWorkflowSection({
  open,
  courseId,
  moduleKey,
  isCreateMode = false,
  readOnly = false,
  detailWorkflow,
  detailStepPayloads,
  selectedWorkflowId,
  onSelectedWorkflowIdChange,
  stepPayloads,
  onStepPayloadsChange,
  workflowSelectLabel,
  workflowSelectHint,
}: Props) {
  const attachWf = useAttachWorkflow();
  const [formTab, setFormTab] = useState("");
  const [pendingSwitchId, setPendingSwitchId] = useState<string | null>(null);
  const autoAttachAttempted = useRef(false);

  const { data: workflows = [] } = useWorkflowsList(moduleKey, { enabled: open });
  const { data: liveInstance } = useInstanceForEntity(moduleKey, courseId, {
    enabled: Boolean(courseId) && open && !isCreateMode,
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
    ? `/quy-trinh/${moduleKey}/${workflowIdForDetail}`
    : null;

  const stepsForTabs = useMemo(() => {
    if (!workflowDetail?.steps?.length) return [];
    return [...workflowDetail.steps].sort((a, b) => a.order - b.order);
  }, [workflowDetail?.steps]);

  const workflowOptions = useMemo(
    () =>
      workflows.filter(
        (w) =>
          w.isActive ||
          w.id === selectedWorkflowId ||
          w.id === liveInstance?.workflowId ||
          w.id === detailWorkflow?.workflowId,
      ),
    [workflows, selectedWorkflowId, liveInstance?.workflowId, detailWorkflow?.workflowId],
  );

  const hasWorkflowSelected = Boolean(workflowIdForDetail);
  const workflowReady = hasWorkflowSelected && !workflowDetailLoading && Boolean(workflowDetail);
  const showDynamicTabs = workflowReady && stepsForTabs.length > 0;

  useEffect(() => {
    if (!open || !isCreateMode || selectedWorkflowId) return;
    const defCode = DEFAULT_WORKFLOW_CODE[moduleKey];
    const def =
      workflows.find((w) => w.code === defCode) ?? workflows.find((w) => w.isActive);
    if (def) onSelectedWorkflowIdChange(def.id);
  }, [open, isCreateMode, workflows, selectedWorkflowId, moduleKey, onSelectedWorkflowIdChange]);

  useEffect(() => {
    if (!open || !stepsForTabs.length) return;
    if (detailStepPayloads && Object.keys(detailStepPayloads).length > 0) {
      onStepPayloadsChange(initTrainingStepPayloads(stepsForTabs, detailStepPayloads));
    } else if (isCreateMode && selectedWorkflowId) {
      onStepPayloadsChange(initTrainingStepPayloads(stepsForTabs));
    }
  }, [open, detailStepPayloads, stepsForTabs, isCreateMode, selectedWorkflowId, onStepPayloadsChange]);

  useEffect(() => {
    if (!open || !stepsForTabs.length) return;
    const tabId = resolveInitialWorkflowStepTabId(stepsForTabs, {
      liveCurrentStepId: liveInstance?.currentStepId,
      snapshot: detailWorkflow?.currentStepIndex
        ? {
            currentStepIndex: detailWorkflow.currentStepIndex,
            steps: detailWorkflow.steps ?? stepsForTabs.map((s) => ({ id: s.id })),
          }
        : null,
    });
    if (tabId) setFormTab(tabId);
  }, [open, stepsForTabs, liveInstance?.currentStepId, detailWorkflow]);

  useEffect(() => {
    if (!open) autoAttachAttempted.current = false;
  }, [open, courseId]);

  useEffect(() => {
    if (
      !open ||
      isCreateMode ||
      readOnly ||
      !courseId ||
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
        moduleKey,
        entityId: courseId,
        workflowId: selectedWorkflowId,
      })
      .catch(() => {
        autoAttachAttempted.current = false;
      });
  }, [
    open,
    isCreateMode,
    readOnly,
    courseId,
    selectedWorkflowId,
    liveInstance,
    attachWf,
    detailWorkflow?.instanceId,
    moduleKey,
  ]);

  const handleWorkflowSelect = (workflowId: string) => {
    if (readOnly) return;
    if (isCreateMode) {
      if (workflowId !== selectedWorkflowId) {
        onStepPayloadsChange({});
        toast.message("Đã đổi quy trình — nội dung các bước được làm mới.");
      }
      onSelectedWorkflowIdChange(workflowId);
      return;
    }
    if (!courseId) return;
    if (workflowId === liveInstance?.workflowId) {
      onSelectedWorkflowIdChange(workflowId);
      return;
    }
    if (!liveInstance) {
      void (async () => {
        try {
          await attachWf.mutateAsync({
            moduleKey,
            entityId: courseId,
            workflowId,
          });
          onSelectedWorkflowIdChange(workflowId);
          toast.success("Đã áp dụng quy trình");
        } catch (e) {
          toast.error(getApiErrorMessage(e, "Không áp dụng được quy trình"));
        }
      })();
      return;
    }
    setPendingSwitchId(workflowId);
  };

  const confirmSwitch = async () => {
    if (!courseId || !pendingSwitchId) return;
    try {
      await attachWf.mutateAsync({
        moduleKey,
        entityId: courseId,
        workflowId: pendingSwitchId,
      });
      toast.success("Đã áp dụng quy trình mới");
      setPendingSwitchId(null);
      onSelectedWorkflowIdChange(pendingSwitchId);
      onStepPayloadsChange({});
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

  const selectLabel =
    workflowSelectLabel ??
    (moduleKey === "coaching" ? "Quy trình huấn luyện" : "Quy trình đào tạo");

  return (
    <div className="flex min-h-0 flex-col space-y-4">
      {!readOnly ? (
        <div className="space-y-1.5 max-w-2xl">
          <Label>{selectLabel}</Label>
          <Select
            value={selectedWorkflowId || undefined}
            onValueChange={handleWorkflowSelect}
            disabled={attachWf.isPending}
          >
            <SelectTrigger>
              <GitBranch className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
              <SelectValue placeholder={`Chọn ${selectLabel.toLowerCase()}`} />
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
          {workflowSelectHint ? (
            <p className="text-xs text-muted-foreground">{workflowSelectHint}</p>
          ) : null}
        </div>
      ) : null}

      {!hasWorkflowSelected ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          {readOnly ? "Chưa gắn quy trình." : "Chọn quy trình để hiển thị các bước."}
        </div>
      ) : workflowDetailLoading ? (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-12">
          <Loader2 className="h-5 w-5 animate-spin" />
          Đang tải các bước từ quy trình…
        </div>
      ) : !showDynamicTabs ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Quy trình chưa có bước hoặc chưa cấu hình trường bước.
        </div>
      ) : (
        <Tabs
          value={formTab}
          onValueChange={setFormTab}
          className="flex min-h-0 flex-col overflow-hidden"
        >
          <div className="shrink-0 border-b border-border overflow-x-auto">
            <TabsList className="h-11 w-max min-w-full bg-transparent p-0 gap-1">
              {stepsForTabs.map((step) => (
                <TabsTrigger key={step.id} value={step.id} className={workflowStepTabTriggerClass}>
                  {trainingStepTabLabel(step.order, step.name)}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <div className="relative min-h-[12rem]">
            {stepsForTabs.map((step) => (
              <TabsContent
                key={step.id}
                value={step.id}
                className="mt-0 space-y-4 data-[state=inactive]:hidden"
              >
                <DynamicStepFormFields
                  fieldSchema={step.fieldSchema}
                  values={stepPayloads[step.id] ?? {}}
                  onChange={(key, value) => patchStepPayload(step.id, key, value)}
                  stepDescription={step.description}
                  workflowEditHref={workflowEditHref}
                  readOnly={readOnly}
                />
                {courseId && !isCreateMode ? (
                  <WorkflowInstancePanel
                    moduleKey={moduleKey}
                    entityId={courseId}
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
              Tiến trình hiện tại sẽ đóng và tạo lại từ bước đầu. Dữ liệu các bước có thể cần nhập lại.
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
