import { useEffect, useMemo, useRef, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { Shield, Monitor, User, Clock, CheckCircle, Trash2, FileText, ExternalLink, Loader2, Package, GitBranch } from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api-errors";
import { useContractDetail, useContractsList, useContractProducts } from "@/hooks/use-contracts-api";
import { useProductDetail } from "@/hooks/use-products-api";
import { useCreateWarranty, useDeleteWarranty, useUpdateWarranty, useWarrantyDetail } from "@/hooks/use-warranties-api";
import { useDefinitionOptions } from "@/hooks/use-definition-options";
import {
  useAttachWorkflow,
  useInstanceForEntity,
  useWorkflowDetail,
  useWorkflowsList,
  type WorkflowInstanceListSnapshot,
} from "@/hooks/use-workflows-api";
import { WorkflowInstancePanel } from "@/components/workflow/WorkflowInstancePanel";
import { DynamicStepFormFields } from "@/components/workflow/DynamicStepFormFields";
import {
  applyWarrantyPayloadsToFormState,
  buildBhPayloadFromStepHeader,
  buildStepPayloadsFromForm,
  initWarrantyStepPayloads,
  mergeWarrantyFormIntoStepPayloads,
  pickWarrantyHeaderFromStepPayloads,
  resolveWarrantyIssueText,
  stepTabLabel,
  type WarrantyFormSnapshot,
  type WarrantyStepPayloadRecord,
} from "@/lib/warranty-step-payload";
import { cn } from "@/lib/utils";
import { CustomerFeedbackSection } from "@/components/feedback/CustomerFeedbackSection";

const NONE = "__none__";

export type WarrantyTicketUi = {
  apiId: string;
  code: string;
  customer: string;
  device: string;
  issue: string;
  source: string;
  type: string;
  priority: string;
  step: number;
  /** Lọc tab Danh sách (open/processing → processing) */
  tabStatus: "processing" | "completed";
  backendStatus: "open" | "processing" | "completed" | "cancelled";
  assignee: string;
  createdAt: string;
  /** Snapshot tiến độ từ API danh sách (khi có workflowInstanceId) */
  workflow?: WorkflowInstanceListSnapshot | null;
};

interface Props {
  ticket: WarrantyTicketUi | null;
  customerOptions?: Array<{ id: string; code: string; name: string }>;
  mode?: "view" | "edit" | "create";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const priorityMap: Record<string, { label: string; className: string }> = {
  urgent: { label: "Khẩn cấp", className: "bg-destructive/15 text-destructive border-destructive/30" },
  high: { label: "Cao", className: "bg-destructive/10 text-destructive border-destructive/20" },
  medium: { label: "Trung bình", className: "bg-warning/10 text-warning border-warning/20" },
  low: { label: "Thấp", className: "bg-success/10 text-success border-success/20" },
};

const typeMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  warranty: { label: "Bảo hành", variant: "default" },
  repair: { label: "Sửa chữa", variant: "secondary" },
  maintenance: { label: "Bảo trì", variant: "outline" },
};

const NO_PRODUCT = "__none__";
const NO_CONTRACT = "__none__";

function formatContractSummary(c: unknown): string {
  if (!c || typeof c !== "object") return "—";
  const o = c as { code?: string; title?: string };
  const line = [o.code, o.title].filter(Boolean).join(" · ");
  return line || "—";
}


function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function decimalToInput(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "object" && v !== null && "toString" in v) return String((v as { toString: () => string }).toString());
  return String(v);
}

function parseWarrantySourceLabel(raw: string | null | undefined): "customer" | "internal" {
  const s = (raw ?? "").toLowerCase();
  if (s.includes("nội bộ") || s.includes("noi bo") || s.includes("internal")) return "internal";
  return "customer";
}

function SummaryFieldCard({
  icon,
  label,
  children,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-3 rounded-lg bg-muted/50 p-3", className)}>
      <div className="text-primary mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="text-xs text-muted-foreground">{label}</p>
        {children}
      </div>
    </div>
  );
}

