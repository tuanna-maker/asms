import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { toastApiError } from "@/lib/api-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FeedbackLinkagePicker } from "@/components/feedback/FeedbackLinkagePicker";
import {
  FeedbackFormFooter,
  FeedbackFormPanel,
  FeedbackFormSection,
} from "@/components/feedback/FeedbackFormPanel";
import {
  useUpdateCustomerFeedback,
  type CustomerFeedbackRow,
  type FeedbackAssignees,
} from "@/hooks/use-customer-feedbacks-api";
import {
  FeedbackAssigneeSelect,
  isAssigneeComplete,
  rowToAssignees,
} from "@/components/feedback/FeedbackAssigneeSelect";
import { toDateInputValue } from "@/lib/customer-feedback-labels";
import {
  buildLinkagePayload,
  linkageItemsToSelection,
  resolveFeedbackContractId,
} from "@/lib/customer-feedback-linkage";
import { useFeedbackLinkageOptions } from "@/hooks/use-feedback-linkage-options";

type LinkageState = {
  contractId: string | null;
  productIds: string[];
  materialIds: string[];
};

type Props = {
  row: CustomerFeedbackRow;
  fixedContractId?: string;
  onCancel: () => void;
  onSaved?: () => void;
};

export function CustomerFeedbackEditForm({ row, fixedContractId, onCancel, onSaved }: Props) {
  const updateMut = useUpdateCustomerFeedback();

  const [title, setTitle] = useState(row.title);
  const [content, setContent] = useState(row.content);
  const [assignees, setAssignees] = useState<FeedbackAssignees>(() => rowToAssignees(row));
  const [feedbackAt, setFeedbackAt] = useState(toDateInputValue(row.feedbackAt));
  const [linkage, setLinkage] = useState<LinkageState>(() => {
    const sel = linkageItemsToSelection(row.linkageItems ?? []);
    return {
      contractId: fixedContractId ?? row.contractId ?? null,
      productIds: sel.productIds,
      materialIds: sel.materialIds,
    };
  });

  useEffect(() => {
    const sel = linkageItemsToSelection(row.linkageItems ?? []);
    setTitle(row.title);
    setContent(row.content);
    setAssignees(rowToAssignees(row));
    setFeedbackAt(toDateInputValue(row.feedbackAt));
    setLinkage({
      contractId: fixedContractId ?? row.contractId ?? null,
      productIds: sel.productIds,
      materialIds: sel.materialIds,
    });
  }, [row, fixedContractId]);

  const { data: linkageMeta, isLoading: linkageCatalogLoading } = useFeedbackLinkageOptions(
    row.customerId,
    { contractId: null, productIds: [], materialIds: [] },
    Boolean(row.customerId),
    { scope: "full" },
  );

  const linkagePayload = useMemo(() => {
    const materials = linkageMeta?.materials ?? [];
    return buildLinkagePayload(linkage.productIds, linkage.materialIds, materials);
  }, [linkage, linkageMeta?.materials]);

  const resolvedContractId = useMemo(
    () =>
      resolveFeedbackContractId(
        linkage.contractId ?? row.contractId,
        linkage.productIds,
        linkage.materialIds,
        linkageMeta?.products ?? [],
        linkageMeta?.materials ?? [],
      ),
    [linkage, row.contractId, linkageMeta?.products, linkageMeta?.materials],
  );

  const onSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Vui lòng nhập tiêu đề và nội dung");
      return;
    }
    if (linkagePayload.length > 0 && !resolvedContractId) {
      toast.error("Vui lòng chọn hợp đồng hoặc thu hẹp SP/VT về cùng một HĐ");
      return;
    }
    if (!isAssigneeComplete(assignees)) {
      toast.error("Vui lòng chọn người hoặc vai trò phân công");
      return;
    }
    try {
      await updateMut.mutateAsync({
        id: row.id,
        payload: {
          title: title.trim(),
          content: content.trim(),
          assignees,
          feedbackAt: new Date(`${feedbackAt}T12:00:00`).toISOString(),
          contractId: resolvedContractId,
          linkageItems: linkagePayload,
        },
      });
      toast.success("Đã cập nhật phản ánh");
      onSaved?.();
    } catch (e) {
      toastApiError(e, "Không cập nhật được phản ánh");
    }
  };

  return (
    <FeedbackFormPanel>
      {linkageCatalogLoading ? (
        <div className="flex items-center gap-2 py-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang tải hợp đồng, sản phẩm và vật tư…
        </div>
      ) : null}

      <FeedbackFormSection
        title="Liên kết hợp đồng / sản phẩm / vật tư"
        description="Gắn phản ánh với hợp đồng và thiết bị liên quan (tùy chọn)."
      >
        <FeedbackLinkagePicker
          customerId={row.customerId}
          contractId={linkage.contractId}
          productIds={linkage.productIds}
          materialIds={linkage.materialIds}
          onChange={setLinkage}
          fixedContractId={fixedContractId}
          initialLinkageItems={row.linkageItems}
          disabled={updateMut.isPending || linkageCatalogLoading}
          columnMaxHeight="min(48vh, 520px)"
          catalogScope="full"
        />
      </FeedbackFormSection>

      <FeedbackFormSection title="Nội dung phản ánh">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tiêu đề</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Nội dung</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5} />
          </div>
        </div>
      </FeedbackFormSection>

      <FeedbackFormSection
        title="Phân công & thời gian"
        description="Người hoặc vai trò nhận phản ánh và ngày ghi nhận sự cố."
        noDivider
      >
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_240px] gap-5 items-start">
          <FeedbackAssigneeSelect
            value={assignees}
            onChange={setAssignees}
            disabled={updateMut.isPending}
            compact
          />
          <div className="space-y-2">
            <Label>Ngày phản ánh</Label>
            <Input
              type="date"
              value={feedbackAt}
              onChange={(e) => setFeedbackAt(e.target.value)}
              disabled={updateMut.isPending}
            />
          </div>
        </div>
      </FeedbackFormSection>

      <FeedbackFormFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="button" onClick={() => void onSubmit()} disabled={updateMut.isPending}>
          {updateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
          Lưu thay đổi
        </Button>
      </FeedbackFormFooter>
    </FeedbackFormPanel>
  );
}
