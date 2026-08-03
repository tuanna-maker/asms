import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  clearStep3BranchFields,
  isGenericNotesStep,
  ROOT_CAUSE_LABELS,
} from "@/lib/warranty-step-field-template";
import type { DefinitionOption } from "@/hooks/use-definition-options";

const NONE = "__none__";

export type WarrantyStepFormFieldsProps = {
  stepIndex: number;
  readOnly: boolean;
  isCreateMode: boolean;
  issue: string;
  setIssue: (v: string) => void;
  source: "customer" | "internal";
  setSource: (v: "customer" | "internal") => void;
  type: string;
  setType: (v: string) => void;
  priority: string;
  setPriority: (v: string) => void;
  status: string;
  setStatus: (v: string) => void;
  receiptCategory: string;
  setReceiptCategory: (v: string) => void;
  occurredAtLocal: string;
  setOccurredAtLocal: (v: string) => void;
  productSerialSnapshot: string;
  setProductSerialSnapshot: (v: string) => void;
  rootCause: string;
  setRootCause: (v: string) => void;
  handlingPlan: string;
  setHandlingPlan: (v: string) => void;
  plannedHours: string;
  setPlannedHours: (v: string) => void;
  costEstimate: string;
  setCostEstimate: (v: string) => void;
  customerDisagreedClose: boolean;
  setCustomerDisagreedClose: (v: boolean) => void;
  executionMode: string;
  setExecutionMode: (v: string) => void;
  outsourcePartner: string;
  setOutsourcePartner: (v: string) => void;
  outsourceBudget: string;
  setOutsourceBudget: (v: string) => void;
  outsourceTimeline: string;
  setOutsourceTimeline: (v: string) => void;
  repairDetails: string;
  setRepairDetails: (v: string) => void;
  postRepairAssessment: string;
  setPostRepairAssessment: (v: string) => void;
  handoverNotes: string;
  setHandoverNotes: (v: string) => void;
  genericNotes: string;
  setGenericNotes: (v: string) => void;
  priorityOptions: DefinitionOption[];
  statusOptions: DefinitionOption[];
  cascadeBlock?: React.ReactNode;
};

