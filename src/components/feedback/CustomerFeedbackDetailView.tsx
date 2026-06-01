import { useState, type ReactNode } from "react";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { toastApiError } from "@/lib/api-errors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCloseFeedback,
  useReopenFeedback,
  useRequestCloseFeedback,
  useUpdateFeedbackAssignment,
  type CustomerFeedbackRow,
  type FeedbackAssignment,
  type FeedbackAssignmentStatus,
} from "@/hooks/use-customer-feedbacks-api";
import { useAuth } from "@/hooks/use-auth";
import {
  STATUS_LABELS,
  formatAssigneeLabel,
  formatFeedbackDate,
  isFeedbackOverdue,
  statusVariant,
} from "@/lib/customer-feedback-labels";
import { formatLinkageSummary } from "@/lib/customer-feedback-linkage";
import { SOURCE_LABELS } from "@/lib/customer-feedback-intake";
import { FeedbackActivitySection } from "@/components/feedback/FeedbackActivitySection";

export type CustomerFeedbackDetailViewProps = {
  row: CustomerFeedbackRow;
  readonly?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onRefresh?: () => void;
};

function DetailField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="text-sm">{children}</div>
    </div>
  );
}

const ASSIGNMENT_STATUS_LABELS: Record<FeedbackAssignmentStatus, string> = {
  pending: "Chờ xử lý",
  in_progress: "Đang làm",
  done: "Hoàn thành",
};

