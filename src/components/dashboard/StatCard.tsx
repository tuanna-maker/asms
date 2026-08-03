import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatCardAlertLevel = "warning" | "critical";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: "primary" | "success" | "warning" | "destructive" | "info" | "accent";
  subtitle?: string;
  /** Làm nổi bật chỉ số xấu (đỏ/vàng) khi giá trị số > 0 */
  alertLevel?: StatCardAlertLevel;
}

const colorMap = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  info: "bg-info/10 text-info",
  accent: "bg-accent/10 text-accent",
};

const StatCard = ({ title, value, icon: Icon, color, subtitle, alertLevel }: StatCardProps) => {
  const valueStr = String(value);
  const isLongText = valueStr.length > 14;
  const numericValue = typeof value === "number" ? value : Number(value);
  const isNumericAlert = !Number.isNaN(numericValue) && numericValue > 0;
  const isCritical = alertLevel === "critical" && isNumericAlert;
  const isWarning = alertLevel === "warning" && isNumericAlert;

  return (
    <div
      className={cn(
        "flex items-center gap-2 sm:gap-3 rounded-xl bg-card p-2 sm:p-3 shadow-sm border h-full min-h-0 min-w-0 transition-colors",
        isCritical
          ? "border-destructive/50 bg-destructive/5 ring-1 ring-destructive/25 dashboard-alert-pulse"
          : isWarning
            ? "border-warning/45 bg-warning/5 ring-1 ring-warning/20"
            : "border-border/50",
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg",
          isCritical
            ? "bg-destructive text-destructive-foreground"
            : isWarning
              ? "bg-warning/15 text-warning"
              : colorMap[color],
        )}
      >
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        <p
          className={cn(
            "text-[10px] sm:text-xs leading-tight truncate",
            isCritical ? "text-destructive font-medium" : isWarning ? "text-warning font-medium" : "text-muted-foreground",
          )}
          title={title}
        >
          {title}
        </p>
        <p
          className={cn(
            isLongText
              ? "text-xs sm:text-sm font-semibold leading-snug mt-0.5 line-clamp-2 break-words"
              : "text-base sm:text-lg font-bold leading-tight tabular-nums",
            isCritical
              ? "text-destructive"
              : isWarning
                ? "text-warning"
                : "text-card-foreground",
          )}
        >
          {value}
        </p>
        {subtitle && (
          <p
            className={cn(
              "text-[10px] sm:text-xs mt-0.5 truncate",
              isCritical ? "text-destructive/80" : "text-muted-foreground",
            )}
            title={subtitle}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatCard;