const WarrantyDetailDialog = ({
  ticket,
  customerOptions = [],
  mode = "edit",
  open,
  onOpenChange,
}: Props) => {
  const isViewMode = mode === "view";
  const isCreateMode = mode === "create";
  const updateW = useUpdateWarranty();
  const createW = useCreateWarranty();
  const deleteW = useDeleteWarranty();
  const priorityOptions = useDefinitionOptions("warranty_priority");
  const statusOptions = useDefinitionOptions("warranty_status");

  const { data: detail, isFetching: detailFetching } = useWarrantyDetail(ticket?.apiId ?? null, open && !isCreateMode && !!ticket);
  const { data: liveInstance, isFetching: liveInstanceFetching } = useInstanceForEntity("warranty", ticket?.apiId ?? null, {
    enabled: Boolean(open && ticket?.apiId && !isCreateMode),
  });
  const hasEngineSteps = Boolean(liveInstance?.workflow.steps.length);

  const [issue, setIssue] = useState("");
  const [priority, setPriority] = useState<WarrantyTicketUi["priority"]>("medium");
  const [type, setType] = useState<string>("maintenance");
  const [workflowStep, setWorkflowStep] = useState(1);
  const [status, setStatus] = useState<WarrantyTicketUi["backendStatus"]>("open");
  const [customerId, setCustomerId] = useState("");
  const [contractId, setContractId] = useState(NO_CONTRACT);
  const [productId, setProductId] = useState(NO_PRODUCT);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
  const [source, setSource] = useState<"customer" | "internal">("customer");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [warrantyFormTab, setWarrantyFormTab] = useState("1");
  const [genericNotesByStepId, setGenericNotesByStepId] = useState<Record<string, string>>({});
  const [stepPayloads, setStepPayloads] = useState<WarrantyStepPayloadRecord>({});
  const stepPayloadsRef = useRef(stepPayloads);
  const issueRef = useRef("");
  const stepPayloadsInitKeyRef = useRef<string | null>(null);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState("");

  const { data: warrantyWorkflows = [] } = useWorkflowsList("warranty", { enabled: open });
  const attachWf = useAttachWorkflow();
  const [pendingSwitchWorkflowId, setPendingSwitchWorkflowId] = useState<string | null>(null);
  const { data: contractDetail } = useContractDetail(
    isCreateMode && contractId !== NO_CONTRACT ? contractId : null,
  );
  const workflowIdForDetail =
    selectedWorkflowId ||
    liveInstance?.workflowId ||
    (typeof contractDetail?.workflowId === "string" ? contractDetail.workflowId : null) ||
    null;
  const { data: workflowDetail, isFetching: workflowPreviewLoading } = useWorkflowDetail(
    workflowIdForDetail,
    { enabled: open && !!workflowIdForDetail },
  );

  const stepsForTabs = useMemo(() => {
    if (!workflowDetail?.steps?.length) return [];
    return [...workflowDetail.steps].sort((a, b) => a.order - b.order);
  }, [workflowDetail?.steps]);

  const workflowStepsOrdered = stepsForTabs;
  const showDynamicTabs = isCreateMode
    ? Boolean(selectedWorkflowId && stepsForTabs.length > 0)
    : hasEngineSteps && stepsForTabs.length > 0;

  const workflowOptions = useMemo(
    () =>
      warrantyWorkflows.filter(
        (w) => w.isActive || w.id === selectedWorkflowId || w.id === liveInstance?.workflowId,
      ),
    [warrantyWorkflows, selectedWorkflowId, liveInstance?.workflowId],
  );

  const { data: contractsForCust = [], isFetching: contractsLoading } = useContractsList({
    customerId: customerId || undefined,
  });
  const contractsWithProducts = useMemo(
    () => contractsForCust.filter((c) => (c.products ?? 0) > 0),
    [contractsForCust],
  );
  const { data: contractProductRows = [], isFetching: contractProductsLoading } = useContractProducts(
    contractId !== NO_CONTRACT ? contractId : null,
    Boolean(open && contractId !== NO_CONTRACT && !isViewMode),
  );
  const { data: productDetail, isFetching: productDetailLoading } = useProductDetail(
    productId !== NO_PRODUCT ? productId : null,
    Boolean(open && productId !== NO_PRODUCT && !isViewMode),
  );

  function resetStepFormFields() {
    setReceiptCategory("incident");
    setOccurredAtLocal("");
    setProductSerialSnapshot("");
    setRootCause(NONE);
    setHandlingPlan("");
    setPlannedHours("");
    setCostEstimate("");
    setCustomerDisagreedClose(false);
    setExecutionMode(NONE);
    setOutsourcePartner("");
    setOutsourceBudget("");
    setOutsourceTimeline("");
    setRepairDetails("");
    setPostRepairAssessment("");
    setHandoverNotes("");
    setGenericNotesByStepId({});
    setStepPayloads({});
    stepPayloadsRef.current = {};
    issueRef.current = "";
    stepPayloadsInitKeyRef.current = null;
  }

  function handleWorkflowSelect(workflowId: string) {
    if (workflowId === selectedWorkflowId) return;
    if (isCreateMode) {
      if (selectedWorkflowId && workflowId !== selectedWorkflowId) {
        resetStepFormFields();
        toast.info("Đã đổi quy trình — nội dung các bước chưa lưu đã được xóa.");
      }
      setSelectedWorkflowId(workflowId);
      return;
    }
    if (!ticket) return;
    if (workflowId === (liveInstance?.workflowId ?? selectedWorkflowId)) {
      setSelectedWorkflowId(workflowId);
      return;
    }
    setPendingSwitchWorkflowId(workflowId);
  }

  const confirmSwitchWorkflow = async () => {
    if (!ticket || !pendingSwitchWorkflowId) return;
    try {
      await attachWf.mutateAsync({
        moduleKey: "warranty",
        entityId: ticket.apiId,
        workflowId: pendingSwitchWorkflowId,
      });
      toast.success("Đã áp dụng quy trình mới");
      setSelectedWorkflowId(pendingSwitchWorkflowId);
      resetStepFormFields();
      setPendingSwitchWorkflowId(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không áp dụng được quy trình"));
    }
  };

  stepPayloadsRef.current = stepPayloads;
  issueRef.current = issue;

  const patchStepPayload = (stepId: string, key: string, value: unknown) => {
    if (key === "issue") {
      const text = value == null ? "" : String(value);
      issueRef.current = text;
      setIssue(text);
    }
    setStepPayloads((prev) => {
      const next = {
        ...prev,
        [stepId]: { ...(prev[stepId] ?? {}), [key]: value },
      };
      stepPayloadsRef.current = next;
      return next;
    });
  };

  const [receiptCategory, setReceiptCategory] = useState<string>("incident");
  const [occurredAtLocal, setOccurredAtLocal] = useState("");
  const [productSerialSnapshot, setProductSerialSnapshot] = useState("");
  const [rootCause, setRootCause] = useState<string>(NONE);
  const [handlingPlan, setHandlingPlan] = useState("");
  const [plannedHours, setPlannedHours] = useState("");
  const [costEstimate, setCostEstimate] = useState("");
  const [customerDisagreedClose, setCustomerDisagreedClose] = useState(false);
  const [executionMode, setExecutionMode] = useState<string>(NONE);
  const [outsourcePartner, setOutsourcePartner] = useState("");
  const [outsourceBudget, setOutsourceBudget] = useState("");
  const [outsourceTimeline, setOutsourceTimeline] = useState("");
  const [repairDetails, setRepairDetails] = useState("");
  const [postRepairAssessment, setPostRepairAssessment] = useState("");
  const [handoverNotes, setHandoverNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    if (isCreateMode) {
      setIssue("");
      setPriority("medium");
      setType("warranty");
      setWorkflowStep(1);
      setStatus("open");
      setCustomerId("");
      setContractId(NO_CONTRACT);
      setProductId(NO_PRODUCT);
      setSelectedMaterialIds([]);
      setSource("customer");
      setConfirmDelete(false);
      setReceiptCategory("incident");
      setOccurredAtLocal("");
      setProductSerialSnapshot("");
      setRootCause(NONE);
      setHandlingPlan("");
      setPlannedHours("");
      setCostEstimate("");
      setCustomerDisagreedClose(false);
      setExecutionMode(NONE);
      setOutsourcePartner("");
      setOutsourceBudget("");
      setOutsourceTimeline("");
      setRepairDetails("");
      setPostRepairAssessment("");
      setHandoverNotes("");
      setGenericNotesByStepId({});
      setSelectedWorkflowId("");
      setWarrantyFormTab("1");
      return;
    }
    if (!ticket) return;
    setIssue(ticket.issue);
    setPriority(ticket.priority);
    setType(ticket.type);
    setWorkflowStep(Math.max(1, ticket.step));
    setStatus(ticket.backendStatus);
    setConfirmDelete(false);
  }, [ticket, open, isCreateMode]);

  useEffect(() => {
    if (!detail || isCreateMode) return;
    setReceiptCategory(detail.receiptCategory ?? "incident");
    setCustomerId(detail.customerId);
    setContractId(detail.contractId ?? NO_CONTRACT);
    setProductId(detail.productId ?? NO_PRODUCT);
    setSelectedMaterialIds(Array.isArray(detail.materialIds) ? [...detail.materialIds] : []);
    setOccurredAtLocal(toDatetimeLocalValue(detail.occurredAt));
    setProductSerialSnapshot(detail.productSerialSnapshot ?? "");
    setRootCause(detail.rootCause ?? NONE);
    setHandlingPlan(detail.handlingPlan ?? "");
    setPlannedHours(detail.plannedHours != null ? String(detail.plannedHours) : "");
    setCostEstimate(decimalToInput(detail.costEstimate));
    setCustomerDisagreedClose(detail.customerDisagreedClose ?? false);
    setExecutionMode(detail.executionMode ?? NONE);
    setOutsourcePartner(detail.outsourcePartner ?? "");
    setOutsourceBudget(decimalToInput(detail.outsourceBudget));
    setOutsourceTimeline(detail.outsourceTimeline ?? "");
    setRepairDetails(detail.repairDetails ?? "");
    setPostRepairAssessment(detail.postRepairAssessment ?? "");
    setHandoverNotes(detail.handoverNotes ?? "");
    setWorkflowStep(Math.max(1, detail.workflowStep ?? 1));
    setIssue(detail.issue);
    setPriority(detail.priorityCode ?? detail.priority);
    setType(detail.type);
    setStatus(detail.statusCode as WarrantyTicketUi["backendStatus"]);
    setSource(parseWarrantySourceLabel(detail.source ?? ticket?.source));
  }, [detail, isCreateMode, ticket?.source]);

  useEffect(() => {
    if (!open) return;
    if (isCreateMode) {
      if (stepsForTabs[0]) setWarrantyFormTab(stepsForTabs[0].id);
      return;
    }
    if (hasEngineSteps && liveInstance?.currentStepId) {
      setWarrantyFormTab(liveInstance.currentStepId);
    } else if (hasEngineSteps && workflowStepsOrdered[0]) {
      setWarrantyFormTab(workflowStepsOrdered[0].id);
    } else {
      setWarrantyFormTab("1");
    }
  }, [open, ticket?.apiId, isCreateMode, hasEngineSteps, liveInstance?.currentStepId, workflowStepsOrdered, stepsForTabs]);

  useEffect(() => {
    if (!isCreateMode || !open || contractId === NO_CONTRACT) return;
    const wfId = contractDetail?.workflowId;
    if (typeof wfId !== "string" || !wfId) return;
    setSelectedWorkflowId((prev) => {
      if (prev === wfId) return prev;
      if (prev) {
        resetStepFormFields();
        toast.info("Đã gợi ý quy trình từ hợp đồng — nội dung các bước đã được xóa.");
      } else {
        toast.info("Đã gợi ý quy trình từ hợp đồng.");
      }
      return wfId;
    });
  }, [contractDetail?.workflowId, contractId, isCreateMode, open]);

  useEffect(() => {
    if (!open) {
      stepPayloadsInitKeyRef.current = null;
      return;
    }
    if (stepsForTabs.length === 0) return;

    const initKey = isCreateMode
      ? `create:${selectedWorkflowId}:${stepsForTabs.map((s) => s.id).join("|")}`
      : `edit:${ticket?.apiId ?? ""}:${stepsForTabs.map((s) => s.id).join("|")}`;

    if (stepPayloadsInitKeyRef.current === initKey) return;
    stepPayloadsInitKeyRef.current = initKey;

    const payloads = detail?.stepPayloads
      ? initWarrantyStepPayloads(stepsForTabs, detail.stepPayloads)
      : isCreateMode && selectedWorkflowId
        ? initWarrantyStepPayloads(stepsForTabs)
        : null;
    if (!payloads) return;

    stepPayloadsRef.current = payloads;
    setStepPayloads(payloads);
    if (showDynamicTabs) {
      applyWarrantyPayloadsToFormState(stepsForTabs, payloads, {
        setIssue: (v) => {
          issueRef.current = v;
          setIssue(v);
        },
        setReceiptCategory,
        setOccurredAtLocal,
        setProductSerialSnapshot,
        setSource,
        setType,
        setPriority,
        setStatus: (v) => setStatus(v as typeof status),
        setRootCause,
        setHandlingPlan,
        setPlannedHours,
        setCostEstimate,
        setCustomerDisagreedClose,
        setExecutionMode,
        setOutsourcePartner,
        setOutsourceBudget,
        setOutsourceTimeline,
        setRepairDetails,
        setPostRepairAssessment,
        setHandoverNotes,
      });
    }
  }, [open, detail?.stepPayloads, stepsForTabs, isCreateMode, selectedWorkflowId, showDynamicTabs, ticket?.apiId]);

  const displayStatus = status === "completed" ? "completed" : status === "cancelled" ? "completed" : "processing";

  const formSnapshot = useMemo(
    (): WarrantyFormSnapshot => ({
      issue,
      source,
      type,
      priority,
      status,
      receiptCategory,
      occurredAtLocal,
      productSerialSnapshot,
      rootCause,
      handlingPlan,
      plannedHours,
      costEstimate,
      customerDisagreedClose,
      executionMode,
      outsourcePartner,
      outsourceBudget,
      outsourceTimeline,
      repairDetails,
      postRepairAssessment,
      handoverNotes,
    }),
    [
      issue,
      source,
      type,
      priority,
      status,
      receiptCategory,
      occurredAtLocal,
      productSerialSnapshot,
      rootCause,
      handlingPlan,
      plannedHours,
      costEstimate,
      customerDisagreedClose,
      executionMode,
      outsourcePartner,
      outsourceBudget,
      outsourceTimeline,
      repairDetails,
      postRepairAssessment,
      handoverNotes,
    ],
  );

  function toggleMaterial(dbId: string) {
    setSelectedMaterialIds((prev) => (prev.includes(dbId) ? prev.filter((x) => x !== dbId) : [...prev, dbId]));
  }

  function buildBhPayload() {
    const ph = plannedHours.trim() === "" ? null : Number.parseInt(plannedHours, 10);
    return {
      receiptCategory: receiptCategory === NONE ? null : (receiptCategory as "incident" | "technical_support"),
      occurredAt: occurredAtLocal ? new Date(occurredAtLocal).toISOString() : null,
      productSerialSnapshot: productSerialSnapshot.trim() || null,
      rootCause: rootCause === NONE ? null : (rootCause as "manufacturer" | "customer" | "unknown"),
      handlingPlan: handlingPlan.trim() || null,
      plannedHours: ph != null && !Number.isNaN(ph) ? ph : null,
      costEstimate: costEstimate.trim() === "" ? null : costEstimate.trim(),
      customerDisagreedClose,
      executionMode: executionMode === NONE ? null : (executionMode as "self" | "outsource"),
      outsourcePartner: outsourcePartner.trim() || null,
      outsourceBudget: outsourceBudget.trim() === "" ? null : outsourceBudget.trim(),
      outsourceTimeline: outsourceTimeline.trim() || null,
      repairDetails: repairDetails.trim() || null,
      postRepairAssessment: postRepairAssessment.trim() || null,
      handoverNotes: handoverNotes.trim() || null,
    };
  }

  const handleSave = async () => {
    const payloadsLive = stepPayloadsRef.current;
    const formAtSave: WarrantyFormSnapshot = { ...formSnapshot, issue: issueRef.current };
    const payloadsMerged =
      showDynamicTabs && stepsForTabs.length > 0
        ? mergeWarrantyFormIntoStepPayloads(stepsForTabs, payloadsLive, formAtSave)
        : payloadsLive;
    stepPayloadsRef.current = payloadsMerged;

    const useDynamicStepPayload =
      showDynamicTabs && stepsForTabs.length > 0 && Object.keys(payloadsMerged).length > 0;
    const headerFromSteps = useDynamicStepPayload
      ? pickWarrantyHeaderFromStepPayloads(stepsForTabs, payloadsMerged)
      : null;
    const issueToSave = resolveWarrantyIssueText(stepsForTabs, payloadsMerged, issueRef.current);

    if (isCreateMode) {
      if (!customerId) {
        toast.error("Vui lòng chọn khách hàng");
        return;
      }
      if (!selectedWorkflowId) {
        toast.error("Vui lòng chọn quy trình áp dụng");
        return;
      }
      if (!issueToSave) {
        toast.error("Vui lòng mô tả sự cố");
        return;
      }
      try {
        await createW.mutateAsync({
          customerId,
          issue: issueToSave,
          type: (headerFromSteps?.type ?? type) as "warranty" | "repair" | "maintenance",
          priorityCode: headerFromSteps?.priorityCode ?? priority,
          source:
            headerFromSteps?.source != null
              ? headerFromSteps.source === "customer"
                ? "Khách hàng"
                : "Nội bộ"
              : source === "customer"
                ? "Khách hàng"
                : "Nội bộ",
          statusCode: headerFromSteps?.statusCode ?? "open",
          workflowId: selectedWorkflowId,
          workflowStep: 1,
          ...(useDynamicStepPayload && headerFromSteps
            ? buildBhPayloadFromStepHeader(headerFromSteps)
            : buildBhPayload()),
          ...(contractId !== NO_CONTRACT ? { contractId } : {}),
          ...(productId !== NO_PRODUCT ? { productId } : {}),
          ...(productId !== NO_PRODUCT && selectedMaterialIds.length > 0 ? { materialIds: selectedMaterialIds } : {}),
          ...(stepsForTabs.length > 0
            ? {
                stepPayloads: useDynamicStepPayload
                  ? payloadsMerged
                  : buildStepPayloadsFromForm(
                      stepsForTabs.map((s) => s.id),
                      formSnapshot,
                      genericNotesByStepId,
                    ),
              }
            : {}),
        });
        toast.success("Đã tạo phiếu");
        onOpenChange(false);
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Không thể tạo phiếu"));
      }
      return;
    }
    if (!ticket) return;
    try {
      await updateW.mutateAsync({
        id: ticket.apiId,
        payload: {
          customerId,
          contractId: contractId === NO_CONTRACT ? null : contractId,
          productId: productId === NO_PRODUCT ? null : productId,
          materialIds: productId === NO_PRODUCT ? [] : selectedMaterialIds,
          issue: issueToSave,
          priorityCode: headerFromSteps?.priorityCode ?? priority,
          type: (headerFromSteps?.type ?? type) as "warranty" | "repair" | "maintenance",
          source:
            headerFromSteps?.source != null
              ? headerFromSteps.source === "customer"
                ? "Khách hàng"
                : "Nội bộ"
              : source === "customer"
                ? "Khách hàng"
                : "Nội bộ",
          ...(!hasEngineSteps ? { workflowStep } : {}),
          statusCode: headerFromSteps?.statusCode ?? status,
          ...(useDynamicStepPayload && headerFromSteps
            ? buildBhPayloadFromStepHeader(headerFromSteps)
            : buildBhPayload()),
          ...(hasEngineSteps && stepsForTabs.length > 0
            ? {
                stepPayloads: useDynamicStepPayload
                  ? payloadsMerged
                  : buildStepPayloadsFromForm(
                      stepsForTabs.map((s) => s.id),
                      formSnapshot,
                      genericNotesByStepId,
                    ),
              }
            : {}),
          ...((detail?.orphanStepPayloads?.length ?? 0) > 0 ? { pruneOrphanStepPayloads: true } : {}),
        },
      });
      toast.success("Đã cập nhật phiếu");
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không lưu được phiếu"));
    }
  };

  const handleDelete = async () => {
    if (!ticket) return;
    try {
      await deleteW.mutateAsync(ticket.apiId);
      toast.success("Đã xóa phiếu");
      setConfirmDelete(false);
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không xóa được phiếu"));
    }
  };

  const appliedWorkflowName =
    liveInstance?.workflow.name ??
    ticket?.workflow?.workflowName ??
    workflowDetail?.name ??
    null;

  if (!ticket && !isCreateMode) return null;

  const pCfg = priorityMap[isCreateMode ? priority : (ticket?.priority ?? "medium")] || priorityMap.low;
  const tCfg = typeMap[isCreateMode ? type : (ticket?.type ?? "maintenance")] || typeMap.maintenance;

  const readOnly = isViewMode;
  const isEditMode = !isViewMode && !isCreateMode;
  const isSummaryEditable = isCreateMode || isEditMode;
  const docs = detail?.documents ?? [];

  const summarySelectTriggerClass = "h-9 w-full text-sm font-medium border-border/60 bg-background";

  const customerSelect = (
    <Select
      value={customerId || undefined}
      onValueChange={(v) => {
        setCustomerId(v);
        setContractId(NO_CONTRACT);
        setProductId(NO_PRODUCT);
        setSelectedMaterialIds([]);
      }}
      disabled={readOnly}
    >
      <SelectTrigger className={isSummaryEditable ? summarySelectTriggerClass : undefined}>
        <SelectValue placeholder="Chọn khách hàng" />
      </SelectTrigger>
      <SelectContent>
        {customerOptions.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const contractSelect = (
    <div className="space-y-1">
      <Select
        value={contractId}
        onValueChange={(v) => {
          setContractId(v);
          setProductId(NO_PRODUCT);
          setSelectedMaterialIds([]);
        }}
        disabled={readOnly || !customerId}
      >
        <SelectTrigger className={isSummaryEditable ? summarySelectTriggerClass : undefined}>
          <SelectValue placeholder={!customerId ? "Chọn khách hàng trước" : "Chọn hợp đồng"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_CONTRACT}>— Không gắn hợp đồng —</SelectItem>
          {contractsWithProducts.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.code} · {c.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isCreateMode && contractsLoading ? (
        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin shrink-0" aria-hidden /> Đang tải hợp đồng…
        </p>
      ) : isCreateMode && customerId && contractsWithProducts.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">Khách hàng chưa có hợp đồng có sản phẩm.</p>
      ) : null}
    </div>
  );

  const productSelect = (
    <div className="space-y-1">
      <Select
        value={productId}
        onValueChange={(v) => {
          setProductId(v);
          setSelectedMaterialIds([]);
        }}
        disabled={readOnly || contractId === NO_CONTRACT}
      >
        <SelectTrigger className={isSummaryEditable ? summarySelectTriggerClass : undefined}>
          <SelectValue placeholder={contractId === NO_CONTRACT ? "Chọn hợp đồng trước" : "Chọn thiết bị"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_PRODUCT}>— Chưa chọn thiết bị —</SelectItem>
          {contractProductRows.map((p) => (
            <SelectItem key={p.productId} value={p.productId}>
              {p.name} ({p.code}) · SL {p.quantity}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isCreateMode && contractProductsLoading && contractId !== NO_CONTRACT ? (
        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin shrink-0" aria-hidden /> Đang tải dòng hợp đồng…
        </p>
      ) : null}
    </div>
  );

  const sourceSelect = (
    <Select
      value={source}
      onValueChange={(v) => setSource(v as "customer" | "internal")}
      disabled={readOnly}
    >
      <SelectTrigger className={isSummaryEditable ? summarySelectTriggerClass : undefined}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="customer">Khách hàng</SelectItem>
        <SelectItem value="internal">Nội bộ</SelectItem>
      </SelectContent>
    </Select>
  );

  const workflowSelect = (
    <Select value={selectedWorkflowId || undefined} onValueChange={handleWorkflowSelect} disabled={readOnly}>
      <SelectTrigger className={summarySelectTriggerClass}>
        <SelectValue placeholder="Chọn quy trình áp dụng" />
      </SelectTrigger>
      <SelectContent>
        {workflowOptions.map((w) => (
          <SelectItem key={w.id} value={w.id}>
            {w.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const materialsPickerBody = (
    <>
      {productId === NO_PRODUCT ? (
        <p className="text-xs text-muted-foreground">Chọn thiết bị để chọn vật tư từ BOM.</p>
      ) : productDetailLoading ? (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin shrink-0" aria-hidden /> Đang tải BOM…
        </p>
      ) : !productDetail?.bom?.length ? (
        <p className="text-xs text-muted-foreground">Sản phẩm chưa có BOM.</p>
      ) : (
        productDetail.bom.map((row) => {
          const dbId = row.materialDbId ?? row.materialId;
          const checked = selectedMaterialIds.includes(dbId);
          return (
            <label key={dbId} className="flex items-start gap-2 text-sm cursor-pointer">
              <Checkbox checked={checked} onCheckedChange={() => toggleMaterial(dbId)} className="mt-0.5" />
              <span>
                <span className="font-medium">{row.materialName}</span>{" "}
                <span className="text-muted-foreground text-xs">
                  {row.materialId} · {row.quantity} {row.unit}
                </span>
              </span>
            </label>
          );
        })
      )}
    </>
  );

  const materialsSummaryEdit = (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(summarySelectTriggerClass, "justify-between font-medium")}
          disabled={productId === NO_PRODUCT}
        >
          <span className="truncate">
            {selectedMaterialIds.length > 0 ? `${selectedMaterialIds.length} mục đã chọn` : "Chọn vật tư BOM"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3 space-y-2" align="start">
        <p className="text-xs font-medium text-muted-foreground">Vật tư BOM</p>
        {materialsPickerBody}
      </PopoverContent>
    </Popover>
  );

  const renderTicketDocuments = () =>
    !isCreateMode && ticket ? (
      <div className="space-y-2 pt-4 border-t border-border/60">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <FileText className="h-4 w-4" /> Tài liệu gắn phiếu
        </h4>
        {docs.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Chưa có tài liệu với warrantyId — có thể thêm từ màn Tài liệu (lọc theo phiếu).
          </p>
        ) : (
          <ul className="space-y-1 text-sm">
            {docs.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-2 rounded border border-border/60 px-2 py-1.5">
                <span className="truncate">{d.name}</span>
                {d.fileUrl ? (
                  <a
                    href={d.fileUrl}
                    className="shrink-0 text-primary inline-flex items-center gap-0.5 text-xs"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Mở <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">{d.categoryCode}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    ) : null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-[75vw] xl:max-w-[1140px] p-0 flex flex-col gap-0 max-h-[100dvh] overflow-hidden">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/60 shrink-0 space-y-2 text-left">
            <SheetTitle className="text-xl flex items-center gap-2 pr-8">
              <Shield className="h-5 w-5 text-primary shrink-0" />
              <span className="truncate">{isCreateMode ? "Tạo phiếu mới" : `Phiếu ${ticket?.code ?? ""}`}</span>
              {!isCreateMode && ticket && detailFetching ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" aria-hidden />
              ) : null}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-6 px-6 py-4 flex-1 min-h-0 overflow-y-auto overscroll-contain">
            {(isCreateMode || ticket) && (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  {isSummaryEditable ? (
                    <>
                      <Select value={type} onValueChange={setType}>
                        <SelectTrigger className="h-8 w-[130px] text-xs font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="warranty">Bảo hành</SelectItem>
                          <SelectItem value="repair">Sửa chữa</SelectItem>
                          <SelectItem value="maintenance">Bảo trì</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={priority} onValueChange={setPriority}>
                        <SelectTrigger className={cn("h-8 w-[130px] text-xs font-medium", pCfg.className)}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {priorityOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isEditMode ? (
                        <Select value={status} onValueChange={(v) => setStatus(v as WarrantyTicketUi["backendStatus"])}>
                          <SelectTrigger className="h-8 w-[140px] text-xs font-medium">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <Badge variant={tCfg.variant}>{tCfg.label}</Badge>
                      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${pCfg.className}`}>
                        {pCfg.label}
                      </span>
                      {displayStatus === "completed" ? (
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle className="h-3 w-3" /> Hoàn thành
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <Clock className="h-3 w-3" /> Đang xử lý
                        </Badge>
                      )}
                    </>
                  )}
                </div>

                {!isCreateMode ? <Separator /> : null}

                {!isCreateMode && hasEngineSteps && liveInstance ? (
                  <p className="text-sm rounded-md bg-muted/30 px-3 py-2">
                    <span className="text-muted-foreground">Luồng xử lý:</span>{" "}
                    <span className="font-medium text-foreground">{liveInstance.workflow.name}</span>
                    <br />
                    <span className="text-muted-foreground">Bước hiện tại:</span>{" "}
                    <span className="font-medium text-foreground">
                      {liveInstance.currentStep
                        ? `${liveInstance.workflow.steps.findIndex((s) => s.id === liveInstance.currentStep!.id) + 1}/${liveInstance.workflow.steps.length} · ${liveInstance.currentStep.name}`
                        : liveInstance.status === "completed"
                          ? `Hoàn tất (${liveInstance.workflow.steps.length} bước)`
                          : "Chưa xác định"}
                    </span>
                  </p>
                ) : !isCreateMode && liveInstanceFetching && !liveInstance ? (
                  <p className="text-sm rounded-md bg-muted/30 px-3 py-2 flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
                    Đang tải tiến trình quy trình…
                  </p>
                ) : !isCreateMode && ticket?.workflow && ticket.workflow.totalSteps > 0 ? (
                  <p className="text-sm rounded-md bg-muted/30 px-3 py-2">
                    <span className="text-muted-foreground">Luồng xử lý:</span>{" "}
                    <span className="font-medium text-foreground">{ticket.workflow.workflowName}</span>
                    <br />
                    <span className="text-muted-foreground">Bước hiện tại:</span>{" "}
                    <span className="font-medium text-foreground">
                      {ticket.workflow.status === "completed"
                        ? `${ticket.workflow.totalSteps}/${ticket.workflow.totalSteps} · Hoàn tất`
                        : `${ticket.workflow.currentStepIndex}/${ticket.workflow.totalSteps} · ${ticket.workflow.currentStepName ?? "—"}`}
                    </span>
                  </p>
                ) : !isCreateMode ? (
                  <p className="text-sm rounded-md bg-muted/30 px-3 py-2 text-muted-foreground">
                    Phiếu chưa được gắn quy trình áp dụng hoặc chưa khởi tạo tiến trình xử lý.
                  </p>
                ) : null}

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {isSummaryEditable ? (
                    <>
                      <SummaryFieldCard icon={<User className="h-4 w-4" />} label="Khách hàng">
                        {customerSelect}
                      </SummaryFieldCard>
                      <SummaryFieldCard icon={<FileText className="h-4 w-4" />} label="Hợp đồng">
                        {contractSelect}
                      </SummaryFieldCard>
                      <SummaryFieldCard icon={<Monitor className="h-4 w-4" />} label="Thiết bị">
                        {productSelect}
                      </SummaryFieldCard>
                      <SummaryFieldCard icon={<Package className="h-4 w-4" />} label="Vật tư (BOM)">
                        {materialsSummaryEdit}
                      </SummaryFieldCard>
                      <SummaryFieldCard icon={<Shield className="h-4 w-4" />} label="Nguồn">
                        {sourceSelect}
                      </SummaryFieldCard>
                      <SummaryFieldCard icon={<GitBranch className="h-4 w-4" />} label="Quy trình áp dụng">
                        {isCreateMode && workflowPreviewLoading && selectedWorkflowId ? (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin shrink-0" aria-hidden />
                            Đang tải quy trình…
                          </p>
                        ) : (
                          workflowSelect
                        )}
                      </SummaryFieldCard>
                    </>
                  ) : (
                    <>
                      <InfoItem icon={<User className="h-4 w-4" />} label="Khách hàng" value={ticket?.customer ?? "—"} />
                      <InfoItem
                        icon={<FileText className="h-4 w-4" />}
                        label="Hợp đồng"
                        value={detail ? formatContractSummary(detail.contract) : "…"}
                      />
                      <InfoItem icon={<Monitor className="h-4 w-4" />} label="Thiết bị" value={ticket?.device ?? "—"} />
                      <InfoItem
                        icon={<Package className="h-4 w-4" />}
                        label="Vật tư (BOM)"
                        value={
                          detail?.materialIds?.length ? `${detail.materialIds.length} mục đã ghi nhận` : "—"
                        }
                      />
                      <InfoItem icon={<Shield className="h-4 w-4" />} label="Nguồn" value={ticket?.source ?? "—"} />
                      <InfoItem
                        icon={<GitBranch className="h-4 w-4" />}
                        label="Quy trình áp dụng"
                        value={appliedWorkflowName ?? "—"}
                      />
                    </>
                  )}
                </div>
              </>
            )}

            {!isCreateMode && customerId && ticket ? (
              <CustomerFeedbackSection
                customerId={customerId}
                contractId={detail?.contractId ?? undefined}
                readonly={readOnly}
              />
            ) : null}

            <div className="rounded-lg border border-border p-3 sm:p-4 space-y-3">
              <h4 className="text-sm font-semibold text-card-foreground">
                {isViewMode ? "Chi tiết phiếu" : "Nội dung phiếu (QT BH/SC)"}
              </h4>
              <p className="text-xs text-muted-foreground">
                Mỗi bước của quy trình áp dụng là một tab; nội dung lưu theo bước. Hành động và tài liệu quy trình nằm trong từng tab bước.
              </p>

              {!isCreateMode && (detail?.orphanStepPayloads?.length ?? 0) > 0 ? (
                <p className="text-xs rounded-md border border-amber-300 bg-amber-50/60 px-2.5 py-2 text-amber-900">
                  Có {detail!.orphanStepPayloads!.length} nhóm nội dung không còn khớp bước quy trình hiện tại (sẽ bị xóa khi lưu).
                </p>
              ) : null}

              {showDynamicTabs ? (
                <Tabs value={warrantyFormTab} onValueChange={setWarrantyFormTab} className="w-full">
                  <TabsList className="w-full h-auto flex flex-nowrap justify-start gap-1 overflow-x-auto rounded-md border border-border/60 bg-muted/30 p-1">
                    {stepsForTabs.map((step) => {
                      const isCurrent =
                        !isCreateMode &&
                        liveInstance?.currentStepId === step.id &&
                        liveInstance.status === "running";
                      return (
                        <TabsTrigger
                          key={step.id}
                          value={step.id}
                          className={cn(
                            "shrink-0 whitespace-nowrap px-2.5 text-xs sm:text-sm",
                            isCurrent && "ring-1 ring-amber-400/80",
                          )}
                        >
                          {stepTabLabel(step.order, step.name)}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                  {stepsForTabs.map((step, idx) => (
                    <TabsContent key={step.id} value={step.id} className="mt-4 space-y-4 focus-visible:outline-none">
                      <DynamicStepFormFields
                        fieldSchema={step.fieldSchema}
                        values={stepPayloads[step.id] ?? {}}
                        onChange={(key, value) => patchStepPayload(step.id, key, value)}
                        readOnly={readOnly}
                        stepDescription={step.description}
                      />
                      {!isCreateMode && ticket ? (
                        <WorkflowInstancePanel
                          moduleKey="warranty"
                          entityId={ticket.apiId}
                          focusStepId={step.id}
                          compact
                        />
                      ) : null}
                      {!isCreateMode && idx === stepsForTabs.length - 1 ? renderTicketDocuments() : null}
                    </TabsContent>
                  ))}
                </Tabs>
              ) : (
                <p className="text-sm rounded-md border border-dashed border-border/80 bg-muted/20 px-3 py-4 text-muted-foreground text-center">
                  {isCreateMode
                    ? "Chọn quy trình áp dụng ở trên để nhập nội dung theo từng bước."
                    : "Phiếu chưa có quy trình đang chạy hoặc quy trình chưa có bước. Chọn quy trình ở phần tóm tắt và xác nhận áp dụng để bật form động."}
                </p>
              )}
            </div>

            {!isCreateMode && ticket && !hasEngineSteps ? (
              <WorkflowInstancePanel moduleKey="warranty" entityId={ticket.apiId} />
            ) : null}

            {!isCreateMode && ticket ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Ngày tạo: {ticket.createdAt ?? "—"}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2 sm:justify-between border-t border-border/60 px-6 py-4 mt-auto shrink-0 bg-background">
            {!isViewMode && !isCreateMode ? (
              <Button type="button" variant="destructive" className="mr-auto gap-1" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-4 w-4" /> Xóa
              </Button>
            ) : (
              <span className="hidden sm:block" aria-hidden />
            )}
            <div className="flex gap-2 ml-auto sm:ml-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Đóng
              </Button>
              {!isViewMode ? (
                <Button type="button" onClick={() => void handleSave()} disabled={updateW.isPending || createW.isPending}>
                  {updateW.isPending || createW.isPending ? "Đang lưu…" : isCreateMode ? "Tạo phiếu" : "Lưu"}
                </Button>
              ) : null}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={Boolean(pendingSwitchWorkflowId)}
        onOpenChange={(o) => !o && setPendingSwitchWorkflowId(null)}
      >
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
                void confirmSwitchWorkflow();
              }}
              disabled={attachWf.isPending}
            >
              {attachWf.isPending ? "Đang áp dụng…" : "Áp dụng"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!isViewMode && !isCreateMode && confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa ticket?</AlertDialogTitle>
            <AlertDialogDescription>Phiếu {ticket?.code ?? ""} sẽ được đánh dấu xóa mềm trên máy chủ.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
              disabled={deleteW.isPending}
            >
              {deleteW.isPending ? "Đang xóa…" : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </>
  );
};

const InfoItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
    <div className="text-primary mt-0.5">{icon}</div>
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-card-foreground">{value}</p>
    </div>
  </div>
);

export default WarrantyDetailDialog;
