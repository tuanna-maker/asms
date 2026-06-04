import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { toastApiError } from "@/lib/api-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomerSearchSelect } from "@/components/common/CustomerSearchSelect";
import { FeedbackLinkagePicker } from "@/components/feedback/FeedbackLinkagePicker";
import {
  FeedbackFormFooter,
  FeedbackFormPanel,
  FeedbackFormSection,
  FeedbackFormSteps,
} from "@/components/feedback/FeedbackFormPanel";
import {
  useCreateCustomerFeedback,
  type FeedbackAssignees,
} from "@/hooks/use-customer-feedbacks-api";
import {
  FeedbackAssigneeSelect,
  emptyAssignees,
  isAssigneeComplete,
} from "@/components/feedback/FeedbackAssigneeSelect";
import { useFeedbackLinkageOptions } from "@/hooks/use-feedback-linkage-options";
import { useRoutingPreview } from "@/hooks/use-feedback-execution-units-api";
import { toDateInputValue } from "@/lib/customer-feedback-labels";
import { useRolesList } from "@/hooks/use-roles-api";
import { useUsersList } from "@/hooks/use-users-api";
import {
  buildLinkagePayload,
  formatLinkageSummary,
  resolveFeedbackContractId,
} from "@/lib/customer-feedback-linkage";
import {
  CHANNEL_LABELS,
  SOURCE_LABELS,
  emptyIntake,
  type FeedbackChannel,
  type FeedbackIntake,
  type FeedbackSource,
} from "@/lib/customer-feedback-intake";

type LinkageState = {
  contractId: string | null;
  productIds: string[];
  materialIds: string[];
};

type Props = {
  fixedCustomerId?: string;
  fixedContractId?: string;
  requireCustomerSelect?: boolean;
  /** ID ticket vừa tạo */
  onSuccess?: (createdId: string) => void;
  onCancel: () => void;
};

const STEPS = ["Thu thập", "Liên kết", "Xem trước"] as const;

