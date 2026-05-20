import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Edit, Loader2, MessageSquareWarning, PlusCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateCustomerFeedback,
  useCustomerFeedbacksList,
  useDeleteCustomerFeedback,
  useUpdateCustomerFeedback,
  type CustomerFeedbackRow,
  type CustomerFeedbackSeverity,
  type CustomerFeedbackStatus,
} from "@/hooks/use-customer-feedbacks-api";

const SEVERITY_LABELS: Record<CustomerFeedbackSeverity, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
};

const STATUS_LABELS: Record<CustomerFeedbackStatus, string> = {
  new: "Mới",
  processing: "Đang xử lý",
  resolved: "Đã xử lý",
};

const severityVariant: Record<CustomerFeedbackSeverity, "outline" | "secondary" | "destructive"> = {
  low: "outline",
  medium: "secondary",
  high: "destructive",
};

const statusVariant: Record<CustomerFeedbackStatus, "default" | "secondary" | "outline"> = {
  new: "default",
  processing: "secondary",
  resolved: "outline",
};

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function toDateInputValue(value?: string): string {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

type FormState = {
  title: string;
  content: string;
  severity: CustomerFeedbackSeverity;
  status: CustomerFeedbackStatus;
  feedbackAt: string;
};

const emptyForm = (): FormState => ({
  title: "",
  content: "",
  severity: "medium",
  status: "new",
  feedbackAt: toDateInputValue(),
});

type Props = {
  customerId: string;
  contractId?: string;
  warrantyId?: string;
  readonly?: boolean;
  showContextColumns?: boolean;
};

export function CustomerFeedbackSection({
  customerId,
  contractId,
  warrantyId,
  readonly = false,
  showContextColumns = false,
}: Props) {
  const filters = useMemo(
    () => ({ customerId, contractId, warrantyId }),
    [customerId, contractId, warrantyId],
  );

  const { data: rows = [], isLoading } = useCustomerFeedbacksList(filters, Boolean(customerId));
  const createMut = useCreateCustomerFeedback();
  const updateMut = useUpdateCustomerFeedback();
  const deleteMut = useDeleteCustomerFeedback();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerFeedbackRow | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (row: CustomerFeedbackRow) => {
    setEditing(row);
    setForm({
      title: row.title,
      content: row.content,
      severity: row.severity,
      status: row.status,
      feedbackAt: toDateInputValue(row.feedbackAt),
    });
    setDialogOpen(true);
  };

  const onSubmit = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Vui lòng nhập tiêu đề và nội dung phản ánh");
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
          customerId,
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
      setDialogOpen(false);
    } catch {
      toast.error(editing ? "Không cập nhật được phản ánh" : "Không thêm được phản ánh");
    }
  };

  const onConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMut.mutateAsync(deleteId);
      toast.success("Đã xóa phản ánh");
      setDeleteId(null);
    } catch {
      toast.error("Không xóa được phản ánh");
    }
  };

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
          <MessageSquareWarning className="h-4 w-4 text-amber-600" />
          Phản ánh khách hàng
        </h4>
        {!readonly && (
          <Button size="sm" variant="outline" onClick={openCreate}>
            <PlusCircle className="h-4 w-4 mr-1" /> Thêm phản ánh
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground rounded-lg border border-dashed border-border/80 px-4 py-6 text-center">
          Chưa có phản ánh nào.
        </p>
      ) : (
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tiêu đề</TableHead>
                {showContextColumns && <TableHead>Liên kết</TableHead>}
                <TableHead>Mức độ</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày</TableHead>
                {!readonly && <TableHead className="text-right">Thao tác</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium max-w-[200px]">
                    <p className="truncate" title={row.title}>{row.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5" title={row.content}>
                      {row.content}
                    </p>
                  </TableCell>
                  {showContextColumns && (
                    <TableCell className="text-xs text-muted-foreground">
                      {row.contract ? `HĐ: ${row.contract.code}` : row.warranty ? `BH: ${row.warranty.code}` : "—"}
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge variant={severityVariant[row.severity]}>{SEVERITY_LABELS[row.severity]}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[row.status]}>{STATUS_LABELS[row.status]}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(row.feedbackAt)}
                  </TableCell>
                  {!readonly && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(row)} aria-label="Sửa">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(row.id)}
                          aria-label="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Sửa phản ánh" : "Thêm phản ánh"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
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
                  onValueChange={(v) => setForm((f) => ({ ...f, severity: v as CustomerFeedbackSeverity }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(SEVERITY_LABELS) as CustomerFeedbackSeverity[]).map((k) => (
                      <SelectItem key={k} value={k}>{SEVERITY_LABELS[k]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v as CustomerFeedbackStatus }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_LABELS) as CustomerFeedbackStatus[]).map((k) => (
                      <SelectItem key={k} value={k}>{STATUS_LABELS[k]}</SelectItem>
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
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={() => void onSubmit()} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              {editing ? "Lưu" : "Thêm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteId)} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa phản ánh?</AlertDialogTitle>
            <AlertDialogDescription>Hành động này không thể hoàn tác.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void onConfirmDelete()}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
