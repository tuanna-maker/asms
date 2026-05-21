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
        "flex items-center gap-3 sm:gap-4 rounded-xl bg-card p-4 sm:p-5 shadow-sm border h-full min-h-[5.5rem] transition-colors",
        isCritical
          ? "border-destructive/50 bg-destructive/5 ring-1 ring-destructive/25 dashboard-alert-pulse"
          : isWarning
            ? "border-warning/45 bg-warning/5 ring-1 ring-warning/20"
            : "border-border/50",
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg",
          isCritical
            ? "bg-destructive text-destructive-foreground"
            : isWarning
              ? "bg-warning/15 text-warning"
              : colorMap[color],
        )}
      >
        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-xs sm:text-sm",
            isCritical ? "text-destructive font-medium" : isWarning ? "text-warning font-medium" : "text-muted-foreground",
          )}
        >
          {title}
        </p>
        <p
          className={cn(
            isLongText
              ? "text-sm sm:text-base font-semibold leading-snug mt-1 line-clamp-2 break-words"
              : "text-xl sm:text-2xl font-bold leading-tight mt-0.5 tabular-nums",
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
              "text-[10px] sm:text-xs mt-1",
              isCritical ? "text-destructive/80" : "text-muted-foreground",
            )}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatCard;
