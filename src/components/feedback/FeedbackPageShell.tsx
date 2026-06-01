import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { feedbackPaths } from "@/lib/feedback-routes";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  backTo?: string;
};

export function FeedbackPageShell({ title, subtitle, children, backTo }: Props) {
  const navigate = useNavigate();

  const goBack = () => {
    navigate(backTo ?? feedbackPaths.list);
  };

  return (
    <div className="space-y-6 w-full max-w-none -m-3 sm:-m-6 p-4 sm:p-6 min-h-[calc(100dvh-7rem)] flex flex-col">
      <div className="flex flex-col gap-3 shrink-0">
        <Button type="button" variant="ghost" size="sm" className="w-fit -ml-2" onClick={goBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Quay lại
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-card-foreground">{title}</h1>
          {subtitle ? <p className="text-sm text-muted-foreground mt-1">{subtitle}</p> : null}
        </div>
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}
