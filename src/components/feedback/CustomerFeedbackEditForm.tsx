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
  useUpdateCustomerFeedback,
  type CustomerFeedbackRow,
  type FeedbackAssignee,
} from "@/hooks/use-customer-feedbacks-api";
import {
  FeedbackAssigneeSelect,
  isAssigneeComplete,
  rowToAssignee,
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
  const [assignee, setAssignee] = useState<FeedbackAssignee>(() => rowToAssignee(row));
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
    setAssignee(rowToAssignee(row));
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
    if (!isAssigneeComplete(assignee)) {
      toast.error("Vui lòng chọn người hoặc vai trò phân công");
      return;
    }
    try {
      await updateMut.mutateAsync({
        id: row.id,
        payload: {
          title: title.trim(),
          content: content.trim(),
          assignee,
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
    <div className="flex flex-col gap-4 max-w-6xl pb-8">
      {linkageCatalogLoading ? (
        <div className="flex items-center gap-2 py-8 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang tải hợp đồng, sản phẩm và vật tư…
        </div>
      ) : null}
      <FeedbackLinkagePicker
        customerId={row.customerId}
        contractId={linkage.contractId}
        productIds={linkage.productIds}
        materialIds={linkage.materialIds}
        onChange={setLinkage}
        fixedContractId={fixedContractId}
        initialLinkageItems={row.linkageItems}
        disabled={updateMut.isPending || linkageCatalogLoading}
        columnMaxHeight="min(52vh, 560px)"
        catalogScope="full"
      />
      <div className="space-y-2">
        <Label>Tiêu đề</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Nội dung</Label>
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
        <FeedbackAssigneeSelect
          value={assignee}
          onChange={setAssignee}
          disabled={updateMut.isPending}
          userDisplayName={row.assignedUser?.fullName}
        />
        <div className="space-y-2">
          <Label>Ngày phản ánh</Label>
          <Input type="date" value={feedbackAt} onChange={(e) => setFeedbackAt(e.target.value)} />
        </div>
      </div>
      <div className="flex gap-2 pt-2 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="button" onClick={() => void onSubmit()} disabled={updateMut.isPending}>
          {updateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
          Lưu thay đổi
        </Button>
      </div>
    </div>
  );
}