function FieldBlock({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4">{children}</div>;
}

function receiptCategorySelectValue(receiptCategory: string): string {
  if (receiptCategory === "incident" || receiptCategory === "technical_support") return receiptCategory;
  return "incident";
}

function RootCauseField({
  rootCause,
  setRootCause,
  readOnly,
}: {
  rootCause: string;
  setRootCause: (v: string) => void;
  readOnly: boolean;
}) {
  const isLegacyUnknown = rootCause === "unknown";
  const selectValue =
    rootCause === "manufacturer" || rootCause === "customer" ? rootCause : NONE;

  if (readOnly && isLegacyUnknown) {
    return (
      <div className="space-y-1">
        <Label>Đánh giá nguyên nhân</Label>
        <p className="text-sm rounded-md border bg-muted/40 px-3 py-2">{ROOT_CAUSE_LABELS.unknown}</p>
      </div>
    );
  }

  if (readOnly) {
    const label = ROOT_CAUSE_LABELS[rootCause] ?? "—";
    return (
      <div className="space-y-1">
        <Label>Đánh giá nguyên nhân</Label>
        <p className="text-sm rounded-md border bg-muted/40 px-3 py-2">{label}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>Đánh giá nguyên nhân</Label>
      {isLegacyUnknown ? (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Dữ liệu cũ: Chưa rõ — vui lòng chọn Do nhà SX hoặc Do khách hàng.
        </p>
      ) : null}
      <Select value={selectValue} onValueChange={setRootCause}>
        <SelectTrigger>
          <SelectValue placeholder="Chọn nguyên nhân" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="manufacturer">Do nhà SX</SelectItem>
          <SelectItem value="customer">Do khách hàng</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function WarrantyStepFormFields(props: WarrantyStepFormFieldsProps) {
  const {
    stepIndex,
    readOnly,
    issue,
    setIssue,
    receiptCategory,
    setReceiptCategory,
    rootCause,
    setRootCause,
    handlingPlan,
    setHandlingPlan,
    plannedHours,
    setPlannedHours,
    costEstimate,
    setCostEstimate,
    customerDisagreedClose,
    setCustomerDisagreedClose,
    executionMode,
    setExecutionMode,
    outsourcePartner,
    setOutsourcePartner,
    outsourceBudget,
    setOutsourceBudget,
    outsourceTimeline,
    setOutsourceTimeline,
    repairDetails,
    setRepairDetails,
    postRepairAssessment,
    setPostRepairAssessment,
    handoverNotes,
    setHandoverNotes,
    genericNotes,
    setGenericNotes,
  } = props;

  const handleExecutionModeChange = (v: string) => {
    clearStep3BranchFields(v, {
      setOutsourcePartner,
      setOutsourceBudget,
      setOutsourceTimeline,
      setRepairDetails,
    });
    setExecutionMode(v);
  };

  if (isGenericNotesStep(stepIndex)) {
    return (
      <FieldBlock>
        <div className="space-y-2">
          <Label>Ghi chú bước</Label>
          <Textarea
            value={genericNotes}
            onChange={(e) => setGenericNotes(e.target.value)}
            rows={4}
            readOnly={readOnly}
          />
        </div>
      </FieldBlock>
    );
  }

  if (stepIndex === 0) {
    return (
      <div className="space-y-4 max-w-2xl">
        <div className="space-y-2">
          <Label htmlFor="wi-issue-step0">Mô tả sự cố</Label>
          <Textarea
            id="wi-issue-step0"
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            rows={3}
            readOnly={readOnly}
            placeholder="Mô tả ngắn sự cố / yêu cầu hỗ trợ"
          />
        </div>
        <div className="grid gap-4 grid-cols-1 max-w-md">
          <div className="space-y-2">
            <Label>Phân loại</Label>
            <Select
              value={receiptCategorySelectValue(receiptCategory)}
              onValueChange={setReceiptCategory}
              disabled={readOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn phân loại" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="incident">Sự cố, hỏng hóc</SelectItem>
                <SelectItem value="technical_support">Kỹ thuật</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    );
  }

  if (stepIndex === 1) {
    return (
      <FieldBlock>
        <div className="space-y-3">
          <RootCauseField rootCause={rootCause} setRootCause={setRootCause} readOnly={readOnly} />
          <div className="space-y-2">
            <Label>Phương án xử lý (PA)</Label>
            <Textarea value={handlingPlan} onChange={(e) => setHandlingPlan(e.target.value)} rows={4} readOnly={readOnly} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Thời gian xử lý (dự kiến)</Label>
              <Input
                value={plannedHours}
                onChange={(e) => setPlannedHours(e.target.value)}
                inputMode="numeric"
                disabled={readOnly}
                placeholder="Giờ"
              />
            </div>
            <div className="space-y-2">
              <Label>Chi phí (nếu có)</Label>
              <Input
                value={costEstimate}
                onChange={(e) => setCostEstimate(e.target.value)}
                disabled={readOnly}
                placeholder="VD: 1500000"
              />
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Checkbox
              id="wi-disagree-1"
              checked={customerDisagreedClose}
              onCheckedChange={(c) => setCustomerDisagreedClose(c === true)}
              disabled={readOnly}
            />
            <div className="space-y-0.5">
              <Label htmlFor="wi-disagree-1" className="text-sm font-normal cursor-pointer">
                KH không đồng ý PA → đóng sự cố
              </Label>
              <p className="text-xs text-muted-foreground">Đánh dấu khi khách hàng từ chối phương án xử lý.</p>
            </div>
          </div>
        </div>
      </FieldBlock>
    );
  }

  if (stepIndex === 2) {
    const showOutsource = executionMode === "outsource";
    const showSelf = executionMode === "self";
    const showModeHint = executionMode !== "outsource" && executionMode !== "self";

    return (
      <FieldBlock>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Hình thức thực hiện</Label>
            <Select value={executionMode} onValueChange={handleExecutionModeChange} disabled={readOnly}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn hình thức" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— Chưa chọn —</SelectItem>
                <SelectItem value="outsource">Thuê đối tác ngoài</SelectItem>
                <SelectItem value="self">Tự thực hiện</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {showModeHint ? (
            <p className="text-xs text-muted-foreground">Chọn hình thức thực hiện để nhập nội dung bước này.</p>
          ) : null}

          {showOutsource ? (
            <div className="space-y-3 rounded-lg border p-3">
              <p className="text-sm font-medium">Thuê đối tác ngoài</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Đối tác</Label>
                  <Input value={outsourcePartner} onChange={(e) => setOutsourcePartner(e.target.value)} disabled={readOnly} />
                </div>
                <div className="space-y-2">
                  <Label>Kinh phí</Label>
                  <Input value={outsourceBudget} onChange={(e) => setOutsourceBudget(e.target.value)} disabled={readOnly} />
                </div>
                <div className="space-y-2">
                  <Label>Thời gian</Label>
                  <Input value={outsourceTimeline} onChange={(e) => setOutsourceTimeline(e.target.value)} disabled={readOnly} />
                </div>
              </div>
            </div>
          ) : null}

          {showSelf ? (
            <div className="space-y-3 rounded-lg border p-3">
              <p className="text-sm font-medium">Tự thực hiện</p>
              <div className="space-y-2">
                <Label>Nội dung sửa chữa</Label>
                <Textarea value={repairDetails} onChange={(e) => setRepairDetails(e.target.value)} rows={4} readOnly={readOnly} />
              </div>
            </div>
          ) : null}
        </div>
      </FieldBlock>
    );
  }

  if (stepIndex === 3) {
    return (
      <FieldBlock>
        <div className="space-y-2">
          <Label>Đánh giá hàng sau SC với khách hàng</Label>
          <Textarea
            value={postRepairAssessment}
            onChange={(e) => setPostRepairAssessment(e.target.value)}
            rows={4}
            readOnly={readOnly}
          />
        </div>
      </FieldBlock>
    );
  }

  if (stepIndex === 4) {
    return (
      <FieldBlock>
        <div className="space-y-2">
          <Label>Ghi chú bàn giao</Label>
          <p className="text-xs text-muted-foreground">Biên bản: BBBG hàng hóa</p>
          <Textarea value={handoverNotes} onChange={(e) => setHandoverNotes(e.target.value)} rows={4} readOnly={readOnly} />
        </div>
      </FieldBlock>
    );
  }

  return null;
}
