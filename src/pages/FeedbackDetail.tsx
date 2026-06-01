import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
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
import { CustomerFeedbackDetailView } from "@/components/feedback/CustomerFeedbackDetailView";
import { FeedbackPageShell } from "@/components/feedback/FeedbackPageShell";
import {
  useCustomerFeedbackDetail,
  useDeleteCustomerFeedback,
} from "@/hooks/use-customer-feedbacks-api";
import { useRole } from "@/hooks/use-role";
import { feedbackPaths } from "@/lib/feedback-routes";
import { toast } from "sonner";
import { toastApiError } from "@/lib/api-errors";

const FeedbackDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canDo } = useRole();
  const canWrite = canDo("phan-anh", "create") || canDo("phan-anh", "update");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: row, isLoading, isError, refetch } = useCustomerFeedbackDetail(id);
  const deleteMut = useDeleteCustomerFeedback();

  const onConfirmDelete = async () => {
    if (!row) return;
    try {
      await deleteMut.mutateAsync(row.id);
      toast.success("Đã xóa phản ánh");
      navigate(feedbackPaths.list);
    } catch (e) {
      toastApiError(e, "Không xóa được phản ánh");
    }
  };

  if (isLoading) {
    return (
      <FeedbackPageShell title="Chi tiết phản ánh" backTo={feedbackPaths.list}>
        <div className="flex items-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Đang tải…
        </div>
      </FeedbackPageShell>
    );
  }

  if (isError || !row) {
    return (
      <FeedbackPageShell title="Chi tiết phản ánh" backTo={feedbackPaths.list}>
        <p className="text-sm text-destructive">Không tải được phản ánh.</p>
      </FeedbackPageShell>
    );
  }

  return (
    <FeedbackPageShell
      title={row.title}
      subtitle="Chi tiết ticket phản ánh khách hàng"
      backTo={feedbackPaths.list}
    >
      <CustomerFeedbackDetailView
        row={row}
        readonly={!canWrite}
        onRefresh={() => void refetch()}
        onEdit={canWrite ? () => navigate(feedbackPaths.edit(row.id)) : undefined}
        onDelete={canDo("phan-anh", "delete") ? () => setDeleteOpen(true) : undefined}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa phản ánh?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{row.title}&quot; — hành động này không thể hoàn tác.
            </AlertDialogDescription>
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
    </FeedbackPageShell>
  );
};

export default FeedbackDetail;