function AssignmentRow({
  row,
  assignment,
  canUpdateUnit,
  onUpdated,
}: {
  row: CustomerFeedbackRow;
  assignment: FeedbackAssignment;
  canUpdateUnit: boolean;
  onUpdated: () => void;
}) {
  const updateMut = useUpdateFeedbackAssignment();
  const [note, setNote] = useState(assignment.responseNote ?? "");
  const [status, setStatus] = useState<FeedbackAssignmentStatus>(assignment.status);

  const save = async () => {
    try {
      await updateMut.mutateAsync({
        feedbackId: row.id,
        assignmentId: assignment.id,
        payload: { status, responseNote: note },
      });
      toast.success("Đã cập nhật");
      onUpdated();
    } catch (e) {
      toastApiError(e, "Không cập nhật được");
    }
  };

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-sm">{assignment.unit.name}</span>
        <Badge variant="outline">{ASSIGNMENT_STATUS_LABELS[assignment.status]}</Badge>
      </div>
      {assignment.responseNote ? (
        <p className="text-xs text-muted-foreground whitespace-pre-wrap">{assignment.responseNote}</p>
      ) : null}
      {canUpdateUnit && row.status !== "resolved" ? (
        <>
          <Select value={status} onValueChange={(v) => setStatus(v as FeedbackAssignmentStatus)}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(ASSIGNMENT_STATUS_LABELS) as FeedbackAssignmentStatus[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {ASSIGNMENT_STATUS_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nội dung cập nhật của đơn vị"
            rows={2}
            className="text-xs"
          />
          <Button size="sm" onClick={() => void save()} disabled={updateMut.isPending}>
            {updateMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Lưu cập nhật"}
          </Button>
        </>
      ) : null}
    </div>
  );
}

export function CustomerFeedbackDetailView({
  row,
  readonly = false,
  onEdit,
  onDelete,
  onRefresh,
}: CustomerFeedbackDetailViewProps) {
  const { user } = useAuth();
  const requestCloseMut = useRequestCloseFeedback();
  const closeMut = useCloseFeedback();
  const reopenMut = useReopenFeedback();

  const linkageText = formatLinkageSummary(row.linkageItems ?? [], row.contract);
  const isCreator = user?.id === row.createdById;
  const overdue = isFeedbackOverdue(row);

  const handleRequestClose = async () => {
    try {
      await requestCloseMut.mutateAsync({ id: row.id });
      toast.success("Đã chuyển chờ đóng");
      onRefresh?.();
    } catch (e) {
      toastApiError(e, "Không thực hiện được");
    }
  };

  const handleClose = async (verified: boolean) => {
    try {
      await closeMut.mutateAsync({ id: row.id, customerVerified: verified });
      toast.success("Đã đóng phản ánh");
      onRefresh?.();
    } catch (e) {
      toastApiError(e, "Không đóng được");
    }
  };

  const handleReopen = async () => {
    try {
      await reopenMut.mutateAsync({ id: row.id });
      toast.success("Đã mở lại");
      onRefresh?.();
    } catch (e) {
      toastApiError(e, "Không mở lại được");
    }
  };

  return (
    <div className="max-w-5xl space-y-5 pb-8">
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{formatAssigneeLabel(row)}</Badge>
        <Badge variant={statusVariant[row.status]}>{STATUS_LABELS[row.status]}</Badge>
        {overdue ? <Badge variant="destructive">Quá hạn SLA</Badge> : null}
      </div>

      <DetailField label="Nội dung">
        <p className="whitespace-pre-wrap text-card-foreground">{row.content}</p>
      </DetailField>

      {row.intake?.customerStatement ? (
        <DetailField label="Lời KH">{row.intake.customerStatement}</DetailField>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DetailField label="Phân công">{formatAssigneeLabel(row)}</DetailField>
        <DetailField label="Nguồn">{SOURCE_LABELS[row.source] ?? row.source}</DetailField>
        <DetailField label="Ngày phản ánh">{formatFeedbackDate(row.feedbackAt)}</DetailField>
        {row.slaDueAt ? (
          <DetailField label="Hạn SLA">{formatFeedbackDate(row.slaDueAt)}</DetailField>
        ) : null}
      </div>

      <DetailField label="Khách hàng">
        <span>
          <span className="font-mono text-xs text-muted-foreground">{row.customer.code}</span>
          {" — "}
          {row.customer.name}
        </span>
      </DetailField>

      <DetailField label="Liên kết (HĐ → SP → VT)">
        <p className="whitespace-pre-wrap text-sm">{linkageText}</p>
      </DetailField>

      <FeedbackActivitySection row={row} onPosted={() => onRefresh?.()} />

      {(row.assignments?.length ?? 0) > 0 ? (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Đơn vị xử lý</Label>
          {row.assignments!.map((a) => (
            <AssignmentRow
              key={a.id}
              row={row}
              assignment={a}
              canUpdateUnit={!readonly}
              onUpdated={() => onRefresh?.()}
            />
          ))}
        </div>
      ) : null}

      {row.warranty ? (
        <DetailField label="Bảo hành (dữ liệu cũ)">
          <span className="font-mono text-xs">{row.warranty.code}</span>
        </DetailField>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DetailField label="Người tạo">{row.createdBy?.fullName ?? "—"}</DetailField>
        {row.closedBy ? (
          <DetailField label="Người đóng">
            {row.closedBy.fullName} · {formatFeedbackDate(row.closedAt)}
          </DetailField>
        ) : null}
      </div>

      {!readonly && isCreator && row.status !== "resolved" ? (
        <div className="flex flex-wrap gap-2 border-t pt-4">
          <Button size="sm" variant="outline" onClick={() => void handleRequestClose()}>
            Đã liên hệ KH
          </Button>
          <Button size="sm" onClick={() => void handleClose(true)}>
            Đóng (KH OK)
          </Button>
          <Button size="sm" variant="secondary" onClick={() => void handleClose(false)}>
            Đóng (chưa xác nhận)
          </Button>
        </div>
      ) : null}

      {!readonly && isCreator && row.status === "resolved" ? (
        <Button size="sm" variant="outline" onClick={() => void handleReopen()}>
          Mở lại
        </Button>
      ) : null}

      {!readonly && (onEdit || onDelete) ? (
        <div className="flex gap-2 pt-2 border-t border-border/60">
          {onEdit ? (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-1" />
              Sửa
            </Button>
          ) : null}
          {onDelete ? (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Xóa
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
