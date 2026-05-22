import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  useCustomerFeedbacksList,
  useDeleteCustomerFeedback,
  type CustomerFeedbackRow,
} from "@/hooks/use-customer-feedbacks-api";
import {
  SEVERITY_LABELS,
  STATUS_LABELS,
  formatFeedbackDate,
  severityVariant,
  statusVariant,
} from "@/lib/customer-feedback-labels";
import { CustomerFeedbackFormDialog } from "@/components/feedback/CustomerFeedbackFormDialog";

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
  const deleteMut = useDeleteCustomerFeedback();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerFeedbackRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (row: CustomerFeedbackRow) => {
    setEditing(row);
    setDialogOpen(true);
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
                    <p className="truncate" title={row.title}>
                      {row.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5" title={row.content}>
                      {row.content}
                    </p>
                  </TableCell>
                  {showContextColumns && (
                    <TableCell className="text-xs text-muted-foreground">
                      {row.contract
                        ? `HĐ: ${row.contract.code}`
                        : row.warranty
                          ? `BH: ${row.warranty.code}`
                          : "—"}
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge variant={severityVariant[row.severity]}>
                      {SEVERITY_LABELS[row.severity]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[row.status]}>{STATUS_LABELS[row.status]}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatFeedbackDate(row.feedbackAt)}
                  </TableCell>
                  {!readonly && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(row)}
                          aria-label="Sửa"
                        >
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

      <CustomerFeedbackFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        customerId={customerId}
        contractId={contractId}
        warrantyId={warrantyId}
      />

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
