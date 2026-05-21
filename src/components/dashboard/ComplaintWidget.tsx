import { AlertTriangle, Shield, Wrench, Clock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import FullscreenWrapper from "./FullscreenWrapper";

interface ComplaintWidgetProps {
  total: number;
  warranty: number;
  repair: number;
  processing: number;
  done: number;
  onTime: number;
  late: number;
}

const ComplaintWidget = ({ total, warranty, repair, processing, done, onTime, late }: ComplaintWidgetProps) => {
  const hasRisk = processing > 0 || late > 0;
  const byType = [
    { icon: Shield, label: "Bảo hành", value: warranty, color: "text-primary bg-primary/10" },
    { icon: Wrench, label: "Sửa chữa", value: repair, color: "text-accent bg-accent/10" },
  ];
  const byStatus = [
    {
      icon: Clock,
      label: "Đang xử lý",
      value: processing,
      color: processing > 0 ? "text-destructive bg-destructive/10" : "text-warning bg-warning/10",
      alert: processing > 0,
    },
    { icon: CheckCircle, label: "Hoàn thành", value: done, color: "text-success bg-success/10", alert: false },
  ];
  const showSlaFooter = onTime > 0 || late > 0;

  return (
    <FullscreenWrapper>
      <div
        className={cn(
          "rounded-xl bg-card p-4 sm:p-5 shadow-sm border h-full min-h-0 flex flex-col overflow-hidden",
          hasRisk ? "border-destructive/40 ring-1 ring-destructive/20" : "border-border/50",
        )}
      >
        <div className="flex items-center gap-3 mb-3 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-card-foreground">Phản ánh & Khiếu nại</h3>
            <p className="text-xs text-muted-foreground">
              Tổng: <span className="font-bold text-card-foreground">{total}</span>
              <span className="mx-1">·</span>
              Theo loại / trạng thái xử lý
            </p>
          </div>
        </div>

        {total === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Không có phản ánh trong kỳ lọc.</p>
        ) : (
          <div className="space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Theo loại phiếu</p>
            <div className="grid grid-cols-2 gap-2">
              {byType.map((s) => (
                <div key={s.label} className="flex items-center gap-2 rounded-lg bg-secondary/50 p-2.5">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${s.color}`}>
                    <s.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-lg font-bold text-card-foreground">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground pt-1">Tiến độ xử lý</p>
            <div className="grid grid-cols-2 gap-2">
              {byStatus.map((s) => (
                <div
                  key={s.label}
                  className={cn(
                    "flex items-center gap-2 rounded-lg p-2.5",
                    s.alert ? "bg-destructive/10 border border-destructive/30 dashboard-alert-pulse" : "bg-secondary/50",
                  )}
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${s.color}`}>
                    <s.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className={cn("text-xs", s.alert ? "text-destructive font-medium" : "text-muted-foreground")}>
                      {s.label}
                    </p>
                    <p className={cn("text-lg font-bold tabular-nums", s.alert ? "text-destructive" : "text-card-foreground")}>
                      {s.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showSlaFooter ? (
          <div className="mt-auto pt-3 flex flex-wrap gap-3 border-t border-border/50">
            {onTime > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 rounded-full bg-success" />
                <span className="text-muted-foreground">Đúng hạn:</span>
                <span className="font-semibold text-card-foreground">{onTime}</span>
              </div>
            )}
            {late > 0 && (
              <div className="flex items-center gap-2 text-sm rounded-md bg-destructive/10 px-2 py-1 dashboard-alert-pulse">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" />
                <span className="text-destructive font-medium">Trễ hạn SLA:</span>
                <span className="font-bold text-destructive tabular-nums">{late}</span>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </FullscreenWrapper>
  );
};

export default ComplaintWidget;
