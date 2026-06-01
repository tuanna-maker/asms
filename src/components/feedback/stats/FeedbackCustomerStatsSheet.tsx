import { Link } from "react-router-dom";
import { ExternalLink, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { FeedbackCustomerStatsDetail } from "@/hooks/use-feedback-analytics-api";
import type { CustomerFeedbackStatus } from "@/hooks/use-customer-feedbacks-api";
import { formatFeedbackDate, STATUS_LABELS, statusVariant } from "@/lib/customer-feedback-labels";
import { feedbackPaths } from "@/lib/feedback-routes";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: FeedbackCustomerStatsDetail | undefined;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
};

function linkageSummary(items: FeedbackCustomerStatsDetail["tickets"][0]["linkageItems"]) {
  if (items.length === 0) return "—";
  const parts = items.map((l) => {
    const sp = `${l.productCode} · ${l.productName}`;
    if (l.materialId) {
      return `${sp} / ${l.materialCode ?? l.materialId} · ${l.materialName ?? ""}`;
    }
    return sp;
  });
  return parts.join("; ");
}

export function FeedbackCustomerStatsSheet({
  open,
  onOpenChange,
  data,
  isLoading,
  isError,
  onRetry,
}: Props) {
  const customer = data?.customer;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle>
            {customer ? `${customer.code} — ${customer.name}` : "Chi tiết khách hàng"}
          </SheetTitle>
          <SheetDescription>
            Ticket phản ánh trong kỳ đã chọn, kèm liên kết sản phẩm / vật tư.
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <p className="text-sm text-muted-foreground flex items-center gap-2 py-6">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang tải chi tiết…
          </p>
        ) : null}

        {isError && !isLoading ? (
          <div className="py-4 space-y-2">
            <p className="text-sm text-destructive">Không tải được chi tiết.</p>
            {onRetry ? (
              <Button type="button" variant="outline" size="sm" onClick={() => void onRetry()}>
                Thử lại
              </Button>
            ) : null}
          </div>
        ) : null}

        {data && !isLoading ? (
          <>
            <div className="grid grid-cols-3 gap-2 text-center text-sm py-2 border-y">
              <div>
                <p className="text-muted-foreground text-xs">Ticket</p>
                <p className="font-semibold">{data.summary.ticketCount}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Đang mở</p>
                <p className="font-semibold">{data.summary.openCount}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Đã đóng</p>
                <p className="font-semibold">{data.summary.resolvedCount}</p>
              </div>
            </div>
            <ScrollArea className="flex-1 -mx-1 px-1">
              {data.tickets.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">Không có ticket trong kỳ.</p>
              ) : (
                <ul className="space-y-4 py-2">
                  {data.tickets.map((t) => (
                    <li key={t.id} className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm leading-snug">{t.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatFeedbackDate(t.feedbackAt)}
                          </p>
                        </div>
                        <Badge variant={statusVariant[t.status as CustomerFeedbackStatus]}>
                          {STATUS_LABELS[t.status as CustomerFeedbackStatus] ?? t.status}
                        </Badge>
                      </div>
                      {t.content ? (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">
                          {t.content}
                        </p>
                      ) : null}
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">SP/VT: </span>
                        {linkageSummary(t.linkageItems)}
                      </p>
                      <Button variant="link" size="sm" className="h-auto p-0" asChild>
                        <Link to={feedbackPaths.detail(t.id)}>
                          Xem ticket
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
