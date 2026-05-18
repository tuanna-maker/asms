import { useEffect, useMemo, useState } from "react";
import { FileText, GitBranch, Loader2, Package } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  useCreateHandover,
  useHandoverDetail,
  useHandoversList,
  useUpdateHandover,
} from "@/hooks/use-handovers-api";
import {
  initHandoverStepPayloads,
  stepTabLabel,
  type HandoverStepPayloadRecord,
} from "@/lib/handover-step-payload";
import { resolveInitialWorkflowStepTabId } from "@/lib/workflow-step-tab";

export type LinkedHandoverSummary = {
  id: string;
  code: string;
  status: string;
  workflowId?: string | null;
  workflowName?: string | null;
};

type Props = {
  contractId: string | null;
  productCount?: number;
  linkedHandover?: LinkedHandoverSummary | null;
  readOnly?: boolean;
  onSaved?: () => void;
};

function getApiErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null) {
    const maybe = error as { response?: { data?: { message?: string } }; message?: string };
    if (maybe.response?.data?.message) return maybe.response.data.message;
    if (maybe.message) return maybe.message;
  }
  return fallback;
}

export function ContractHandoverSection({
  contractId,
  productCount = 0,
  linkedHandover,
  readOnly = false,
  onSaved,
}: Props) {
  const handoverId = linkedHandover?.id ?? null;
  const isCreateMode = !handoverId;

  const createH = useCreateHandover();
  const updateH = useUpdateHandover();
  const attachWf = useAttachWorkflow();

  const { data: listByContract = [] } = useHandoversList(contractId ? { contractId } : undefined);
  const resolvedHandoverId = handoverId ?? listByContract[0]?.id ?? null;

  const { data: detail, isFetching: detailFetching } = useHandoverDetail(resolvedHandoverId, {
    enabled: Boolean(resolvedHandoverId),
  });
  const { data: liveInstance } = useInstanceForEntity("handover", resolvedHandoverId, {
    enabled: Boolean(resolvedHandoverId),
  });
  const { data: handoverWorkflows = [] } = useWorkflowsList("handover");

  const [status, setStatus] = useState<"pending" | "active" | "completed" | "late">("pending");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedWorkflowId, setSelectedWorkflowId] = useState("");
  const [formTab, setFormTab] = useState("");
  const [pendingSwitchId, setPendingSwitchId] = useState<string | null>(null);
  const [stepPayloads, setStepPayloads] = useState<HandoverStepPayloadRecord>({});

  const workflowIdForDetail =
    selectedWorkflowId || liveInstance?.workflowId || linkedHandover?.workflowId || null;

  const { data: workflowDetail, isFetching: workflowDetailLoading } = useWorkflowDetail(
    workflowIdForDetail,
    { enabled: Boolean(workflowIdForDetail) },
  );

  const workflowEditHref = workflowIdForDetail
    ? `/quy-trinh/handover/${workflowIdForDetail}`
    : null;

  const stepsForTabs = useMemo(() => {
    if (!workflowDetail?.steps?.length) return [];
    return [...workflowDetail.steps].sort((a, b) => a.order - b.order);
  }, [workflowDetail?.steps]);

  const workflowOptions = useMemo(
    () =>
      handoverWorkflows.filter(
        (w) => w.isActive || w.id === selectedWorkflowId || w.id === liveInstance?.workflowId,
      ),
    [handoverWorkflows, selectedWorkflowId, liveInstance?.workflowId],
  );

  useEffect(() => {
    if (!resolvedHandoverId && contractId) {
      const d = new Date();
      setStartDate(d.toISOString().slice(0, 10));
      setDueDate(d.toISOString().slice(0, 10));
      setStatus("pending");
      setSelectedWorkflowId("");
      setStepPayloads({});
      return;
    }
    if (detail) {
      setStatus(detail.status);
      setStartDate(detail.startDate?.slice(0, 10) ?? "");
      setDueDate(detail.dueDate?.slice(0, 10) ?? "");
      setSelectedWorkflowId(liveInstance?.workflowId ?? linkedHandover?.workflowId ?? "");
    }
  }, [resolvedHandoverId, contractId, detail, liveInstance?.workflowId, linkedHandover?.workflowId]);

  useEffect(() => {
    if (!stepsForTabs.length) return;
    if (detail?.stepPayloads) {
      setStepPayloads(initHandoverStepPayloads(stepsForTabs, detail.stepPayloads));
    } else if (isCreateMode && selectedWorkflowId) {
      setStepPayloads(initHandoverStepPayloads(stepsForTabs));
    }
    const listRow = listByContract.find((h) => h.id === resolvedHandoverId);
    const tabId = resolveInitialWorkflowStepTabId(stepsForTabs, {
      liveCurrentStepId: liveInstance?.currentStepId,
      snapshot: listRow?.workflow ?? null,
    });
    if (tabId) setFormTab(tabId);
  }, [detail, stepsForTabs, isCreateMode, selectedWorkflowId, listByContract, resolvedHandoverId, liveInstance?.currentStepId]);

  const handleWorkflowSelect = (workflowId: string) => {
    if (isCreateMode) {
      if (workflowId !== selectedWorkflowId) {
        setStepPayloads({});
        toast.message("Đã đổi quy trình — nội dung các bước được làm mới.");
      }
      setSelectedWorkflowId(workflowId);
      return;
    }
    if (workflowId === liveInstance?.workflowId) {
      setSelectedWorkflowId(workflowId);
      return;
    }
    setPendingSwitchId(workflowId);
  };

  const confirmSwitch = async () => {
    if (!resolvedHandoverId || !pendingSwitchId) return;
    try {
      await attachWf.mutateAsync({
        moduleKey: "handover",
        entityId: resolvedHandoverId,
        workflowId: pendingSwitchId,
      });
      toast.success("Đã áp dụng quy trình mới");
      setPendingSwitchId(null);
      setSelectedWorkflowId(pendingSwitchId);
      onSaved?.();
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Không áp dụng được quy trình"));
    }
  };

  const patchStepPayload = (stepId: string, key: string, value: unknown) => {
    setStepPayloads((prev) => ({
      ...prev,
      [stepId]: { ...(prev[stepId] ?? {}), [key]: value },
    }));
  };

  const submit = async () => {
    if (!contractId) {
      toast.error("Lưu hợp đồng trước khi tạo bàn giao");
      return;
    }
    if (isCreateMode && !selectedWorkflowId) {
      toast.error("Chọn quy trình bàn giao");
      return;
    }
    const start = startDate ? new Date(`${startDate}T12:00:00`).toISOString() : undefined;
    const due = dueDate ? new Date(`${dueDate}T12:00:00`).toISOString() : undefined;
    const payloadsToSend =
      stepsForTabs.length > 0 && Object.keys(stepPayloads).length > 0 ? stepPayloads : undefined;

    try {
      if (resolvedHandoverId) {
        await updateH.mutateAsync({
          id: resolvedHandoverId,
          payload: {
            status,
            startDate: start,
            dueDate: due,
            ...(payloadsToSend ? { stepPayloads: payloadsToSend } : {}),
            ...(status === "completed" ? { completedAt: new Date().toISOString() } : {}),
          },
        });
        toast.success("Đã cập nhật bàn giao");
      } else {
        await createH.mutateAsync({
          contractId,
          status,
          startDate: start,
          dueDate: due,
          workflowId: selectedWorkflowId,
          ...(payloadsToSend ? { stepPayloads: payloadsToSend } : {}),
        });
        toast.success("Đã tạo bàn giao");
      }
      onSaved?.();
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Không lưu được bàn giao"));
    }
  };

  if (!contractId) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        Lưu hợp đồng trước, sau đó tạo phiếu bàn giao tại tab này.
      </p>
    );
  }

  if (readOnly && linkedHandover) {
    return (
      <div className="space-y-3 rounded-lg border border-border/50 bg-muted/20 p-4">
        <p className="text-sm">
          <span className="font-medium">{linkedHandover.code}</span>
          {" · "}
          {linkedHandover.status}
          {linkedHandover.workflowName ? ` · ${linkedHandover.workflowName}` : ""}
        </p>
      </div>
    );
  }

  const submitting = createH.isPending || updateH.isPending;
  const showDynamicTabs =
    Boolean(workflowIdForDetail) && !workflowDetailLoading && stepsForTabs.length > 0;

  return (
    <div className="space-y-4">
      {resolvedHandoverId ? (
        <p className="text-xs text-muted-foreground">
          Phiếu bàn giao: <span className="font-mono">{detail?.code ?? linkedHandover?.code}</span>
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
          <Package className="h-4 w-4 text-primary mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground">Số sản phẩm HĐ</p>
            <p className="text-sm font-medium">{productCount}</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
          <GitBranch className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="text-xs text-muted-foreground">Quy trình bàn giao</p>
            <Select
              value={selectedWorkflowId || undefined}
              onValueChange={handleWorkflowSelect}
              disabled={readOnly || attachWf.isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder={isCreateMode ? "Chọn quy trình" : "Quy trình áp dụng"} />
              </SelectTrigger>
              <SelectContent>
                {workflowOptions.map((wf) => (
                  <SelectItem key={wf.id} value={wf.id}>
                    {wf.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3 sm:col-span-2">
          <FileText className="h-4 w-4 text-primary mt-0.5" />
          <div className="flex-1 space-y-1.5">
            <p className="text-xs text-muted-foreground">Trạng thái</p>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as typeof status)}
              disabled={readOnly}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Chưa bắt đầu</SelectItem>
                <SelectItem value="active">Đang thực hiện</SelectItem>
                <SelectItem value="late">Chậm tiến độ</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Ngày bắt đầu</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} readOnly={readOnly} />
        </div>
        <div className="space-y-1.5">
          <Label>Hạn hoàn thành</Label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} readOnly={readOnly} />
        </div>
      </div>

      {detailFetching && resolvedHandoverId ? (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
        </p>
      ) : null}

      {!workflowIdForDetail ? (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Chọn quy trình bàn giao để nhập nội dung từng bước.
        </div>
      ) : workflowDetailLoading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Đang tải các bước…
        </div>
      ) : !showDynamicTabs ? (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Quy trình chưa có bước hoặc chưa cấu hình trường.
        </div>
      ) : (
        <Tabs value={formTab} onValueChange={setFormTab}>
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
            {stepsForTabs.map((step) => (
              <TabsTrigger key={step.id} value={step.id} className="text-xs">
                {stepTabLabel(step.order, step.name)}
              </TabsTrigger>
            ))}
          </TabsList>
          {stepsForTabs.map((step) => (
            <TabsContent key={step.id} value={step.id} className="mt-3 space-y-3">
              <DynamicStepFormFields
                fieldSchema={step.fieldSchema}
                values={stepPayloads[step.id] ?? {}}
                onChange={(key, value) => patchStepPayload(step.id, key, value)}
                stepDescription={step.description}
                workflowEditHref={workflowEditHref}
              />
              {resolvedHandoverId ? (
                <WorkflowInstancePanel
                  moduleKey="handover"
                  entityId={resolvedHandoverId}
                  focusStepId={step.id}
                  compact
                />
              ) : null}
            </TabsContent>
          ))}
        </Tabs>
      )}

      {!readOnly ? (
        <div className="flex justify-end">
          <Button type="button" onClick={() => void submit()} disabled={submitting}>
            {submitting ? "Đang lưu…" : resolvedHandoverId ? "Lưu bàn giao" : "Tạo bàn giao"}
          </Button>
        </div>
      ) : null}

      <AlertDialog open={Boolean(pendingSwitchId)} onOpenChange={(o) => !o && setPendingSwitchId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Áp dụng quy trình khác?</AlertDialogTitle>
            <AlertDialogDescription>
              Tiến trình hiện tại sẽ đóng và tạo lại từ bước đầu. Bạn có chắc?
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
