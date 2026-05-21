import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import FullscreenWrapper from "./FullscreenWrapper";

interface ProgressItem {
  label: string;
  value: number;
  color: string;
}

interface ProgressWidgetProps {
  title: string;
  icon: LucideIcon;
  total: number;
  items: ProgressItem[];
  completedOnTime?: number;
  completedLate?: number;
}

const ProgressWidget = ({ title, icon: Icon, total, items, completedOnTime, completedLate }: ProgressWidgetProps) => {
  const hasLate = (completedLate ?? 0) > 0;

  return (
    <FullscreenWrapper>
      <div
        className={cn(
          "rounded-xl bg-card p-4 sm:p-5 shadow-sm border h-full min-h-0 flex flex-col overflow-hidden",
          hasLate ? "border-destructive/40 ring-1 ring-destructive/20" : "border-border/50",
        )}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg",
              hasLate ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary",
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <h3 className="font-semibold text-card-foreground">{title}</h3>
          <span className="ml-auto text-xl sm:text-2xl font-bold text-card-foreground">{total}</span>
        </div>

        {hasLate && (
          <div className="mb-3 flex items-center justify-between gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 dashboard-alert-pulse">
            <span className="text-xs font-medium text-destructive">Chậm tiến độ</span>
            <span className="text-lg font-bold text-destructive tabular-nums">{completedLate}</span>
          </div>
        )}

        <div className="space-y-3 flex-1 min-h-0 overflow-hidden">
          {items.map((item, i) => {
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
            return (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium text-card-foreground">
                    {item.value} <span className="text-muted-foreground text-xs">({pct}%)</span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-secondary">
                  <div
                    className={`h-2 rounded-full transition-all ${item.color}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {(completedOnTime !== undefined || completedLate !== undefined) && (
          <div className="mt-4 flex flex-wrap gap-3 sm:gap-4 pt-3 border-t border-border/50">
            {completedOnTime !== undefined && (
              <div className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 rounded-full bg-success" />
                <span className="text-muted-foreground">Đúng hạn:</span>
                <span className="font-semibold text-card-foreground">{completedOnTime}</span>
              </div>
            )}
            {completedLate !== undefined && completedLate > 0 && (
              <div className="flex items-center gap-2 text-sm rounded-md bg-destructive/10 px-2 py-1">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" />
                <span className="text-destructive font-medium">Chậm tiến độ:</span>
                <span className="font-bold text-destructive tabular-nums">{completedLate}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </FullscreenWrapper>
  );
};

export default ProgressWidget;
