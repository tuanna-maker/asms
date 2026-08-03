import { useEffect, useMemo, useState } from "react";
import { FileText, GitBranch, Loader2, Package, Save, Truck } from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
  useUpdateHandover,
  type HandoverListItem,
} from "@/hooks/use-handovers-api";
import {
  initHandoverStepPayloads,
  stepTabLabel,
  type HandoverStepPayloadRecord,
} from "@/lib/handover-step-payload";
import { resolveInitialWorkflowStepTabId } from "@/lib/workflow-step-tab";
import { workflowStepTabTriggerClass } from "@/components/workflow/WorkflowStepSegments";
import { cn } from "@/lib/utils";

type ContractOption = { id: string; code: string; title: string | null; products?: number };

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  contracts: ContractOption[];
  editing: HandoverListItem | null;
};

function toDateInput(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function SummaryFieldCard({
  icon,
  label,
  required,
  children,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-3 rounded-lg bg-muted/50 p-3", className)}>
      <div className="text-primary mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="text-xs text-muted-foreground">
          {label}
          {required ? <span className="text-destructive"> *</span> : null}
        </p>
        {children}
      </div>
    </div>
  );
}

type MainTab = "info" | "steps";

export function HandoverUpsertDialog({ open, onOpenChange, contracts, editing }: Props) {
  const isCreateMode = !editing;
  const createH = useCreateHandover();
  const updateH = useUpdateHandover();
  const attachWf = useAttachWorkflow();

  const { data: detail, isFetching: detailFetching } = useHandoverDetail(editing?.id ?? null, {
    enabled: open && !!editing,
  });
  const { data: liveInstance } = useInstanceForEntity("handover", editing?.id ?? null, {
    enabled: Boolean(editing?.id) && open,
  });
  const { data: handoverWorkflows = [] } = useWorkflowsList("handover", { enabled: open });

  const [mainTab, setMainTab] = useState<MainTab>("info");
  const [contractId, setContractId] = useState("");
  const [status, setStatus] = useState<"pending" | "active" | "completed" | "late">("pending");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedWorkflowId, setSelectedWorkflowId] = useState("");
  const [formTab, setFormTab] = useState("");
  const [pendingSwitchId, setPendingSwitchId] = useState<string | null>(null);
  const [stepPayloads, setStepPayloads] = useState<HandoverStepPayloadRecord>({});

  const workflowIdForDetail =
    selectedWorkflowId || liveInstance?.workflowId || editing?.workflow?.workflowId || null;

  const { data: workflowDetail, isFetching: workflowDetailLoading } = useWorkflowDetail(
    workflowIdForDetail,
    { enabled: open && !!workflowIdForDetail },
  );

  const workflowEditHref = workflowIdForDetail
    ? `/quy-trinh/handover/${workflowIdForDetail}`
    : null;

  const stepsForTabs = useMemo(() => {
    if (!workflowDetail?.steps?.length) return [];
    return [...workflowDetail.steps].sort((a, b) => a.order - b.order);
  }, [workflowDetail?.steps]);

  const hasWorkflowSelected = Boolean(workflowIdForDetail);
  const workflowReady = hasWorkflowSelected && !workflowDetailLoading && Boolean(workflowDetail);
  const showDynamicTabs = workflowReady && stepsForTabs.length > 0;

  const selectedContract = contracts.find((c) => c.id === contractId);
  const productCount = selectedContract?.products ?? editing?.products ?? 0;

  const workflowOptions = useMemo(
    () =>
      handoverWorkflows.filter(
        (w) =>
          w.isActive ||
          w.id === selectedWorkflowId ||
          w.id === liveInstance?.workflowId,
      ),
    [handoverWorkflows, selectedWorkflowId, liveInstance?.workflowId],
  );

  useEffect(() => {
    if (!open) return;
    setMainTab("info");
    if (editing) {
      setContractId(editing.contractId);
      setStatus(editing.status);
      setStartDate(toDateInput(editing.startDate));
      setDueDate(toDateInput(editing.dueDate));
      setSelectedWorkflowId(liveInstance?.workflowId ?? editing.workflow?.workflowId ?? "");
    } else {
      const d = new Date();
      setContractId(contracts[0]?.id ?? "");
      setStatus("pending");
      setStartDate(d.toISOString().slice(0, 10));
      setDueDate(d.toISOString().slice(0, 10));
      setSelectedWorkflowId("");
      setStepPayloads({});
    }
  }, [open, editing, contracts, liveInstance?.workflowId]);

  useEffect(() => {
    if (!open || !stepsForTabs.length) return;
    if (detail?.stepPayloads) {
      setStepPayloads(initHandoverStepPayloads(stepsForTabs, detail.stepPayloads));
    } else if (isCreateMode && selectedWorkflowId) {
      setStepPayloads(initHandoverStepPayloads(stepsForTabs));
    }
  }, [open, detail, stepsForTabs, isCreateMode, selectedWorkflowId]);

  useEffect(() => {
    if (!open || !stepsForTabs.length) return;
    const tabId = resolveInitialWorkflowStepTabId(stepsForTabs, {
      liveCurrentStepId: liveInstance?.currentStepId,
      snapshot: editing?.workflow ?? null,
    });
    if (tabId) setFormTab(tabId);
  }, [open, stepsForTabs, liveInstance?.currentStepId, editing?.workflow]);

  const handleWorkflowSelect = (workflowId: string) => {
    if (isCreateMode) {
      if (workflowId !== selectedWorkflowId) {
        setStepPayloads({});
        toast.message("Đã đổi quy trình — nội dung các bước được làm mới.");
      }
      setSelectedWorkflowId(workflowId);
      return;
    }
    if (!editing || workflowId === liveInstance?.workflowId) return;
    setPendingSwitchId(workflowId);
  };

  const confirmSwitch = async () => {
    if (!editing || !pendingSwitchId) return;
    try {
      await attachWf.mutateAsync({
        moduleKey: "handover",
        entityId: editing.id,
        workflowId: pendingSwitchId,
      });
      toast.success("Đã áp dụng quy trình mới");
      setPendingSwitchId(null);
      setSelectedWorkflowId(pendingSwitchId);
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
      toast.error("Chọn hợp đồng");
      return;
    }
    if (isCreateMode && !selectedWorkflowId) {
      toast.error("Chọn quy trình bàn giao áp dụng");
      return;
    }
    const start = startDate ? new Date(`${startDate}T12:00:00`).toISOString() : undefined;
    const due = dueDate ? new Date(`${dueDate}T12:00:00`).toISOString() : undefined;
    const payloadsToSend =
      stepsForTabs.length > 0 && Object.keys(stepPayloads).length > 0 ? stepPayloads : undefined;

    try {
      if (editing) {
        await updateH.mutateAsync({
          id: editing.id,
          payload: {
            contractId,
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
      onOpenChange(false);
    } catch (e) {
      toast.error(getApiErrorMessage(e, editing ? "Không cập nhật được" : "Không tạo được"));
    }
  };

  const submitting = createH.isPending || updateH.isPending;
  const title = editing ? `Chỉnh sửa bàn giao ${editing.code}` : "Thêm bàn giao mới";

  return (
  <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[75vw] xl:max-w-[1140px] p-0 flex flex-col gap-0 overflow-hidden"
      >
        <SheetHeader className="flex h-16 flex-row items-center justify-between border-b border-border/50 px-6 pr-14 space-y-0 shrink-0 gap-3">
          <SheetTitle className="flex items-center gap-2 text-left leading-6 m-0 min-w-0">
            <Truck className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
            <span className="truncate leading-6">{title}</span>
          </SheetTitle>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={submitting}>
              Hủy
            </Button>
            <Button
              type="button"
              onClick={() => void submit()}
              disabled={submitting || (isCreateMode && (!contractId || contracts.length === 0))}
            >
              <Save className="mr-1.5 h-4 w-4" />
              {submitting ? "Đang lưu…" : "Lưu"}
            </Button>
          </div>
        </SheetHeader>

        <Tabs
          value={mainTab}
          onValueChange={(v) => setMainTab(v as MainTab)}
          className="min-h-0 flex-1 flex flex-col overflow-hidden"
        >
          <div className="shrink-0 border-b border-border/50 px-6 bg-background">
            <TabsList className="h-11 w-full justify-start bg-transparent p-0 gap-1 rounded-none">
              <TabsTrigger
                value="info"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3"
              >
                Thông tin bàn giao
              </TabsTrigger>
              <TabsTrigger
                value="steps"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3"
              >
                Quy trình áp dụng
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <TabsContent value="info" className="mt-0 px-6 py-5 space-y-4 focus-visible:outline-none">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <SummaryFieldCard icon={<FileText className="h-4 w-4" />} label="Hợp đồng" required>
                  <Select
                    value={contractId || undefined}
                    onValueChange={setContractId}
                    disabled={Boolean(editing) || (isCreateMode && contracts.length === 0)}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          isCreateMode && contracts.length === 0
                            ? "Không có HĐ khả dụng"
                            : "Chọn HĐ"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {contracts.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.code} — {c.title || "—"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </SummaryFieldCard>

                <SummaryFieldCard icon={<Package className="h-4 w-4" />} label="Số sản phẩm">
                  <p className="text-sm font-medium">{productCount}</p>
                </SummaryFieldCard>

                <SummaryFieldCard icon={<GitBranch className="h-4 w-4" />} label="Quy trình áp dụng" required>
                  <Select
                    value={selectedWorkflowId || undefined}
                    onValueChange={handleWorkflowSelect}
                    disabled={attachWf.isPending}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={isCreateMode ? "Chọn quy trình bàn giao" : "Chọn quy trình"}
                      />
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
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> Đang tải các bước…
                    </p>
                  ) : null}
                </SummaryFieldCard>

                <SummaryFieldCard icon={<FileText className="h-4 w-4" />} label="Trạng thái">
                  <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
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
                </SummaryFieldCard>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Ngày bắt đầu</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Hạn hoàn thành</Label>
                  <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
              </div>

              {detailFetching && editing ? (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Đang tải nội dung phiếu…
                </p>
              ) : null}
            </TabsContent>

            <TabsContent value="steps" className="mt-0 px-6 py-5 pb-8 space-y-4 focus-visible:outline-none">
              {!hasWorkflowSelected ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                  Chọn quy trình bàn giao ở tab «Thông tin bàn giao» để hiển thị các bước.
                </div>
              ) : workflowDetailLoading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Đang tải các bước từ quy trình…
                </div>
              ) : !showDynamicTabs ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                  Quy trình chưa có bước hoặc chưa cấu hình trường bước.
                </div>
              ) : (
                <Tabs value={formTab} onValueChange={setFormTab} className="w-full">
                  <div className="sticky top-0 z-10 -mx-6 border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/80 overflow-x-auto">
                    <TabsList className="h-11 w-max min-w-full bg-transparent p-0 gap-1">
                      {stepsForTabs.map((step) => (
                        <TabsTrigger key={step.id} value={step.id} className={workflowStepTabTriggerClass}>
                          {stepTabLabel(step.order, step.name)}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>
                  {stepsForTabs.map((step) => (
                    <TabsContent key={step.id} value={step.id} className="mt-0 space-y-4 py-4">
                      <DynamicStepFormFields
                        fieldSchema={step.fieldSchema}
                        values={stepPayloads[step.id] ?? {}}
                        onChange={(key, value) => patchStepPayload(step.id, key, value)}
                        stepDescription={step.description}
                        workflowEditHref={workflowEditHref}
                      />
                      {editing ? (
                        <WorkflowInstancePanel
                          moduleKey="handover"
                          entityId={editing.id}
                          focusStepId={step.id}
                          compact
                        />
                      ) : null}
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>

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
  </>
  );
}
