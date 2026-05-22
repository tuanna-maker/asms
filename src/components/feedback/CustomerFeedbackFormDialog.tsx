import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  useCreateCustomerFeedback,
  useUpdateCustomerFeedback,
  type CustomerFeedbackRow,
  type CustomerFeedbackSeverity,
  type CustomerFeedbackStatus,
} from "@/hooks/use-customer-feedbacks-api";
import {
  SEVERITY_LABELS,
  STATUS_LABELS,
  toDateInputValue,
} from "@/lib/customer-feedback-labels";

type FormState = {
  customerId: string | null;
  title: string;
  content: string;
  severity: CustomerFeedbackSeverity;
  status: CustomerFeedbackStatus;
  feedbackAt: string;
};

function emptyForm(defaultCustomerId?: string): FormState {
  return {
    customerId: defaultCustomerId ?? null,
    title: "",
    content: "",
    severity: "medium",
    status: "new",
    feedbackAt: toDateInputValue(),
  };
}

export type CustomerFeedbackFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: CustomerFeedbackRow | null;
  /** Khi tạo từ tab KH/HĐ/BH */
  customerId?: string;
  contractId?: string;
  warrantyId?: string;
  /** Màn tổng: bắt buộc chọn khách hàng */
  requireCustomerSelect?: boolean;
  onSuccess?: () => void;
};

export function CustomerFeedbackFormDialog({
  open,
  onOpenChange,
  editing = null,
  customerId: fixedCustomerId,
  contractId,
  warrantyId,
  requireCustomerSelect = false,
  onSuccess,
}: CustomerFeedbackFormDialogProps) {
  const createMut = useCreateCustomerFeedback();
  const updateMut = useUpdateCustomerFeedback();
  const [form, setForm] = useState<FormState>(() => emptyForm(fixedCustomerId));

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        customerId: editing.customerId,
        title: editing.title,
        content: editing.content,
        severity: editing.severity,
        status: editing.status,
        feedbackAt: toDateInputValue(editing.feedbackAt),
      });
    } else {
      setForm(emptyForm(fixedCustomerId));
    }
  }, [open, editing, fixedCustomerId]);

  const showCustomerPicker = requireCustomerSelect || (!fixedCustomerId && !editing);
  const resolvedCustomerId = fixedCustomerId ?? form.customerId ?? editing?.customerId ?? null;

  const onSubmit = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Vui lòng nhập tiêu đề và nội dung phản ánh");
      return;
    }
    if (!resolvedCustomerId) {
      toast.error("Vui lòng chọn khách hàng");
      return;
    }
    const feedbackAt = new Date(`${form.feedbackAt}T12:00:00`).toISOString();
    try {
      if (editing) {
        await updateMut.mutateAsync({
          id: editing.id,
          payload: {
            title: form.title.trim(),
            content: form.content.trim(),
            severity: form.severity,
            status: form.status,
            feedbackAt,
          },
        });
        toast.success("Đã cập nhật phản ánh");
      } else {
        await createMut.mutateAsync({
          customerId: resolvedCustomerId,
          contractId: contractId ?? null,
          warrantyId: warrantyId ?? null,
          title: form.title.trim(),
          content: form.content.trim(),
          severity: form.severity,
          status: form.status,
          feedbackAt,
        });
        toast.success("Đã thêm phản ánh");
      }
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error(editing ? "Không cập nhật được phản ánh" : "Không thêm được phản ánh");
    }
  };

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Sửa phản ánh" : "Thêm phản ánh"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {showCustomerPicker && (
            <div className="space-y-2">
              <Label>Khách hàng</Label>
              <CustomerSearchSelect
                value={form.customerId}
                onChange={(id) => setForm((f) => ({ ...f, customerId: id }))}
                disabled={Boolean(editing)}
                displayName={editing?.customer.name}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="fb-title">Tiêu đề</Label>
            <Input
              id="fb-title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Tóm tắt phản ánh"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fb-content">Nội dung</Label>
            <Textarea
              id="fb-content"
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="Mô tả chi tiết phản ánh của khách hàng"
              rows={4}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Mức độ</Label>
              <Select
                value={form.severity}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, severity: v as CustomerFeedbackSeverity }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(SEVERITY_LABELS) as CustomerFeedbackSeverity[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {SEVERITY_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, status: v as CustomerFeedbackStatus }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_LABELS) as CustomerFeedbackStatus[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {STATUS_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fb-date">Ngày phản ánh</Label>
            <Input
              id="fb-date"
              type="date"
              value={form.feedbackAt}
              onChange={(e) => setForm((f) => ({ ...f, feedbackAt: e.target.value }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={() => void onSubmit()} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            {editing ? "Lưu" : "Thêm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