export function FeedbackIntakeWizard({
  fixedCustomerId,
  fixedContractId,
  requireCustomerSelect = false,
  onSuccess,
  onCancel,
}: Props) {
  const createMut = useCreateCustomerFeedback();
  const [step, setStep] = useState(0);

  const [customerId, setCustomerId] = useState<string | null>(fixedCustomerId ?? null);
  const [source, setSource] = useState<FeedbackSource>("external");
  const [intake, setIntake] = useState<FeedbackIntake>(emptyIntake());
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [assignees, setAssignees] = useState<FeedbackAssignees>(emptyAssignees());
  const { data: roles = [] } = useRolesList(step >= 2);
  const { data: users = [] } = useUsersList(step >= 2 && assignees.userIds.length > 0);
  const [feedbackAt, setFeedbackAt] = useState(toDateInputValue());
  const [linkage, setLinkage] = useState<LinkageState>(() => ({
    contractId: fixedContractId ?? null,
    productIds: [],
    materialIds: [],
  }));

  const resolvedCustomerId = fixedCustomerId ?? customerId;
  const { data: linkageMeta } = useFeedbackLinkageOptions(
    resolvedCustomerId,
    linkage,
    Boolean(resolvedCustomerId),
  );

  const linkagePayload = useMemo(() => {
    const materials = linkageMeta?.materials ?? [];
    return buildLinkagePayload(linkage.productIds, linkage.materialIds, materials);
  }, [linkage, linkageMeta?.materials]);

  const { data: previewUnits = [] } = useRoutingPreview(linkage.productIds, step >= 2);

  useEffect(() => {
    setCustomerId(fixedCustomerId ?? null);
    setLinkage({ contractId: fixedContractId ?? null, productIds: [], materialIds: [] });
    setStep(0);
  }, [fixedCustomerId, fixedContractId]);

  const resolvedContractId = useMemo(() => {
    const products = linkageMeta?.products ?? [];
    const materials = linkageMeta?.materials ?? [];
    return resolveFeedbackContractId(
      linkage.contractId,
      linkage.productIds,
      linkage.materialIds,
      products,
      materials,
    );
  }, [linkage, linkageMeta?.products, linkageMeta?.materials]);

  const assigneePreview = useMemo(() => {
    const userNames = assignees.userIds
      .map((id) => users.find((x) => x.id === id)?.fullName)
      .filter(Boolean) as string[];
    const roleNames = assignees.roleCodes.map(
      (code) => roles.find((x) => x.code === code)?.name ?? code,
    );
    const parts: string[] = [];
    if (userNames.length > 0) parts.push(userNames.join(", "));
    if (roleNames.length > 0) parts.push(roleNames.map((n) => `Vai trò: ${n}`).join(", "));
    return parts.length > 0 ? parts.join(" · ") : "—";
  }, [assignees, users, roles]);

  const contractForSummary = useMemo(() => {
    if (!resolvedContractId) return null;
    return linkageMeta?.contracts.find((c) => c.id === resolvedContractId) ?? null;
  }, [resolvedContractId, linkageMeta?.contracts]);

  const summaryLines = useMemo(() => {
    if (!resolvedContractId) return [];
    const materials = linkageMeta?.materials ?? [];
    const products = linkageMeta?.products ?? [];
    return linkagePayload.map((line) => {
      const product = products.find((p) => p.id === line.productId);
      const material = line.materialId ? materials.find((m) => m.id === line.materialId) : null;
      return {
        productId: line.productId,
        productCode: product?.code ?? line.productId,
        productName: product?.name ?? "",
        materialId: material?.id ?? null,
        materialCode: material?.code ?? null,
        materialName: material?.name ?? null,
      };
    });
  }, [resolvedContractId, linkagePayload, linkageMeta]);

  const validateStep = (idx: number): boolean => {
    if (idx === 0) {
      if (!resolvedCustomerId) {
        toast.error("Vui lòng chọn khách hàng");
        return false;
      }
      if (!title.trim() || !content.trim()) {
        toast.error("Vui lòng nhập tiêu đề và nội dung");
        return false;
      }
      if (!intake.customerStatement?.trim()) {
        toast.error("Vui lòng ghi nhận lời KH");
        return false;
      }
      if (!isAssigneeComplete(assignees)) {
        toast.error("Vui lòng chọn người hoặc vai trò phân công");
        return false;
      }
      return true;
    }
    if (idx === 1 && linkagePayload.length > 0 && !resolvedContractId) {
      toast.error(
        "Vui lòng chọn hợp đồng (hoặc thu hẹp SP/VT về cùng một HĐ) khi gắn sản phẩm",
      );
      return false;
    }
    return true;
  };

  const onSubmit = async () => {
    if (!validateStep(0) || !validateStep(1)) return;
    if (!resolvedCustomerId) return;
    if (
      linkagePayload.length > 0 &&
      previewUnits.length === 0 &&
      !window.confirm(
        "Không xác định được đơn vị xử lý cho sản phẩm đã chọn. Bạn vẫn muốn tạo phản ánh (trạng thái mới, chưa giao đơn vị)?",
      )
    ) {
      return;
    }
    try {
      const created = await createMut.mutateAsync({
        customerId: resolvedCustomerId,
        contractId: resolvedContractId,
        title: title.trim(),
        content: content.trim(),
        assignees,
        source,
        intake: {
          ...intake,
          customerStatement: intake.customerStatement?.trim() || content.trim(),
        },
        feedbackAt: new Date(`${feedbackAt}T12:00:00`).toISOString(),
        linkageItems: linkagePayload,
      });
      toast.success("Đã tạo phản ánh và giao đơn vị xử lý");
      onSuccess?.(created.id);
    } catch (e) {
      toastApiError(e, "Không tạo được phản ánh");
    }
  };

  const showCustomerPicker = requireCustomerSelect || !fixedCustomerId;

  return (
    <FeedbackFormPanel className="flex-1 min-h-0">
      <FeedbackFormSteps>
        {STEPS.map((label, i) => (
          <span
            key={label}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              i === step
                ? "bg-primary text-primary-foreground shadow-sm"
                : i < step
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            <span
              className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                i === step ? "bg-primary-foreground/20" : "bg-background/60"
              }`}
            >
              {i + 1}
            </span>
            {label}
          </span>
        ))}
      </FeedbackFormSteps>

      {step === 0 && (
        <>
          {showCustomerPicker ? (
            <FeedbackFormSection
              title="Khách hàng"
              description="Đơn vị đối tác phát sinh phản ánh."
            >
              <CustomerSearchSelect value={customerId} onChange={setCustomerId} />
            </FeedbackFormSection>
          ) : null}

          <FeedbackFormSection
            title="Thông tin tiếp nhận"
            description="Nguồn, kênh liên hệ và người liên hệ."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nguồn</Label>
                <Select value={source} onValueChange={(v) => setSource(v as FeedbackSource)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(SOURCE_LABELS) as FeedbackSource[]).map((k) => (
                      <SelectItem key={k} value={k}>
                        {SOURCE_LABELS[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Kênh liên hệ</Label>
                <Select
                  value={intake.channel ?? ""}
                  onValueChange={(v) =>
                    setIntake((p) => ({ ...p, channel: (v || null) as FeedbackChannel | null }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tùy chọn" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CHANNEL_LABELS) as FeedbackChannel[]).map((k) => (
                      <SelectItem key={k} value={k}>
                        {CHANNEL_LABELS[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Người liên hệ</Label>
                <Input
                  value={intake.contactName ?? ""}
                  onChange={(e) => setIntake((p) => ({ ...p, contactName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>SĐT</Label>
                <Input
                  value={intake.contactPhone ?? ""}
                  onChange={(e) => setIntake((p) => ({ ...p, contactPhone: e.target.value }))}
                />
              </div>
            </div>
          </FeedbackFormSection>

          <FeedbackFormSection
            title="Mô tả sự cố"
            description="Lời khách hàng và nội dung ticket nội bộ."
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Lời KH / mô tả sự cố *</Label>
                <Textarea
                  value={intake.customerStatement ?? ""}
                  onChange={(e) => setIntake((p) => ({ ...p, customerStatement: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Triệu chứng / hiện tượng</Label>
                <Input
                  value={intake.symptom ?? ""}
                  onChange={(e) => setIntake((p) => ({ ...p, symptom: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Tiêu đề ticket *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Nội dung nội bộ *</Label>
                <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={3} />
              </div>
            </div>
          </FeedbackFormSection>

          <FeedbackFormSection
            title="Phân công & thời gian"
            description="Người hoặc vai trò nhận phản ánh và ngày ghi nhận."
            noDivider
          >
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_240px] gap-5 items-start">
              <FeedbackAssigneeSelect value={assignees} onChange={setAssignees} compact />
              <div className="space-y-2">
                <Label>Ngày phản ánh</Label>
                <Input type="date" value={feedbackAt} onChange={(e) => setFeedbackAt(e.target.value)} />
              </div>
            </div>
          </FeedbackFormSection>
        </>
      )}

      {step === 1 && (
        <FeedbackFormSection
          title="Liên kết hợp đồng / sản phẩm / vật tư"
          description="Tùy chọn — gắn phản ánh với thiết bị liên quan."
          noDivider
          className="flex-1 min-h-0 flex flex-col"
        >
          <div className="flex-1 min-h-0">
            <FeedbackLinkagePicker
              customerId={resolvedCustomerId}
              contractId={linkage.contractId}
              productIds={linkage.productIds}
              materialIds={linkage.materialIds}
              onChange={setLinkage}
              fixedContractId={fixedContractId}
              columnMaxHeight="min(58vh, 560px)"
            />
          </div>
        </FeedbackFormSection>
      )}

      {step === 2 && (
        <FeedbackFormSection title="Xem trước trước khi tạo" noDivider className="text-sm">
          <div className="space-y-3">
            <p>
              <span className="text-muted-foreground">KH:</span> {resolvedCustomerId ? "Đã chọn" : "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Tiêu đề:</span> {title}
            </p>
            <p>
              <span className="text-muted-foreground">Phân công:</span> {assigneePreview}
            </p>
            {summaryLines.length > 0 && contractForSummary ? (
              <div className="rounded-md border border-border/40 bg-background/40 p-3 text-xs whitespace-pre-wrap">
                {formatLinkageSummary(summaryLines, contractForSummary)}
              </div>
            ) : (
              <p className="text-muted-foreground">Chưa gắn sản phẩm/vật tư (tùy chọn).</p>
            )}
            <div>
              <p className="font-medium mb-1">Đơn vị sẽ được giao:</p>
              {previewUnits.length === 0 ? (
                <p className="text-amber-600 text-xs">
                  Chưa có quy tắc định tuyến — cấu hình tại Cài đặt → Đơn vị phản ánh.
                </p>
              ) : (
                <ul className="list-disc pl-4 text-xs">
                  {previewUnits.map((u) => (
                    <li key={u.id}>
                      {u.name} ({u.code})
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </FeedbackFormSection>
      )}

      <FeedbackFormFooter className="justify-between">
        <Button type="button" variant="outline" onClick={onCancel}>
          Hủy
        </Button>
        <div className="flex gap-2">
          {step > 0 && (
            <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Quay lại
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button
              type="button"
              onClick={() => {
                if (validateStep(step)) setStep((s) => s + 1);
              }}
            >
              Tiếp <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button type="button" onClick={() => void onSubmit()} disabled={createMut.isPending}>
              {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Tạo phản ánh
            </Button>
          )}
        </div>
      </FeedbackFormFooter>
    </FeedbackFormPanel>
  );
}
