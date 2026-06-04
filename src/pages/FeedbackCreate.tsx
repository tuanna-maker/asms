import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { FeedbackIntakeWizard } from "@/components/feedback/FeedbackIntakeWizard";
import { FeedbackPageShell } from "@/components/feedback/FeedbackPageShell";
import { useRole } from "@/hooks/use-role";
import { feedbackPaths } from "@/lib/feedback-routes";

const FeedbackCreate = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { canDo } = useRole();

  const customerId = searchParams.get("customerId") ?? undefined;
  const contractId = searchParams.get("contractId") ?? undefined;

  if (!canDo("phan-anh", "create")) {
    return <Navigate to={feedbackPaths.list} replace />;
  }

  return (
    <FeedbackPageShell
      title="Thêm phản ánh"
      subtitle="Thu thập thông tin và giao đơn vị xử lý"
      backTo={feedbackPaths.list}
    >
      <FeedbackIntakeWizard
          fixedCustomerId={customerId}
          fixedContractId={contractId}
          requireCustomerSelect={!customerId}
          onSuccess={(createdId) => navigate(feedbackPaths.detail(createdId))}
          onCancel={() => navigate(feedbackPaths.list)}
      />
    </FeedbackPageShell>
  );
};

export default FeedbackCreate;
