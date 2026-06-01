import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { CustomerFeedbackEditForm } from "@/components/feedback/CustomerFeedbackEditForm";
import { FeedbackPageShell } from "@/components/feedback/FeedbackPageShell";
import { useCustomerFeedbackDetail } from "@/hooks/use-customer-feedbacks-api";
import { useRole } from "@/hooks/use-role";
import { feedbackPaths } from "@/lib/feedback-routes";
import { Navigate } from "react-router-dom";

const FeedbackEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { canDo } = useRole();
  const fixedContractId = searchParams.get("contractId") ?? undefined;

  const { data: row, isLoading, isError } = useCustomerFeedbackDetail(id);

  if (!canDo("phan-anh", "update")) {
    return <Navigate to={id ? feedbackPaths.detail(id) : feedbackPaths.list} replace />;
  }

  if (isLoading) {
    return (
      <FeedbackPageShell title="Sửa phản ánh" backTo={feedbackPaths.list}>
        <div className="flex items-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Đang tải…
        </div>
      </FeedbackPageShell>
    );
  }

  if (isError || !row) {
    return (
      <FeedbackPageShell title="Sửa phản ánh" backTo={feedbackPaths.list}>
        <p className="text-sm text-destructive">Không tải được phản ánh.</p>
      </FeedbackPageShell>
    );
  }

  return (
    <FeedbackPageShell
      title="Sửa phản ánh"
      subtitle={row.title}
      backTo={feedbackPaths.list}
    >
      <CustomerFeedbackEditForm
        row={row}
        fixedContractId={fixedContractId}
        onCancel={() => navigate(feedbackPaths.list)}
        onSaved={() => navigate(feedbackPaths.detail(row.id))}
      />
    </FeedbackPageShell>
  );
};

export default FeedbackEdit;
