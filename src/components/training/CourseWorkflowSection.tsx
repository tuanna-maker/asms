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
  moduleKey?: string | null;
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

  const { data: workflows = [], isFetched: workflowsFetched } = useWorkflowsList(moduleKey, {
    enabled: open,
  });
  const { data: liveInstance } = useInstanceForEntity(moduleKey, courseId, {
    enabled: Boolean(courseId) && open && !isCreateMode,
  });

  const workflowOptions = useMemo(
    () =>
      workflows.filter(
        (w) =>
          (w.moduleKey === moduleKey || w.moduleKey === "contract") &&
          (w.isActive ||
            w.id === selectedWorkflowId ||
            w.id === liveInstance?.workflowId ||
            w.id === detailWorkflow?.workflowId),
      ),
    [workflows, selectedWorkflowId, liveInstance?.workflowId, detailWorkflow?.workflowId, moduleKey],
  );

  const allowedIds = useMemo(() => new Set(workflowOptions.map((w) => w.id)), [workflowOptions]);

  /** Chỉ chấp nhận ID khi đã tải list và ID nằm trong nhóm đúng — tránh hiện bước QT training khi dropdown coaching trống. */
  const matchedDetailWorkflowId =
    workflowsFetched &&
    detailWorkflow?.workflowId &&
    (detailWorkflow.moduleKey === moduleKey || detailWorkflow.moduleKey === "contract") &&
    allowedIds.has(detailWorkflow.workflowId)
      ? detailWorkflow.workflowId
      : null;

  const matchedLiveWorkflowId =
    workflowsFetched && liveInstance?.workflowId && allowedIds.has(liveInstance.workflowId)
      ? liveInstance.workflowId
      : null;

  const matchedSelectedWorkflowId =
    workflowsFetched && selectedWorkflowId && allowedIds.has(selectedWorkflowId)
      ? selectedWorkflowId
      : "";

  const workflowIdForDetail =
    matchedSelectedWorkflowId || matchedLiveWorkflowId || matchedDetailWorkflowId || null;

  const { data: workflowDetail, isFetching: workflowDetailLoading } = useWorkflowDetail(
    workflowIdForDetail,
    { enabled: open && !!workflowIdForDetail },
  );

  const workflowModuleOk =
    !workflowDetail ||
    workflowDetail.moduleKey === moduleKey ||
    workflowDetail.moduleKey === "contract";

  const workflowEditHref =
    workflowIdForDetail && workflowModuleOk
      ? `/quy-trinh/${moduleKey}/${workflowIdForDetail}`
      : null;

  const stepsForTabs = useMemo(() => {
    if (!workflowModuleOk || !workflowDetail?.steps?.length) return [];
    return [...workflowDetail.steps].sort((a, b) => a.order - b.order);
  }, [workflowDetail, workflowModuleOk]);

  const hasWorkflowSelected = Boolean(workflowIdForDetail) && workflowModuleOk;
  const workflowReady = hasWorkflowSelected && !workflowDetailLoading && Boolean(workflowDetail);
  const showDynamicTabs = workflowReady && stepsForTabs.length > 0;

  // Xóa ID QT sai nhóm còn sót (vd. training trên khóa coaching) khi đã có danh sách QT.
  useEffect(() => {
    if (!open || !workflowsFetched || !selectedWorkflowId) return;
    if (!allowedIds.has(selectedWorkflowId)) {
      onSelectedWorkflowIdChange("");
    }
  }, [open, workflowsFetched, selectedWorkflowId, allowedIds, onSelectedWorkflowIdChange]);

  // Sau khi xóa ID sai / mở dialog: gắn lại ID từ instance đang chạy (đúng nhóm) để Lưu không bị trống.
  useEffect(() => {
    if (!open || !workflowsFetched || selectedWorkflowId) return;
    if (liveInstance?.workflowId && allowedIds.has(liveInstance.workflowId)) {
      onSelectedWorkflowIdChange(liveInstance.workflowId);
    }
  }, [
    open,
    workflowsFetched,
    selectedWorkflowId,
    liveInstance?.workflowId,
    allowedIds,
    onSelectedWorkflowIdChange,
  ]);

  useEffect(() => {
    if (!open || !isCreateMode || selectedWorkflowId) return;
    const defCode = DEFAULT_WORKFLOW_CODE[moduleKey];
    const def =
      workflowOptions.find((w) => w.code === defCode) ?? workflowOptions.find((w) => w.isActive);
    if (def) onSelectedWorkflowIdChange(def.id);
  }, [open, isCreateMode, workflowOptions, selectedWorkflowId, moduleKey, onSelectedWorkflowIdChange]);

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
      !matchedSelectedWorkflowId ||
      liveInstance ||
      attachWf.isPending ||
      autoAttachAttempted.current ||
      matchedDetailWorkflowId ||
      matchedLiveWorkflowId
    ) {
      return;
    }
    autoAttachAttempted.current = true;
    void attachWf
      .mutateAsync({
        moduleKey,
        entityId: courseId,
        workflowId: matchedSelectedWorkflowId,
      })
      .catch(() => {
        autoAttachAttempted.current = false;
      });
  }, [
    open,
    isCreateMode,
    readOnly,
    courseId,
    matchedSelectedWorkflowId,
    liveInstance,
    attachWf,
    matchedDetailWorkflowId,
    matchedLiveWorkflowId,
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
            value={matchedSelectedWorkflowId || undefined}
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
          ) : workflowsFetched && workflowOptions.length === 0 ? (
            <p className="text-xs text-destructive">
              Chưa có quy trình nhóm «{moduleKey}». Tạo tại mục Quy trình trước khi gắn.
            </p>
          ) : null}
        </div>
      ) : null}

      {!workflowsFetched ? (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-12">
          <Loader2 className="h-5 w-5 animate-spin" />
          Đang tải danh sách quy trình…
        </div>
      ) : !hasWorkflowSelected ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          {readOnly
            ? "Chưa gắn quy trình."
            : workflowOptions.length === 0
              ? `Chưa có quy trình nhóm «${moduleKey}» — tạo tại mục Quy trình rồi chọn lại.`
              : "Chọn quy trình để hiển thị các bước."}
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
          {/* Chiều cao ổn định khi đổi tab — tránh modal co giãn theo số trường từng bước */}
          <div className="relative min-h-[28rem]">
            {stepsForTabs.map((step) => (
              <TabsContent
                key={step.id}
                value={step.id}
                className="mt-0 space-y-4 pt-4 data-[state=inactive]:hidden focus-visible:outline-none"
              >
                {courseId && !isCreateMode && step.requireDocument ? (
                  <WorkflowInstancePanel
                    moduleKey={moduleKey}
                    entityId={courseId}
                    focusStepId={step.id}
                    compact
                  />
                ) : null}
                <DynamicStepFormFields
                  fieldSchema={step.fieldSchema}
                  values={stepPayloads[step.id] ?? {}}
                  onChange={(key, value) => patchStepPayload(step.id, key, value)}
                  stepDescription={step.description}
                  workflowEditHref={workflowEditHref}
                  readOnly={readOnly}
                />
                {courseId && !isCreateMode && !step.requireDocument ? (
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
